from datetime import datetime

from litestar.datastructures import UploadFile
from msgspec import UNSET, Struct, UnsetType


class PostNote(Struct):
    title: str
    body: str | None = None
    files: list[UploadFile] | None = None


class GetNote(Struct):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    body: str | None = None
    files: list[str] | None = None


class PatchNote(Struct):
    title: str | UnsetType = UNSET
    body: str | UnsetType | None = UNSET
    files: list[UploadFile] | UnsetType | None = UNSET


class DeleteNote(Struct):
    id: int
