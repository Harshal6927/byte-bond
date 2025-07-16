from datetime import datetime
from typing import Annotated

from msgspec import UNSET, Meta, Struct, UnsetType


class PostUserAnswer(Struct):
    answer: Annotated[str, Meta(min_length=1)]
    question_id: Annotated[int, Meta(gt=0)]


class GetUserAnswer(Struct):
    id: int
    answer: str
    user_id: int
    question_id: int
    created_at: datetime
    updated_at: datetime


class PatchUserAnswer(Struct):
    answer: Annotated[str, Meta(min_length=1)] | UnsetType = UNSET
