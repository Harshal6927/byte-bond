from typing import Annotated

from msgspec import Meta, Struct

from src.backend.models import UserStatus


class GameStartRequest(Struct):
    event_id: Annotated[int, Meta(gt=0)]


class GameStopRequest(Struct):
    event_id: Annotated[int, Meta(gt=0)]


class ConnectionQuestionData(Struct):
    id: int
    question_id: int
    question_text: str
    question_answered: bool
    answered_correctly: bool


class GameStatus(Struct):
    user_status: UserStatus
    qr_code: str | None
    partner_name: str | None
    connection_questions: list[ConnectionQuestionData] | None


class QRScanRequest(Struct):
    qr_code: Annotated[str, Meta(min_length=1)]


class GameQuestionResponse(Struct):
    question_id: Annotated[int, Meta(gt=0)]
    answer: Annotated[str, Meta(min_length=1)]


class QuestionResult(Struct):
    correct: bool
    expected_answer: str
    your_answer: str


class GameChatRequest(Struct):
    message: Annotated[str, Meta(min_length=1)]


class LeaderboardEntry(Struct):
    id: int
    name: str
    email: str
    points: int
    connection_count: int
    rank: int


class Leaderboard(Struct):
    event_id: int
    event_name: str
    entries: list[LeaderboardEntry]
    total_users: int
