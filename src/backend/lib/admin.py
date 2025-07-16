from sqladmin import ModelView

from src.backend.models import Connection, ConnectionQuestion, Event, Question, User, UserAnswer


class EventAdminView(ModelView, model=Event):
    column_list = [Event.id, Event.name, Event.code, Event.is_active]
    form_excluded_columns = [Event.users, Event.connections, Event.created_at, Event.updated_at]
    column_searchable_list = [Event.name, Event.code]


class UserAdminView(ModelView, model=User):
    column_list = [
        User.id,
        User.name,
        User.email,
        User.points,
        User.connection_count,
        User.status,
        User.is_admin,
        User.event_id,
    ]
    form_excluded_columns = [
        User.event,
        User.answers,
        User.connection_questions,
        User.connections_as_user1,
        User.connections_as_user2,
        User.created_at,
        User.updated_at,
    ]
    column_searchable_list = [User.name, User.email]


class QuestionAdminView(ModelView, model=Question):
    column_list = [
        Question.id,
        Question.question,
        Question.question_type,
        Question.is_signup_question,
        Question.is_game_question,
    ]
    form_excluded_columns = [
        Question.user_answers,
        Question.connection_questions,
        Question.created_at,
        Question.updated_at,
    ]
    column_searchable_list = [Question.question, Question.question_type]


class UserAnswerAdminView(ModelView, model=UserAnswer):
    column_list = [UserAnswer.id, UserAnswer.user_id, UserAnswer.question_id, UserAnswer.answer]
    form_excluded_columns = [
        UserAnswer.user,
        UserAnswer.question,
        UserAnswer.created_at,
        UserAnswer.updated_at,
    ]
    column_searchable_list = [UserAnswer.answer]


class ConnectionAdminView(ModelView, model=Connection):
    column_list = [
        Connection.id,
        Connection.event_id,
        Connection.user1_id,
        Connection.user2_id,
        Connection.status,
        Connection.start_time,
        Connection.end_time,
    ]
    form_excluded_columns = [
        Connection.start_time,
        Connection.end_time,
        Connection.event,
        Connection.user1,
        Connection.user2,
        Connection.connection_questions,
        Connection.created_at,
        Connection.updated_at,
    ]
    column_searchable_list = [Connection.status]


class ConnectionQuestionAdminView(ModelView, model=ConnectionQuestion):
    column_list = [
        ConnectionQuestion.id,
        ConnectionQuestion.connection_id,
        ConnectionQuestion.user_id,
        ConnectionQuestion.question_id,
        ConnectionQuestion.question_answered,
        ConnectionQuestion.answered_correctly,
    ]
    form_excluded_columns = [
        ConnectionQuestion.user,
        ConnectionQuestion.connection,
        ConnectionQuestion.question,
        ConnectionQuestion.created_at,
        ConnectionQuestion.updated_at,
    ]
    column_searchable_list = [ConnectionQuestion.question_answered]
