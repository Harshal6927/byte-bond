from litestar import Request, get, post
from litestar.controller import Controller
from litestar.di import Provide
from litestar.exceptions import NotAuthorizedException

from backend.lib.dependencies import (
    provide_connection_question_service,
    provide_connection_service,
    provide_event_service,
    provide_question_service,
    provide_user_service,
)
from backend.lib.services import ConnectionService, EventService, UserService
from backend.lib.utils import admin_user_guard
from backend.models import Connection, ConnectionStatus, User, UserStatus
from backend.schema.event import GetEvent
from backend.schema.game import (
    GameStartRequest,
    GameStatus,
    GameStopRequest,
    QRScanRequest,
)


class GameController(Controller):
    path = "/api/game"
    tags = ["Game"]
    dependencies = {
        "connection_service": Provide(provide_connection_service),
        "event_service": Provide(provide_event_service),
        "user_service": Provide(provide_user_service),
        "question_service": Provide(provide_question_service),
        "connection_question_service": Provide(provide_connection_question_service),
    }

    @post("/start", guards=[admin_user_guard])
    async def start_game(
        self,
        data: GameStartRequest,
        event_service: EventService,
    ) -> GetEvent:
        event = await event_service.update(item_id=data.event_id, data={"is_active": True})
        return event_service.to_schema(event, schema_type=GetEvent)

    @post("/stop", guards=[admin_user_guard])
    async def stop_game(
        self,
        data: GameStopRequest,
        event_service: EventService,
        connection_service: ConnectionService,
        user_service: UserService,
    ) -> GetEvent:
        event = await event_service.update(item_id=data.event_id, data={"is_active": False})

        # Cancel all pending/active connections for this event and set users back to available
        pending_connections = await connection_service.list(
            Connection.status.in_([ConnectionStatus.PENDING, ConnectionStatus.ACTIVE]),
            event_id=data.event_id,
        )

        connection_data = []
        user_data = []
        for conn in pending_connections:
            connection_data.append(
                {"id": conn.id, "status": ConnectionStatus.CANCELLED},
            )
            user_data.extend(
                {"id": conn.user1_id, "status": UserStatus.AVAILABLE},
                {"id": conn.user2_id, "status": UserStatus.AVAILABLE},
            )
        await connection_service.update(connection_data)
        await user_service.update(user_data)

        return event_service.to_schema(event, schema_type=GetEvent)

    @get("/status")
    async def get_game_status(
        self,
        request: Request,
        user_service: UserService,
        connection_service: ConnectionService,
    ) -> GameStatus:
        user: User = request.user

        # Get user's current active connection
        current_connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )
        qr_code = None
        partner_name = None

        if current_connection:
            # Determine if user should show QR code (user1) or scan (user2)
            if current_connection.user1_id == user.id:
                qr_code = user.qr_code

            # Get partner's name
            partner = await user_service.get(
                current_connection.user2_id if current_connection.user1_id == user.id else current_connection.user1_id,
            )
            partner_name = partner.name

        return GameStatus(
            user_status=user.status,
            qr_code=qr_code,
            partner_name=partner_name,
        )

    @post("/scan-qr")
    async def scan_qr_code(
        self,
        data: QRScanRequest,
        request: Request,
        connection_service: ConnectionService,
        user_service: UserService,
    ) -> None:
        user: User = request.user

        # Get user's current active connection
        current_connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )

        # Check if logged in user is user1 (QR giver)
        if not current_connection or current_connection.user1_id == user.id:
            raise NotAuthorizedException

        # Verify the QR code matches user1's QR code
        user1 = await user_service.get(current_connection.user1_id)
        if user1.qr_code != data.qr_code:
            raise NotAuthorizedException(detail="Invalid QR code scanned")

        # Activate the connection
        await connection_service.update(
            item_id=current_connection.id,
            data={"status": ConnectionStatus.ACTIVE},
        )

        # Set both users to busy status
        await user_service.update_many(
            [
                {"id": current_connection.user1_id, "status": UserStatus.BUSY},
                {"id": current_connection.user2_id, "status": UserStatus.BUSY},
            ],
        )

    async def _get_user_active_connection(
        self,
        user_id: int,
        event_id: int | None,
        connection_service: ConnectionService,
    ) -> Connection | None:
        # Check as user1
        connection = await connection_service.get_one_or_none(
            Connection.status.in_([ConnectionStatus.PENDING, ConnectionStatus.ACTIVE]),
            user1_id=user_id,
            event_id=event_id,
        )
        if connection:
            return connection

        # Check as user2
        return await connection_service.get_one_or_none(
            Connection.status.in_([ConnectionStatus.PENDING, ConnectionStatus.ACTIVE]),
            user2_id=user_id,
            event_id=event_id,
        )
