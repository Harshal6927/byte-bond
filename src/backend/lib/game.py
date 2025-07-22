import random

from saq.types import Context

from backend.config import sqlalchemy_config
from backend.lib.dependencies import provide_connection_service, provide_event_service, provide_user_service
from backend.lib.services import ConnectionService, UserService
from backend.models import Event, UserStatus


async def _create_connection(user_service: UserService, connection_service: ConnectionService, event: Event) -> None:
    available_users = await user_service.list(
        event_id=event.id,
        status=UserStatus.AVAILABLE,
        is_admin=False,
    )

    random.shuffle(available_users)

    new_connections = []
    update_users = []
    for i in range(0, len(available_users) - 1, 2):
        user1 = available_users[i]
        user2 = available_users[i + 1]

        new_connections.append(
            {
                "event_id": event.id,
                "user1_id": user1.id,  # QR code presenter
                "user2_id": user2.id,  # QR code scanner
            },
        )

        update_users.extend(
            [
                {"id": user1.id, "status": UserStatus.CONNECTING},
                {"id": user2.id, "status": UserStatus.CONNECTING},
            ],
        )

    await connection_service.create_many(new_connections)
    await user_service.update_many(update_users)


async def process_game(_: Context) -> None:
    async with sqlalchemy_config.get_session() as db_session:
        connection_service = await anext(provide_connection_service(db_session))
        event_service = await anext(provide_event_service(db_session))
        user_service = await anext(provide_user_service(db_session))

        active_events = await event_service.list(Event.is_active.is_(True))
        for event in active_events:
            await _create_connection(user_service=user_service, connection_service=connection_service, event=event)

        await db_session.commit()
