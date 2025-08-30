from advanced_alchemy.filters import LimitOffset, OrderBy
from advanced_alchemy.service.pagination import OffsetPagination
from litestar import delete, get, patch, post
from litestar.controller import Controller
from litestar.di import Provide
from sqlalchemy import func

from src.backend.config import five_rpm_rate_limit_config
from src.backend.lib.dependencies import provide_question_service
from src.backend.lib.services import QuestionService
from src.backend.lib.utils import admin_user_guard
from src.backend.schema.question import GetQuestion, PatchQuestion, PostQuestion


class QuestionController(Controller):
    path = "/api/questions"
    tags = ["Questions"]
    dependencies = {
        "question_service": Provide(provide_question_service),
    }

    @post(guards=[admin_user_guard])
    async def post_question(
        self,
        data: PostQuestion,
        question_service: QuestionService,
    ) -> GetQuestion:
        question = await question_service.create(data)
        return question_service.to_schema(question, schema_type=GetQuestion)

    @get(exclude_from_auth=True, middleware=[five_rpm_rate_limit_config.middleware])
    async def get_questions(
        self,
        question_service: QuestionService,
        limit: int = 10,
        onboarding: bool = False,
    ) -> OffsetPagination[GetQuestion]:
        if limit < 0:  # If limit is negative, return all questions
            questions = await question_service.list()
        elif onboarding:  # If onboarding is true, keep the signup questions first
            questions = await question_service.list(
                OrderBy("is_signup_question", "desc"),
                OrderBy("is_game_question", "asc"),
                OrderBy(func.random()),  # pyright: ignore[reportArgumentType]
                LimitOffset(limit=limit, offset=0),
            )
        else:
            questions = await question_service.list(
                OrderBy(func.random()),  # pyright: ignore[reportArgumentType]
                LimitOffset(limit=limit, offset=0),
            )
        return question_service.to_schema(questions, schema_type=GetQuestion)

    @get("/{question_id:int}", guards=[admin_user_guard])
    async def get_question(
        self,
        question_id: int,
        question_service: QuestionService,
    ) -> GetQuestion:
        question = await question_service.get_one(id=question_id)
        return question_service.to_schema(question, schema_type=GetQuestion)

    @patch("/{question_id:int}", guards=[admin_user_guard])
    async def patch_question(
        self,
        question_id: int,
        data: PatchQuestion,
        question_service: QuestionService,
    ) -> GetQuestion:
        question = await question_service.update(
            item_id=question_id,
            data=data,
        )
        return question_service.to_schema(question, schema_type=GetQuestion)

    @delete("/{question_id:int}", guards=[admin_user_guard], status_code=200)
    async def delete_question(
        self,
        question_id: int,
        question_service: QuestionService,
    ) -> GetQuestion:
        question = await question_service.delete(question_id)
        return question_service.to_schema(question, schema_type=GetQuestion)
