from typing import Any

from litestar import Request, Response, get, post
from litestar.controller import Controller
from litestar.di import Provide

from src.backend.config import five_rpm_rate_limit_config
from src.backend.lib.dependencies import provide_event_service, provide_user_service
from src.backend.lib.services import EventService, UserService
from src.backend.models import User
from src.backend.schema.auth import PostLogin
from src.backend.schema.user import GetUser


class AuthController(Controller):
    path = "/api/auth"
    tags = ["Authentication"]
    dependencies = {
        "users_service": Provide(provide_user_service),
        "event_service": Provide(provide_event_service),
    }

    @post("/login", exclude_from_auth=True, middleware=[five_rpm_rate_limit_config.middleware])
    async def login(
        self,
        data: PostLogin,
        users_service: UserService,
        event_service: EventService,
        request: Request[User, Any, Any],
    ) -> GetUser:
        event = await event_service.get_one_or_none(code=data.event_code)

        user = await users_service.get_one(
            email=data.email,
            event_id=event.id if event else None,
        )

        request.set_session({"user_id": user.id})
        return users_service.to_schema(user, schema_type=GetUser)

    @get("/logout", exclude_from_auth=True, exclude_from_global_rate_limit=True)
    async def logout(self, request: Request[User, Any, Any]) -> Response:
        request.set_session({"user_id": None})
        return Response(content=None)

    @get("/me")
    async def get_user(
        self,
        request: Request[User, Any, Any],
        users_service: UserService,
    ) -> GetUser:
        return users_service.to_schema(request.user, schema_type=GetUser)
