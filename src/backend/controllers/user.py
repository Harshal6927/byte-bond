from typing import Any

from advanced_alchemy.service.pagination import OffsetPagination
from litestar import Request, delete, get, patch, post
from litestar.controller import Controller
from litestar.di import Provide
from litestar.exceptions import NotAuthorizedException, PermissionDeniedException

from src.backend.lib.dependencies import (
    provide_event_service,
    provide_question_service,
    provide_user_answer_service,
    provide_user_service,
)
from src.backend.lib.services import EventService, QuestionService, UserAnswerService, UserService
from src.backend.lib.utils import admin_user_guard
from src.backend.models import Question, User
from src.backend.schema.user import GetUser, PatchUser, PostUser


class UserController(Controller):
    path = "/api/users"
    tags = ["Users"]
    dependencies = {
        "user_service": Provide(provide_user_service),
        "event_service": Provide(provide_event_service),
        "question_service": Provide(provide_question_service),
        "user_answer_service": Provide(provide_user_answer_service),
    }

    @post(exclude_from_auth=True)
    async def post_user(
        self,
        data: PostUser,
        user_service: UserService,
        event_service: EventService,
        question_service: QuestionService,
        user_answer_service: UserAnswerService,
    ) -> GetUser:
        event = await event_service.get_one(code=data.event_code)
        whitelist = event.whitelist.get("emails", [])

        if data.email not in whitelist:
            raise PermissionDeniedException("Your email is not whitelisted for this event.")

        user_answers_questions_ids = [answer.question_id for answer in data.user_answer]
        user_answers_questions_ids_set = set(user_answers_questions_ids)

        # Validate that all answered questions are unique (no duplicates)
        if len(user_answers_questions_ids_set) != len(user_answers_questions_ids):
            raise PermissionDeniedException("You cannot answer the same question twice.")

        signup_questions = await question_service.list(
            Question.id.in_(user_answers_questions_ids_set),
            Question.is_signup_question.is_(True),
        )
        signup_questions_ids = {question.id for question in signup_questions}

        # Validate that all answered questions exist in the database
        if not user_answers_questions_ids_set.issubset(signup_questions_ids):
            raise PermissionDeniedException("Some of the answered questions do not exist.")

        user = await user_service.create(
            data={
                "name": data.name,
                "email": data.email,
                "event_id": event.id,
            },
        )

        await user_answer_service.create_many(
            [
                {
                    "answer": answer.answer,
                    "user_id": user.id,
                    "question_id": answer.question_id,
                }
                for answer in data.user_answer
            ],
        )

        return user_service.to_schema(user, schema_type=GetUser)

    @get(guards=[admin_user_guard])
    async def get_users(
        self,
        user_service: UserService,
    ) -> OffsetPagination[GetUser]:
        users = await user_service.list()
        return user_service.to_schema(users, schema_type=GetUser)

    @get("/{user_id:int}", guards=[admin_user_guard])
    async def get_user(
        self,
        user_id: int,
        user_service: UserService,
    ) -> GetUser:
        user = await user_service.get_one(id=user_id)
        return user_service.to_schema(user, schema_type=GetUser)

    @patch("/{user_id:int}")
    async def patch_user(
        self,
        user_id: int,
        data: PatchUser,
        user_service: UserService,
        request: Request[User, Any, Any],
    ) -> GetUser:
        if request.user.id != user_id and not request.user.is_admin:
            raise NotAuthorizedException

        user = await user_service.update(
            item_id=user_id,
            data=data,
        )
        return user_service.to_schema(user, schema_type=GetUser)

    @delete("/{user_id:int}", guards=[admin_user_guard], status_code=200)
    async def delete_user(
        self,
        user_id: int,
        user_service: UserService,
    ) -> GetUser:
        user = await user_service.delete(user_id)
        return user_service.to_schema(user, schema_type=GetUser)
