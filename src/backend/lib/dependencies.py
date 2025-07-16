from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from backend.lib.services import (
    ConnectionQuestionService,
    ConnectionService,
    EventService,
    QuestionService,
    UserAnswerService,
    UserService,
)


async def provide_event_service(
    db_session: AsyncSession | None = None,
) -> AsyncGenerator[EventService, None]:
    async with EventService.new(
        session=db_session,
        error_messages={
            "not_found": "No event found with the given ID.",
        },
    ) as service:
        yield service


async def provide_user_service(
    db_session: AsyncSession | None = None,
) -> AsyncGenerator[UserService, None]:
    async with UserService.new(
        session=db_session,
        error_messages={
            "not_found": "No user found with the given ID.",
        },
    ) as service:
        yield service


async def provide_question_service(
    db_session: AsyncSession | None = None,
) -> AsyncGenerator[QuestionService, None]:
    async with QuestionService.new(
        session=db_session,
        error_messages={
            "not_found": "No question found with the given ID.",
        },
    ) as service:
        yield service


async def provide_user_answer_service(
    db_session: AsyncSession | None = None,
) -> AsyncGenerator[UserAnswerService, None]:
    async with UserAnswerService.new(
        session=db_session,
        error_messages={
            "not_found": "No user answer found with the given ID.",
        },
    ) as service:
        yield service


async def provide_connection_service(
    db_session: AsyncSession | None = None,
) -> AsyncGenerator[ConnectionService, None]:
    async with ConnectionService.new(
        session=db_session,
        error_messages={
            "not_found": "No connection found with the given ID.",
        },
    ) as service:
        yield service


async def provide_connection_question_service(
    db_session: AsyncSession | None = None,
) -> AsyncGenerator[ConnectionQuestionService, None]:
    async with ConnectionQuestionService.new(
        session=db_session,
        error_messages={
            "not_found": "No connection question found with the given ID.",
        },
    ) as service:
        yield service
