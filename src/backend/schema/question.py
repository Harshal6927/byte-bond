from datetime import datetime
from typing import Annotated

from msgspec import UNSET, Meta, Struct, UnsetType


class PostQuestion(Struct):
    question: Annotated[str, Meta(min_length=1)]
    is_signup_question: bool
    is_game_question: bool


class GetQuestion(Struct):
    id: int
    question: str
    is_signup_question: bool
    is_game_question: bool
    created_at: datetime
    updated_at: datetime


class PatchQuestion(Struct):
    question: Annotated[str, Meta(min_length=1)] | UnsetType = UNSET
    is_signup_question: bool | UnsetType = UNSET
    is_game_question: bool | UnsetType = UNSET
