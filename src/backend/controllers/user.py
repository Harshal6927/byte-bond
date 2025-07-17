from litestar import delete, get, patch, post
from litestar.controller import Controller
from litestar.di import Provide
from litestar.exceptions import PermissionDeniedException

from backend.lib.dependencies import provide_event_service, provide_user_service
from backend.lib.services import EventService, UserService
from backend.lib.utils import admin_user_guard
from backend.schema.user import GetUser, PatchUser, PostUser


class UserController(Controller):
    path = "/api/users"
    tags = ["Users"]
    dependencies = {
        "user_service": Provide(provide_user_service),
        "event_service": Provide(provide_event_service),
    }

    @post(exclude_from_auth=True)
    async def post_user(
        self,
        data: PostUser,
        user_service: UserService,
        event_service: EventService,
    ) -> GetUser:
        event = await event_service.get_one(code=data.event_code)

        whitelist = event.whitelist.get("emails", [])

        if data.email not in whitelist:
            raise PermissionDeniedException

        user = await user_service.create(
            data={
                "name": data.name,
                "email": data.email,
                "event_id": event.id,
            },
        )

        return user_service.to_schema(user, schema_type=GetUser)

    @get()
    async def get_users(
        self,
        user_service: UserService,
    ) -> list[GetUser]:
        users = await user_service.list()
        return user_service.to_schema(users, schema_type=GetUser)

    @get("/{user_id:int}")
    async def get_user(
        self,
        user_id: int,
        user_service: UserService,
    ) -> GetUser:
        user = await user_service.get(user_id)
        return user_service.to_schema(user, schema_type=GetUser)

    @patch("/{user_id:int}")
    async def patch_user(
        self,
        user_id: int,
        data: PatchUser,
        user_service: UserService,
    ) -> GetUser:
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
