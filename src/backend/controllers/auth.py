from litestar import Request, Response, get, post
from litestar.controller import Controller
from litestar.datastructures import Cookie
from litestar.di import Provide

from src.backend.config import jwt_cookie_auth
from src.backend.lib.dependencies import provide_event_service, provide_user_service
from src.backend.lib.services import EventService, UserService
from src.backend.schema.auth import PostLogin
from src.backend.schema.user import GetUser


class AuthController(Controller):
    path = "/api/auth"
    tags = ["Authentication"]
    dependencies = {
        "users_service": Provide(provide_user_service),
        "event_service": Provide(provide_event_service),
    }

    @post("/login", exclude_from_auth=True)
    async def login(
        self,
        data: PostLogin,
        users_service: UserService,
        event_service: EventService,
    ) -> Response:
        event = await event_service.get_one_or_none(code=data.event_code)

        user = await users_service.get_one(
            email=data.email,
            event_id=event.id if event else None,
        )

        return jwt_cookie_auth.login(
            identifier=str(user.id),
            send_token_as_response_body=True,
        )

    @get("/logout", exclude_from_auth=True)
    async def logout(self) -> Response:
        return Response(
            content=None,
            cookies=[Cookie(key="token", value=None, expires=0)],
        )

    @get("/me")
    async def get_user(
        self,
        request: Request,
        users_service: UserService,
    ) -> GetUser:
        return users_service.to_schema(request.user, schema_type=GetUser)
