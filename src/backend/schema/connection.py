from datetime import datetime

from msgspec import UNSET, Struct, UnsetType

from backend.models import ConnectionStatus


class PostConnection(Struct):
    event_id: int
    user1_id: int
    user2_id: int
    end_time: datetime | UnsetType = UNSET


class GetConnection(Struct):
    id: int
    start_time: datetime
    end_time: datetime
    status: ConnectionStatus
    event_id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    updated_at: datetime


class PatchConnection(Struct):
    start_time: datetime | UnsetType = UNSET
    end_time: datetime | UnsetType = UNSET
    status: ConnectionStatus | UnsetType = UNSET
    event_id: int | UnsetType = UNSET
    user1_id: int | UnsetType = UNSET
    user2_id: int | UnsetType = UNSET
