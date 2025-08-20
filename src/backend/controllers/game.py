import random
from typing import Any

from advanced_alchemy.filters import LimitOffset
from litestar import Request, get, post
from litestar.controller import Controller
from litestar.di import Provide
from litestar.exceptions import ClientException, NotAuthorizedException, NotFoundException, PermissionDeniedException

from src.backend.lib.dependencies import (
    provide_connection_question_service,
    provide_connection_service,
    provide_event_service,
    provide_question_service,
    provide_user_answer_service,
    provide_user_service,
)
from src.backend.lib.services import (
    ConnectionQuestionService,
    ConnectionService,
    EventService,
    QuestionService,
    UserAnswerService,
    UserService,
)
from src.backend.lib.utils import admin_user_guard, publish_to_channel
from src.backend.models import Connection, ConnectionQuestion, ConnectionStatus, Question, User, UserStatus
from src.backend.schema.event import GetEvent
from src.backend.schema.game import (
    ConnectionQuestionData,
    GameChatRequest,
    GameQuestionResponse,
    GameStartRequest,
    GameStatus,
    GameStopRequest,
    Leaderboard,
    LeaderboardEntry,
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
        "user_answer_service": Provide(provide_user_answer_service),
    }

    # Admin
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

    @get("/leaderboard/{event_id:int}", guards=[admin_user_guard])
    async def get_leaderboard(
        self,
        event_id: int,
        event_service: EventService,
        user_service: UserService,
    ) -> Leaderboard:
        event = await event_service.get(event_id)

        users = await user_service.list(
            LimitOffset(limit=10, offset=0),
            order_by=[
                User.points.desc(),
                User.connection_count.desc(),
                User.name.asc(),
            ],
            event_id=event_id,
            is_admin=False,
        )

        # Create leaderboard entries with rank
        entries = []
        current_rank = 1
        for i, user in enumerate(users):
            # Handle ties - users with same points and connections get same rank
            if i > 0:
                prev_user = users[i - 1]
                if user.points != prev_user.points or user.connection_count != prev_user.connection_count:
                    current_rank = i + 1

            entries.append(
                LeaderboardEntry(
                    id=user.id,
                    name=user.name,
                    email=user.email,
                    points=user.points,
                    connection_count=user.connection_count,
                    rank=current_rank,
                ),
            )

        return Leaderboard(
            event_id=event.id,
            event_name=event.name,
            entries=entries,
            total_users=len(entries),
        )

    # User
    @get("/status")
    async def get_game_status(
        self,
        request: Request[User, Any, Any],
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
        request: Request[User, Any, Any],
        user_service: UserService,
        connection_service: ConnectionService,
        connection_question_service: ConnectionQuestionService,
        user_answer_service: UserAnswerService,
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
            connection_question_service=connection_question_service,
            user_answer_service=user_answer_service,
        )

        publish_to_channel(
            request=request,
            data={
                "message": f"refresh-{current_connection.user1_id}",
            },
            channel="game-status",
        )
        publish_to_channel(
            request=request,
            data={
                "message": f"refresh-{current_connection.user2_id}",
            },
            channel="game-status",
        )

    # Rate limit: 1 request per minute per user
    @post("/answer-question")
    async def answer_question(
        self,
        data: GameQuestionResponse,
        request: Request[User, Any, Any],
        connection_service: ConnectionService,
        connection_question_service: ConnectionQuestionService,
        user_service: UserService,
    ) -> QuestionResult:
        user: User = request.user

        # Get user's current active connection
        current_connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )

        if not current_connection or current_connection.status != ConnectionStatus.ACTIVE:
            raise NotFoundException(
                detail="No active connection found",
            )

        # Verify this user is assigned to answer this question
        conn_question = await connection_question_service.get_one_or_none(
            connection_id=current_connection.id,
            question_id=data.question_id,
            user_id=user.id,
        )
        if not conn_question:
            raise PermissionDeniedException(
                detail="You are not assigned to answer this question",
            )

        # Check if question was already answered
        if conn_question.question_answered:
            raise ClientException(
                detail="Question already answered",
            )

        # Get the other user's answer to this question
        other_user_id = (
            current_connection.user2_id if current_connection.user1_id == user.id else current_connection.user1_id
        )
        other_user = await user_service.get(other_user_id, load=[User.answers])

        other_user_answer = None
        for answer in other_user.answers:
            if answer.question_id == data.question_id:
                other_user_answer = answer.answer
                break

        if not other_user_answer:
            raise ClientException(
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
        request: Request[User, Any, Any],
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
            raise NotFoundException(
                detail="No active connection found",
            )

        # Check if all connection questions are answered
        all_connection_questions = await connection_question_service.list(
            ConnectionQuestion.connection_id == current_connection.id,
        )

        unanswered_questions = [cq for cq in all_connection_questions if not cq.question_answered]

        if unanswered_questions:
            raise ClientException(
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

        publish_to_channel(
            request=request,
            data={
                "message": f"refresh-{current_connection.user1_id}",
            },
            channel="game-status",
        )
        publish_to_channel(
            request=request,
            data={
                "message": f"refresh-{current_connection.user2_id}",
            },
            channel="game-status",
        )

    @post("/cancel-connection")
    async def cancel_connection(
        self,
        request: Request[User, Any, Any],
        connection_service: ConnectionService,
        user_service: UserService,
    ) -> None:
        user: User = request.user

        # Get user's current active connection
        current_connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )

        if not current_connection:
            raise NotFoundException(
                detail="No active connection found",
            )

        # Can only cancel pending or active connections
        if current_connection.status not in {ConnectionStatus.PENDING, ConnectionStatus.ACTIVE}:
            raise ClientException(
                detail="Connection cannot be cancelled in its current state",
            )

        # Cancel the connection
        await connection_service.update(
            item_id=current_connection.id,
            data={"status": ConnectionStatus.CANCELLED},
        )

        # Set both users back to available status
        await user_service.update_many(
            data=[
                {
                    "id": current_connection.user1_id,
                    "status": UserStatus.AVAILABLE,
                },
                {
                    "id": current_connection.user2_id,
                    "status": UserStatus.AVAILABLE,
                },
            ],
        )

        # Send notification popup to other user
        other_user_id = (
            current_connection.user2_id if current_connection.user1_id == user.id else current_connection.user1_id
        )
        publish_to_channel(
            request=request,
            data={
                "message": f"cancelled-{other_user_id}",
            },
            channel="game-status",
        )

        # Refresh game status for both users
        publish_to_channel(
            request=request,
            data={
                "message": f"refresh-{current_connection.user1_id}",
            },
            channel="game-status",
        )
        publish_to_channel(
            request=request,
            data={
                "message": f"refresh-{current_connection.user2_id}",
            },
            channel="game-status",
        )

    @post("/chat")
    async def chat(
        self,
        data: GameChatRequest,
        request: Request[User, Any, Any],
        connection_service: ConnectionService,
    ) -> None:
        user: User = request.user

        # Get user's current connection
        current_connection = await self._get_user_active_connection(
            user_id=user.id,
            event_id=user.event_id,
            connection_service=connection_service,
        )

        if not current_connection:
            raise NotFoundException(
                detail="No connection found",
            )

        other_user_id = (
            current_connection.user2_id if current_connection.user1_id == user.id else current_connection.user1_id
        )

        publish_to_channel(
            request=request,
            data={
                "message": data.message,
            },
            channel=str(other_user_id),
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
        connection_question_service: ConnectionQuestionService,
        user_answer_service: UserAnswerService,
    ) -> None:
        """Create connection questions by assigning each user questions from their partner's signup answers.

        User1 gets questions from User2's signup answers (so User1 asks User2 about User2's answers).
        User2 gets questions from User1's signup answers (so User2 asks User1 about User1's answers).
        This ensures each user asks their partner about questions the partner actually answered.

        Args:
            user1_id: ID of the first user (QR code presenter)
            user2_id: ID of the second user (QR code scanner)
            connection_id: ID of the connection between the users
            question_service: Service for accessing questions (unused but kept for interface consistency)
            connection_question_service: Service for managing connection questions
            user_answer_service: Service for accessing user answers

        Raises:
            ValueError: If either user doesn't have enough signup answers

        """
        # Get the questions each user answered during signup
        user1_answers = await user_answer_service.list(user_id=user1_id)
        user2_answers = await user_answer_service.list(user_id=user2_id)

        # Each user needs at least half of GAME_QUESTIONS_COUNT for the other to ask about
        questions_per_user = GAME_QUESTIONS_COUNT // 2

        if len(user1_answers) < questions_per_user:
            error_msg = (
                f"User1 doesn't have enough signup answers. "
                f"Found {len(user1_answers)}, need at least {questions_per_user}."
            )
            raise ValueError(error_msg)

        if len(user2_answers) < questions_per_user:
            error_msg = (
                f"User2 doesn't have enough signup answers. "
                f"Found {len(user2_answers)}, need at least {questions_per_user}."
            )
            raise ValueError(error_msg)

        # Randomly select questions from each user's answers
        # User1 will be assigned questions from User2's signup answers (User1 asks User2)
        user1_assigned_questions = random.sample(user2_answers, questions_per_user)

        # User2 will be assigned questions from User1's signup answers (User2 asks User1)
        user2_assigned_questions = random.sample(user1_answers, questions_per_user)

        # Create connection question records
        connection_questions_data = [
            {
                "question_answered": False,
                "answered_correctly": False,
                "user_id": user1_id,
                "connection_id": connection_id,
                "question_id": answer.question_id,
            }
            for answer in user1_assigned_questions
        ] + [
            {
                "question_answered": False,
                "answered_correctly": False,
                "user_id": user2_id,
                "connection_id": connection_id,
                "question_id": answer.question_id,
            }
            for answer in user2_assigned_questions
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
