from datetime import datetime

from msgspec import UNSET, Struct, UnsetType

from backend.models import UserStatus


class PostUser(Struct):
    name: str
    email: str
    event_code: str


class GetUser(Struct):
    id: int
    name: str
    email: str
    points: int
    qr_code: str
    connection_count: int
    status: UserStatus
    is_admin: bool
    event_id: int | None
    created_at: datetime
    updated_at: datetime


class PatchUser(Struct):
    name: str | UnsetType = UNSET


class DeleteUser(Struct):
    id: int
