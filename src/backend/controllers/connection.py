from advanced_alchemy.service.pagination import OffsetPagination
from litestar import delete, get, patch, post
from litestar.controller import Controller
from litestar.di import Provide

from backend.lib.dependencies import provide_connection_service
from backend.lib.services import ConnectionService
from backend.lib.utils import admin_user_guard
from backend.schema.connection import GetConnection, PatchConnection, PostConnection


class ConnectionController(Controller):
    path = "/api/connections"
    guards = [admin_user_guard]
    tags = ["Connections"]
    dependencies = {
        "connection_service": Provide(provide_connection_service),
    }

    @post()
    async def post_connection(
        self,
        data: PostConnection,
        connection_service: ConnectionService,
    ) -> GetConnection:
        connection = await connection_service.create(data)
        return connection_service.to_schema(connection, schema_type=GetConnection)

    @get()
    async def get_connections(
        self,
        connection_service: ConnectionService,
    ) -> OffsetPagination[GetConnection]:
        connections = await connection_service.list()
        return connection_service.to_schema(connections, schema_type=GetConnection)

    @get("/{connection_id:int}")
    async def get_connection(
        self,
        connection_id: int,
        connection_service: ConnectionService,
    ) -> GetConnection:
        connection = await connection_service.get(connection_id)
        return connection_service.to_schema(connection, schema_type=GetConnection)

    @patch("/{connection_id:int}")
    async def patch_connection(
        self,
        connection_id: int,
        data: PatchConnection,
        connection_service: ConnectionService,
    ) -> GetConnection:
        connection = await connection_service.update(
            item_id=connection_id,
            data=data,
        )
        return connection_service.to_schema(connection, schema_type=GetConnection)

    @delete("/{connection_id:int}", status_code=200)
    async def delete_connection(
        self,
        connection_id: int,
        connection_service: ConnectionService,
    ) -> GetConnection:
        connection = await connection_service.delete(connection_id)
        return connection_service.to_schema(connection, schema_type=GetConnection)
