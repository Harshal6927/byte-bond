from datetime import datetime
from typing import Annotated

from msgspec import UNSET, Meta, Struct, UnsetType


class PostEvent(Struct):
    name: Annotated[str, Meta(min_length=1)]
    code: Annotated[str, Meta(min_length=1, max_length=64)]


class GetEvent(Struct):
    id: int
    name: str
    code: str
    is_active: bool
    whitelist: dict
    created_at: datetime
    updated_at: datetime


class PatchEvent(Struct):
    name: Annotated[str, Meta(min_length=1)] | UnsetType = UNSET
    code: Annotated[str, Meta(min_length=1, max_length=64)] | UnsetType = UNSET
    is_active: bool | UnsetType = UNSET
    whitelist: dict | UnsetType = UNSET
