import datetime
import uuid
from enum import StrEnum

from advanced_alchemy.base import BigIntAuditBase
from advanced_alchemy.types import DateTimeUTC
from sqlalchemy import CheckConstraint, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship


class ConnectionStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class UserStatus(StrEnum):
    AVAILABLE = "available"
    CONNECTING = "connecting"
    BUSY = "busy"


class Event(BigIntAuditBase):
    """Represents an event, which groups users together.

    Similar to a 'room' or 'game session' in Kahoot.
    """

    __tablename__ = "events"

    name: Mapped[str]
    code: Mapped[str] = mapped_column(unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=False)  # True if the event is currently active for connections
    whitelist: Mapped[dict] = mapped_column(JSONB, default={})  # Whitelisted email should in a list with key "emails"

    # -----------------
    # ORM Relationships
    # -----------------

    users: Mapped[list["User"]] = relationship(back_populates="event")
    connections: Mapped[list["Connection"]] = relationship(back_populates="event")

    def __repr__(self):
        return f"<Event(id={self.id}, name='{self.name}', code='{self.code}', active={self.is_active})>"


class User(BigIntAuditBase):
    """Represents an attendee/player in the game."""

    __tablename__ = "users"
    __table_args__ = (
        # Ensure email is unique within each event, but same email can exist across different events
        UniqueConstraint("email", "event_id", name="uq_user_email_event"),
        # Index for leaderboard queries (event + points descending)
        Index("ix_user_event_points", "event_id", "points"),
    )

    name: Mapped[str]
    email: Mapped[str]
    points: Mapped[int] = mapped_column(default=0)
    qr_code: Mapped[str] = mapped_column(default=lambda: uuid.uuid4().hex, unique=True, index=True)
    connection_count: Mapped[int] = mapped_column(default=0)
    status: Mapped[UserStatus] = mapped_column(default=UserStatus.AVAILABLE)
    is_admin: Mapped[bool] = mapped_column(default=False)
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=True)

    # -----------------
    # ORM Relationships
    # -----------------

    event: Mapped["Event"] = relationship(back_populates="users")
    answers: Mapped[list["UserAnswer"]] = relationship(back_populates="user")
    # Relationships for connections where this user is user1 (QR giver) or user2 (scanner)
    connections_as_user1: Mapped["Connection"] = relationship(
        foreign_keys="[Connection.user1_id]",
        back_populates="user1",
    )
    connections_as_user2: Mapped["Connection"] = relationship(
        foreign_keys="[Connection.user2_id]",
        back_populates="user2",
    )

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', points={self.points}, status='{self.status}')>"


class Question(BigIntAuditBase):
    """Represents a predefined question used in the game.

    Questions can be asked during signup.
    """

    __tablename__ = "questions"

    question: Mapped[str]
    is_signup_question: Mapped[bool] = mapped_column(default=True)  # True if asked during user signup
    is_game_question: Mapped[bool] = mapped_column(default=True)  # True if asked during a connection game round

    # -----------------
    # ORM Relationships
    # -----------------

    user_answers: Mapped[list["UserAnswer"]] = relationship(back_populates="question")
    connection_questions: Mapped[list["ConnectionQuestion"]] = relationship(back_populates="question")

    def __repr__(self):
        return f"<Question(id={self.id}, question='{self.question}')>"


class UserAnswer(BigIntAuditBase):
    """Stores a user's specific answer to a question.

    These are the answers provided during the signup process.
    """

    __tablename__ = "user_answers"
    __table_args__ = (
        # Ensure a user can only answer each question once
        UniqueConstraint("user_id", "question_id", name="uq_user_question"),
    )

    answer: Mapped[str]
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"))

    # -----------------
    # ORM Relationships
    # -----------------

    user: Mapped["User"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship(back_populates="user_answers")

    def __repr__(self):
        return f"<UserAnswer(user_id={self.user_id}, question_id={self.question_id}, answer='{self.answer}')>"


class Connection(BigIntAuditBase):
    """Represents a pairing between two users for a game round."""

    __tablename__ = "connections"
    __table_args__ = (
        # Prevent duplicate connections between same users
        UniqueConstraint("event_id", "user1_id", "user2_id", name="uq_connection_users"),
        # Ensure user1 and user2 are different
        CheckConstraint("user1_id != user2_id", name="ck_different_users"),
    )

    start_time: Mapped[datetime.datetime] = mapped_column(
        DateTimeUTC(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
    )
    end_time: Mapped[datetime.datetime] = mapped_column(
        DateTimeUTC(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )
    status: Mapped[ConnectionStatus] = mapped_column(default=ConnectionStatus.PENDING)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    user1_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))  # User who presents the QR code
    user2_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))  # User who scans the QR code

    # -----------------
    # ORM Relationships
    # -----------------

    event: Mapped["Event"] = relationship(back_populates="connections")
    user1: Mapped["User"] = relationship(foreign_keys=[user1_id], back_populates="connections_as_user1")
    user2: Mapped["User"] = relationship(foreign_keys=[user2_id], back_populates="connections_as_user2")
    connection_questions: Mapped[list["ConnectionQuestion"]] = relationship(back_populates="connection")

    def __repr__(self):
        return f"<Connection(id={self.id}, user1={self.user1_id}, user2={self.user2_id}, status='{self.status}')>"


class ConnectionQuestion(BigIntAuditBase):
    """Tracks which questions were asked within a specific connection and whether each user answered correctly."""

    __tablename__ = "connection_questions"
    __table_args__ = (
        # Ensure each question is only asked once per connection
        UniqueConstraint("connection_id", "question_id", name="uq_connection_question"),
    )

    user1_correct: Mapped[bool] = mapped_column()
    user2_correct: Mapped[bool] = mapped_column()
    connection_id: Mapped[int] = mapped_column(ForeignKey("connections.id", ondelete="CASCADE"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"))

    # -----------------
    # ORM Relationships
    # -----------------

    connection: Mapped["Connection"] = relationship(back_populates="connection_questions")
    question: Mapped["Question"] = relationship(back_populates="connection_questions")

    def __repr__(self):
        return (
            f"<ConnectionQuestion(conn_id={self.connection_id}, q_id={self.question_id}, "
            f"u1_corr={self.user1_correct}, u2_corr={self.user2_correct})>"
        )
