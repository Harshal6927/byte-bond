import random

from litestar import Request, get, post, status_codes
from litestar.controller import Controller
from litestar.di import Provide
from litestar.exceptions import HTTPException, NotAuthorizedException

from backend.lib.dependencies import (
    provide_connection_question_service,
    provide_connection_service,
    provide_event_service,
    provide_question_service,
    provide_user_service,
)
from backend.lib.services import (
    ConnectionQuestionService,
    ConnectionService,
    EventService,
    QuestionService,
    UserService,
)
from backend.lib.utils import admin_user_guard
from backend.models import Connection, ConnectionQuestion, ConnectionStatus, Question, User, UserStatus
from backend.schema.event import GetEvent
from backend.schema.game import (
    ConnectionQuestionData,
    GameQuestionResponse,
    GameStartRequest,
    GameStatus,
    GameStopRequest,
    QRScanRequest,
    QuestionResult,
)

GAME_QUESTIONS_COUNT = 6


class GameController(Controller):
    path = "/api/game"
    tags = ["Game"]
    dependencies = {
        "connection_service": Provide(provide_connection_service),
        "event_service": Provide(provide_event_service),
        "user_service": Provide(provide_user_service),
        "question_service": Provide(provide_question_service),
        "connection_question_service": Provide(provide_connection_question_service),
    }

    @post("/start", guards=[admin_user_guard])
    async def start_game(
        self,
        data: GameStartRequest,
        event_service: EventService,
    ) -> GetEvent:
        event = await event_service.update(item_id=data.event_id, data={"is_active": True})
        return event_service.to_schema(event, schema_type=GetEvent)

    @post("/stop", guards=[admin_user_guard])
    async def stop_game(
        self,
        data: GameStopRequest,
        event_service: EventService,
        connection_service: ConnectionService,
        user_service: UserService,
    ) -> GetEvent:
        event = await event_service.update(item_id=data.event_id, data={"is_active": False})

        # Cancel all pending/active connections for this event and set users back to available
        pending_connections = await connection_service.list(
            Connection.status.in_([ConnectionStatus.PENDING, ConnectionStatus.ACTIVE]),
            event_id=data.event_id,
        )

        connection_data = []
        user_data = []
        for conn in pending_connections:
            connection_data.append(
                {"id": conn.id, "status": ConnectionStatus.CANCELLED},
            )
            user_data.extend(
                [
                    {"id": conn.user1_id, "status": UserStatus.AVAILABLE},
                    {"id": conn.user2_id, "status": UserStatus.AVAILABLE},
                ],
            )
        await connection_service.update_many(connection_data)
        await user_service.update_many(user_data)

        return event_service.to_schema(event, schema_type=GetEvent)

    @get("/status")
    async def get_game_status(
        self,
        request: Request,
        user_service: UserService,
        question_service: QuestionService,
        connection_service: ConnectionService,
        connection_question_service: ConnectionQuestionService,
    ) -> GameStatus:
        user: User = request.user

        # Get user's current active connection
        current_connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )
        qr_code = None
        partner_name = None
        connection_questions = None

        if current_connection:
            # Determine if user should show QR code (user1) or scan (user2)
            if current_connection.user1_id == user.id:
                qr_code = user.qr_code

            # Get partner's name
            partner = await user_service.get(
                current_connection.user2_id if current_connection.user1_id == user.id else current_connection.user1_id,
            )
            partner_name = partner.name

            # Get connection questions data for the current user
            connection_questions = await self._get_user_connection_questions(
                user_id=user.id,
                connection_id=current_connection.id,
                connection_question_service=connection_question_service,
                question_service=question_service,
            )

        return GameStatus(
            user_status=user.status,
            qr_code=qr_code,
            partner_name=partner_name,
            connection_questions=connection_questions,
        )

    @post("/scan-qr")
    async def scan_qr_code(
        self,
        data: QRScanRequest,
        request: Request,
        user_service: UserService,
        connection_service: ConnectionService,
        question_service: QuestionService,
        connection_question_service: ConnectionQuestionService,
    ) -> None:
        user: User = request.user

        # Get user's current active connection
        current_connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )

        # Check if logged in user is user1 (QR giver)
        if not current_connection or current_connection.user1_id == user.id:
            raise NotAuthorizedException

        # Verify the QR code matches user1's QR code
        user1 = await user_service.get(current_connection.user1_id)
        if user1.qr_code != data.qr_code:
            raise NotAuthorizedException(detail="Invalid QR code scanned")

        # Activate the connection
        await connection_service.update(
            item_id=current_connection.id,
            data={"status": ConnectionStatus.ACTIVE},
        )

        # Set both users to busy status
        await user_service.update_many(
            [
                {"id": current_connection.user1_id, "status": UserStatus.BUSY},
                {"id": current_connection.user2_id, "status": UserStatus.BUSY},
            ],
        )

        # Create connection question records for both users
        await self._create_connection_questions(
            user1_id=current_connection.user1_id,
            user2_id=current_connection.user2_id,
            connection_id=current_connection.id,
            question_service=question_service,
            connection_question_service=connection_question_service,
        )

    @post("/answer-question")
    async def answer_question(
        self,
        data: GameQuestionResponse,
        request: Request,
        connection_service: ConnectionService,
        connection_question_service: ConnectionQuestionService,
        user_service: UserService,
    ) -> QuestionResult:
        user: User = request.user

        # Get user's current active connection
        current_connection: Connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )
        if not current_connection or current_connection.status != ConnectionStatus.ACTIVE:
            raise HTTPException(
                status_code=status_codes.HTTP_400_BAD_REQUEST,
                detail="No active connection found",
            )

        # Verify this user is assigned to answer this question
        conn_question = await connection_question_service.get_one_or_none(
            connection_id=current_connection.id,
            question_id=data.question_id,
            user_id=user.id,
        )
        if not conn_question:
            raise HTTPException(
                status_code=status_codes.HTTP_400_BAD_REQUEST,
                detail="You are not assigned to answer this question",
            )

        # Check if question was already answered
        if conn_question.question_answered:
            raise HTTPException(
                status_code=status_codes.HTTP_400_BAD_REQUEST,
                detail="Question already answered",
            )

        # Get the other user's answer to this question
        other_user_id = (
            current_connection.user2_id if current_connection.user1_id == user.id else current_connection.user1_id
        )
        other_user = await user_service.get(other_user_id)

        other_user_answer = None
        for answer in other_user.answers:
            if answer.question_id == data.question_id:
                other_user_answer = answer.answer
                break

        if not other_user_answer:
            raise HTTPException(
                status_code=status_codes.HTTP_404_NOT_FOUND,
                detail="Other user hasn't answered this question during signup",
            )

        # Check if answer is correct (case-insensitive comparison)
        is_correct = data.answer.lower().strip() == other_user_answer.lower().strip()

        # Update the connection question
        await connection_question_service.update(
            item_id=conn_question.id,
            data={
                "question_answered": True,
                "answered_correctly": is_correct,
            },
        )

        # Award points to both users if correct
        if is_correct:
            await user_service.update_many(
                data=[
                    {"id": user.id, "points": user.points + 1},
                    {"id": other_user.id, "points": other_user.points + 1},
                ],
            )

        return QuestionResult(
            correct=is_correct,
            expected_answer=other_user_answer,
            your_answer=data.answer,
        )

    @post("/complete-connection")
    async def complete_connection(
        self,
        request: Request,
        connection_service: ConnectionService,
        connection_question_service: ConnectionQuestionService,
        user_service: UserService,
    ) -> None:
        user: User = request.user

        # Get user's current active connection
        current_connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )

        if not current_connection or current_connection.status != ConnectionStatus.ACTIVE:
            raise HTTPException(
                status_code=status_codes.HTTP_404_NOT_FOUND,
                detail="No active connection found",
            )

        # Check if all connection questions are answered
        all_connection_questions = await connection_question_service.list(
            ConnectionQuestion.connection_id == current_connection.id,
        )

        unanswered_questions = [cq for cq in all_connection_questions if not cq.question_answered]

        if unanswered_questions:
            raise HTTPException(
                status_code=status_codes.HTTP_400_BAD_REQUEST,
                detail=f"{len(unanswered_questions)} questions still unanswered",
            )

        # Complete the connection
        await connection_service.update(
            item_id=current_connection.id,
            data={"status": ConnectionStatus.COMPLETED},
        )

        # Update connection counts and set users back to available
        user1 = await user_service.get(current_connection.user1_id)
        user2 = await user_service.get(current_connection.user2_id)

        await user_service.update_many(
            data=[
                {
                    "id": current_connection.user1_id,
                    "status": UserStatus.AVAILABLE,
                    "connection_count": user1.connection_count + 1,
                },
                {
                    "id": current_connection.user2_id,
                    "status": UserStatus.AVAILABLE,
                    "connection_count": user2.connection_count + 1,
                },
            ],
        )

    async def _get_user_connection_questions(
        self,
        *,
        user_id: int,
        connection_id: int,
        connection_question_service: ConnectionQuestionService,
        question_service: QuestionService,
    ) -> list[ConnectionQuestionData]:
        # Get connection questions for this user in this connection
        user_connection_questions = await connection_question_service.list(
            ConnectionQuestion.user_id == user_id,
            ConnectionQuestion.connection_id == connection_id,
        )

        if not user_connection_questions:
            return []

        # Get question details for each connection question
        question_ids = [cq.question_id for cq in user_connection_questions]
        questions = await question_service.list(Question.id.in_(question_ids))

        # Create a mapping of question_id to question text
        question_map = {q.id: q.question for q in questions}

        return [
            ConnectionQuestionData(
                id=cq.id,
                question_id=cq.question_id,
                question_text=question_map.get(cq.question_id, "Error: Unknown Question"),
                question_answered=cq.question_answered,
                answered_correctly=cq.answered_correctly,
            )
            for cq in user_connection_questions
        ]

    async def _create_connection_questions(
        self,
        *,
        user1_id: int,
        user2_id: int,
        connection_id: int,
        question_service: QuestionService,
        connection_question_service: ConnectionQuestionService,
    ) -> None:
        # Get all available game questions
        available_questions = await question_service.list(Question.is_game_question.is_(True))

        if len(available_questions) < GAME_QUESTIONS_COUNT:
            raise ValueError("Not enough game questions available. Need at least 6 questions.")

        # Randomly select questions from available questions
        selected_questions = random.sample(available_questions, GAME_QUESTIONS_COUNT)

        # Randomly assign questions to each user
        random.shuffle(selected_questions)
        user1_questions = selected_questions[: GAME_QUESTIONS_COUNT // 2]
        user2_questions = selected_questions[GAME_QUESTIONS_COUNT // 2 :]

        # Create connection question records
        connection_questions_data = [
            {
                "question_answered": False,
                "answered_correctly": False,
                "user_id": user1_id,
                "connection_id": connection_id,
                "question_id": question.id,
            }
            for question in user1_questions
        ] + [
            {
                "question_answered": False,
                "answered_correctly": False,
                "user_id": user2_id,
                "connection_id": connection_id,
                "question_id": question.id,
            }
            for question in user2_questions
        ]

        await connection_question_service.create_many(connection_questions_data)

    async def _get_user_active_connection(
        self,
        *,
        user_id: int,
        event_id: int | None,
        connection_service: ConnectionService,
    ) -> Connection | None:
        # Check as user1
        connection = await connection_service.get_one_or_none(
            Connection.status.in_([ConnectionStatus.PENDING, ConnectionStatus.ACTIVE]),
            user1_id=user_id,
            event_id=event_id,
        )
        if connection:
            return connection

        # Check as user2
        return await connection_service.get_one_or_none(
            Connection.status.in_([ConnectionStatus.PENDING, ConnectionStatus.ACTIVE]),
            user2_id=user_id,
            event_id=event_id,
        )
