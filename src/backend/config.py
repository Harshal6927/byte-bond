from datetime import timedelta
from typing import Any

from litestar.channels import ChannelsPlugin
from litestar.channels.backends.memory import MemoryChannelsBackend
from litestar.connection import ASGIConnection
from litestar.plugins.sqlalchemy import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from litestar.security.jwt import JWTCookieAuth, Token
from litestar_vite import ViteConfig, VitePlugin

from backend.lib.dependencies import provide_user_service
from backend.models import User
from backend.settings import get_settings

settings = get_settings()

# SQLAlchemy
sqlalchemy_config = SQLAlchemyAsyncConfig(
    connection_string=settings.db_connection_string,
    session_config=AsyncSessionConfig(expire_on_commit=False),
    before_send_handler="autocommit",
    create_all=True,
)
alchemy_plugin = SQLAlchemyPlugin(config=sqlalchemy_config)

# Channels
channels_plugin = ChannelsPlugin(
    backend=MemoryChannelsBackend(),
    arbitrary_channels_allowed=True,
    create_ws_route_handlers=True,
    ws_handler_base_path="/ws",
)


# Auth
async def _retrieve_user_handler(
    token: Token,
    _: ASGIConnection[Any, Any, Any, Any],
) -> User | None:
    async with sqlalchemy_config.get_session() as db_session:
        users_service = await anext(provide_user_service(db_session))

        return await users_service.get_one_or_none(
            id=int(token.sub),
        )


jwt_cookie_auth = JWTCookieAuth[User](
    retrieve_user_handler=_retrieve_user_handler,
    token_secret=settings.secret_key,
    default_token_expiration=timedelta(days=1),
    exclude=["/schema"],
    samesite="strict",
    secure=True,
)


# Vite
vite_plugin = VitePlugin(
    config=ViteConfig(
        bundle_dir=settings.vite.bundle_dir,
        asset_url=settings.vite.asset_url,
        root_dir=settings.vite.root_dir,
        resource_dir=settings.vite.resource_dir,
        use_server_lifespan=settings.vite.use_server_lifespan,
        dev_mode=settings.debug,
        hot_reload=settings.vite.hot_reload,
        port=settings.vite.port,
        host=settings.vite.host,
        is_react=True,
    ),
)
