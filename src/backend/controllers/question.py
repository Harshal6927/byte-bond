from litestar import delete, get, patch, post
from litestar.controller import Controller
from litestar.di import Provide

from backend.lib.dependencies import provide_question_service
from backend.lib.services import QuestionService
from backend.lib.utils import admin_user_guard
from backend.schema.question import GetQuestion, PatchQuestion, PostQuestion


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

    @get(exclude_from_auth=True)
    async def get_questions(
        self,
        question_service: QuestionService,
    ) -> list[GetQuestion]:
        questions = await question_service.list()
        return question_service.to_schema(questions, schema_type=GetQuestion)

    @get("/{question_id:int}", exclude_from_auth=True)
    async def get_question(
        self,
        question_id: int,
        question_service: QuestionService,
    ) -> GetQuestion:
        question = await question_service.get(question_id)
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
