from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import (
    SQLAlchemyAsyncRepositoryService,
)

from backend.models import (
    Connection,
    ConnectionQuestion,
    Event,
    Question,
    User,
    UserAnswer,
)


class EventService(SQLAlchemyAsyncRepositoryService[Event]):
    class EventRepository(SQLAlchemyAsyncRepository[Event]):
        model_type = Event

    repository_type = EventRepository


class UserService(SQLAlchemyAsyncRepositoryService[User]):
    class UserRepository(SQLAlchemyAsyncRepository[User]):
        model_type = User

    repository_type = UserRepository


class QuestionService(SQLAlchemyAsyncRepositoryService[Question]):
    class QuestionRepository(SQLAlchemyAsyncRepository[Question]):
        model_type = Question

    repository_type = QuestionRepository


class UserAnswerService(SQLAlchemyAsyncRepositoryService[UserAnswer]):
    class UserAnswerRepository(SQLAlchemyAsyncRepository[UserAnswer]):
        model_type = UserAnswer

    repository_type = UserAnswerRepository


class ConnectionService(SQLAlchemyAsyncRepositoryService[Connection]):
    class ConnectionRepository(SQLAlchemyAsyncRepository[Connection]):
        model_type = Connection

    repository_type = ConnectionRepository


class ConnectionQuestionService(SQLAlchemyAsyncRepositoryService[ConnectionQuestion]):
    class ConnectionQuestionRepository(SQLAlchemyAsyncRepository[ConnectionQuestion]):
        model_type = ConnectionQuestion

    repository_type = ConnectionQuestionRepository
