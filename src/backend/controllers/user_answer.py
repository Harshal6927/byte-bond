from advanced_alchemy.service.pagination import OffsetPagination
from litestar import Request, delete, get, patch, post
from litestar.controller import Controller
from litestar.di import Provide
from litestar.exceptions import NotAuthorizedException

from backend.lib.dependencies import provide_user_answer_service
from backend.lib.services import UserAnswerService
from backend.lib.utils import admin_user_guard
from backend.schema.user_answer import GetUserAnswer, PatchUserAnswer, PostUserAnswer


class UserAnswerController(Controller):
    path = "/api/user-answers"
    tags = ["User Answers"]
    dependencies = {
        "user_answer_service": Provide(provide_user_answer_service),
    }

    @post()
    async def post_user_answer(
        self,
        data: PostUserAnswer,
        user_answer_service: UserAnswerService,
        request: Request,
    ) -> GetUserAnswer:
        user_answer = await user_answer_service.create(
            data={
                "answer": data.answer,
                "user_id": request.user.id,
                "question_id": data.question_id,
            },
        )
        return user_answer_service.to_schema(user_answer, schema_type=GetUserAnswer)

    @get()
    async def get_user_answers(
        self,
        user_answer_service: UserAnswerService,
        request: Request,
    ) -> OffsetPagination[GetUserAnswer]:
        # User can only see their own answers
        user_answers = await user_answer_service.list(user_id=request.user.id)
        return user_answer_service.to_schema(user_answers, schema_type=GetUserAnswer)

    @get("/all", guards=[admin_user_guard])
    async def get_all_user_answers(
        self,
        user_answer_service: UserAnswerService,
    ) -> OffsetPagination[GetUserAnswer]:
        user_answers = await user_answer_service.list()
        return user_answer_service.to_schema(user_answers, schema_type=GetUserAnswer)

    @get("/{user_answer_id:int}")
    async def get_user_answer(
        self,
        user_answer_id: int,
        user_answer_service: UserAnswerService,
        request: Request,
    ) -> GetUserAnswer:
        user_answer = await user_answer_service.get(user_answer_id)
        # User can only access their own answers
        if user_answer.user_id != request.user.id and not request.user.is_admin:
            raise NotAuthorizedException
        return user_answer_service.to_schema(user_answer, schema_type=GetUserAnswer)

    @patch("/{user_answer_id:int}")
    async def patch_user_answer(
        self,
        user_answer_id: int,
        data: PatchUserAnswer,
        user_answer_service: UserAnswerService,
        request: Request,
    ) -> GetUserAnswer:
        # User can only update their own answers
        existing_answer = await user_answer_service.get(user_answer_id)
        if existing_answer.user_id != request.user.id and not request.user.is_admin:
            raise NotAuthorizedException

        user_answer = await user_answer_service.update(
            item_id=user_answer_id,
            data=data,
        )
        return user_answer_service.to_schema(user_answer, schema_type=GetUserAnswer)

    @delete("/{user_answer_id:int}", guards=[admin_user_guard], status_code=200)
    async def delete_user_answer(
        self,
        user_answer_id: int,
        user_answer_service: UserAnswerService,
    ) -> GetUserAnswer:
        user_answer = await user_answer_service.delete(user_answer_id)
        return user_answer_service.to_schema(user_answer, schema_type=GetUserAnswer)
