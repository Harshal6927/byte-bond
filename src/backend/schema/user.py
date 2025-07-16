from datetime import datetime
from typing import Annotated

from msgspec import UNSET, Meta, Struct, UnsetType

from backend.models import UserStatus


class PostUser(Struct):
    name: Annotated[str, Meta(min_length=1)]
    email: Annotated[str, Meta(min_length=1)]
    event_code: Annotated[str, Meta(min_length=1, max_length=64)]


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
    name: Annotated[str, Meta(min_length=1)] | UnsetType = UNSET
