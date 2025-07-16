from litestar.channels import ChannelsPlugin
from litestar.channels.backends.memory import MemoryChannelsBackend
from litestar.plugins.sqlalchemy import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)

from backend.settings import get_settings

settings = get_settings()

sqlalchemy_config = SQLAlchemyAsyncConfig(
    connection_string=settings.db_connection_string,
    session_config=AsyncSessionConfig(expire_on_commit=False),
    before_send_handler="autocommit",
    create_all=True,
)
alchemy_plugin = SQLAlchemyPlugin(config=sqlalchemy_config)


channels_plugin = ChannelsPlugin(
    backend=MemoryChannelsBackend(),
    arbitrary_channels_allowed=True,
    create_ws_route_handlers=True,
    ws_handler_base_path="/ws",
)
