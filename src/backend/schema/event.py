from datetime import datetime

from msgspec import UNSET, Struct, UnsetType


class PostEvent(Struct):
    name: str
    code: str


class GetEvent(Struct):
    id: int
    name: str
    code: str
    is_active: bool
    whitelist: dict
    created_at: datetime
    updated_at: datetime


class PatchEvent(Struct):
    name: str | UnsetType = UNSET
    code: str | UnsetType = UNSET
    is_active: bool | UnsetType = UNSET
    whitelist: dict | UnsetType = UNSET


class DeleteEvent(Struct):
    id: int
