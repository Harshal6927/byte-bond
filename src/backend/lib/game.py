import random
from datetime import UTC, datetime
from itertools import combinations

from saq.types import Context

from backend.config import sqlalchemy_config
from backend.lib.dependencies import provide_connection_service, provide_event_service, provide_user_service
from backend.lib.services import ConnectionService, UserService
from backend.models import Connection, ConnectionStatus, Event, UserStatus

MINIMUM_REQUIRED_USERS = 2


async def _create_connection(user_service: UserService, connection_service: ConnectionService, event: Event) -> None:
    available_users = await user_service.list(
        event_id=event.id,
        status=UserStatus.AVAILABLE,
        is_admin=False,
    )

    if len(available_users) < MINIMUM_REQUIRED_USERS:
        return

    existing_connections = await connection_service.list(event_id=event.id)
    existing_pairs = {tuple(sorted((c.user1_id, c.user2_id))) for c in existing_connections}

    random.shuffle(available_users)
    user_ids = [user.id for user in available_users]

    paired_user_ids = set()
    new_connections = []

    # Create all potential pairs and filter out existing ones
    possible_new_pairs = [pair for pair in combinations(user_ids, 2) if tuple(sorted(pair)) not in existing_pairs]
    random.shuffle(possible_new_pairs)

    for user1_id, user2_id in possible_new_pairs:
        if user1_id not in paired_user_ids and user2_id not in paired_user_ids:
            new_connections.append(
                {
                    "event_id": event.id,
                    "user1_id": user1_id,  # QR code presenter
                    "user2_id": user2_id,  # QR code scanner
                },
            )
            paired_user_ids.add(user1_id)
            paired_user_ids.add(user2_id)

    if not new_connections:
        return

    users_to_update = [{"id": user_id, "status": UserStatus.CONNECTING} for user_id in paired_user_ids]

    await connection_service.create_many(new_connections)
    await user_service.update_many(users_to_update)


async def _cleanup_expired_connections(
    user_service: UserService,
    connection_service: ConnectionService,
    event: Event,
) -> None:
    current_time = datetime.now(UTC)

    # Find expired connections that are still pending or active
    expired_connections = await connection_service.list(
        Connection.status.in_([ConnectionStatus.PENDING, ConnectionStatus.ACTIVE]),
        Connection.end_time < current_time,
        event_id=event.id,
    )

    if not expired_connections:
        return

    connection_ids_to_cancel = {conn.id for conn in expired_connections}
    user_ids_to_make_available = set()

    for conn in expired_connections:
        user_ids_to_make_available.add(conn.user1_id)
        user_ids_to_make_available.add(conn.user2_id)

    if connection_ids_to_cancel:
        await connection_service.update_many(
            [{"id": conn_id, "status": ConnectionStatus.CANCELLED} for conn_id in connection_ids_to_cancel],
        )

    if user_ids_to_make_available:
        await user_service.update_many(
            [{"id": user_id, "status": UserStatus.AVAILABLE} for user_id in user_ids_to_make_available],
        )


async def process_game(_: Context) -> None:
    active_events = []

    async with sqlalchemy_config.get_session() as db_session:
        connection_service = await anext(provide_connection_service(db_session))
        event_service = await anext(provide_event_service(db_session))
        user_service = await anext(provide_user_service(db_session))

        active_events = await event_service.list(Event.is_active.is_(True))
        for event in active_events:
            await _cleanup_expired_connections(
                user_service=user_service,
                connection_service=connection_service,
                event=event,
            )

        await db_session.commit()

    async with sqlalchemy_config.get_session() as db_session:
        connection_service = await anext(provide_connection_service(db_session))
        user_service = await anext(provide_user_service(db_session))

        for event in active_events:
            await _create_connection(
                user_service=user_service,
                connection_service=connection_service,
                event=event,
            )

        await db_session.commit()
