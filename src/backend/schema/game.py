from typing import Annotated

from msgspec import Meta, Struct

from backend.models import UserStatus


class GameStartRequest(Struct):
    event_id: Annotated[int, Meta(gt=0)]


class GameStopRequest(Struct):
    event_id: Annotated[int, Meta(gt=0)]


class GameStatus(Struct):
    user_status: UserStatus
    qr_code: str | None
    partner_name: str | None


class QRScanRequest(Struct):
    qr_code: Annotated[str, Meta(min_length=1)]
