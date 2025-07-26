from datetime import timedelta
from typing import Any

from litestar.channels import ChannelsPlugin
from litestar.channels.backends.memory import MemoryChannelsBackend
from litestar.connection import ASGIConnection
from litestar.middleware.rate_limit import RateLimitConfig
from litestar.plugins.sqlalchemy import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from litestar.security.jwt import JWTCookieAuth, Token
from litestar_saq import CronJob, QueueConfig, SAQConfig, SAQPlugin
from litestar_vite import ViteConfig, VitePlugin
from sqladmin_litestar_plugin import SQLAdminPlugin

from src.backend.lib.admin import (
    ConnectionAdminView,
    ConnectionQuestionAdminView,
    EventAdminView,
    QuestionAdminView,
    UserAdminView,
    UserAnswerAdminView,
)
from src.backend.lib.dependencies import provide_user_service
from src.backend.models import User
from src.backend.settings import get_settings

settings = get_settings()

# SQLAlchemy
sqlalchemy_config = SQLAlchemyAsyncConfig(
    connection_string=settings.db_connection_string,
    session_config=AsyncSessionConfig(expire_on_commit=False),
    before_send_handler="autocommit",
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
    connection: ASGIConnection[Any, Any, Any, Any],
) -> User | None:
    async with sqlalchemy_config.get_session() as db_session:
        users_service = await anext(provide_user_service(db_session))

        user = await users_service.get_one_or_none(
            id=int(token.sub),
        )

        if not user:
            return None

        raw_path = str(connection.scope.get("raw_path"))
        if raw_path.startswith("b'/admin") and not user.is_admin:
            return None

        return user


jwt_cookie_auth = JWTCookieAuth[User](
    retrieve_user_handler=_retrieve_user_handler,
    token_secret=settings.secret_key,
    default_token_expiration=timedelta(days=1),
    exclude=["/schema", "/web", "/saq"],
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

# SAQ
saq_plugin = SAQPlugin(
    config=SAQConfig(
        web_enabled=settings.debug,
        use_server_lifespan=True,
        queue_configs=[
            QueueConfig(
                dsn=settings.get_conn_string_without_adaptor(),
                name="process_game",
                broker_options={
                    "manage_pool_lifecycle": True,
                },
                scheduled_tasks=[
                    CronJob(
                        function="src.backend.lib.game.process_game",
                        cron="* * * * *",
                        timeout=60,
                        ttl=2000,
                    ),
                ],
            ),
        ],
    ),
)

# Rate Limiting
rate_limit = RateLimitConfig(rate_limit=("minute", 100), exclude_opt_key="no_app_rate_limit")


# Admin
admin_plugin = SQLAdminPlugin(
    views=[
        ConnectionAdminView,
        ConnectionQuestionAdminView,
        EventAdminView,
        QuestionAdminView,
        UserAdminView,
        UserAnswerAdminView,
    ],
    engine=sqlalchemy_config.get_engine(),
)
