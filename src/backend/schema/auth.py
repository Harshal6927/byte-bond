from msgspec import Struct


class PostLogin(Struct):
    email: str
    event_code: str
