from litestar import delete, get, patch, post
from litestar.controller import Controller
from litestar.di import Provide

from backend.lib.dependencies import provide_event_service
from backend.lib.services import EventService
from backend.lib.utils import admin_user_guard
from backend.schema.event import GetEvent, PatchEvent, PostEvent


class EventController(Controller):
    path = "/api/events"
    guards = [admin_user_guard]
    tags = ["Events"]
    dependencies = {
        "event_service": Provide(provide_event_service),
    }

    @post()
    async def post_event(
        self,
        data: PostEvent,
        event_service: EventService,
    ) -> GetEvent:
        event = await event_service.create(data)
        return event_service.to_schema(event, schema_type=GetEvent)

    @get()
    async def get_events(
        self,
        event_service: EventService,
    ) -> list[GetEvent]:
        events = await event_service.list()
        return event_service.to_schema(events, schema_type=GetEvent)

    @get("/{event_id:int}")
    async def get_event(
        self,
        event_id: int,
        event_service: EventService,
    ) -> GetEvent:
        event = await event_service.get(event_id)
        return event_service.to_schema(event, schema_type=GetEvent)

    @patch("/{event_id:int}")
    async def patch_event(
        self,
        event_id: int,
        data: PatchEvent,
        event_service: EventService,
    ) -> GetEvent:
        event = await event_service.update(
            item_id=event_id,
            data=data,
        )
        return event_service.to_schema(event, schema_type=GetEvent)

    @delete("/{event_id:int}", status_code=200)
    async def delete_event(
        self,
        event_id: int,
        event_service: EventService,
    ) -> GetEvent:
        event = await event_service.delete(event_id)
        return event_service.to_schema(event, schema_type=GetEvent)
