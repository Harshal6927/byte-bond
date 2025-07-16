from typing import Annotated

from msgspec import Meta, Struct


class PostLogin(Struct):
    email: Annotated[str, Meta(min_length=1)]
    event_code: Annotated[str, Meta(min_length=1, max_length=64)]
