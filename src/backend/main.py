from advanced_alchemy.exceptions import DuplicateKeyError, NotFoundError, RepositoryError
from litestar import Litestar
from litestar.logging import LoggingConfig
from litestar.openapi import OpenAPIConfig
from litestar.openapi.plugins import ScalarRenderPlugin

from backend.cli import CLIPlugin
from backend.config import (
    admin_plugin,
    alchemy_plugin,
    channels_plugin,
    jwt_cookie_auth,
    rate_limit,
    saq_plugin,
    settings,
    vite_plugin,
)
from backend.controllers.auth import AuthController
from backend.controllers.connection import ConnectionController
from backend.controllers.event import EventController
from backend.controllers.frontend import WebController
from backend.controllers.game import GameController
from backend.controllers.question import QuestionController
from backend.controllers.user import UserController
from backend.controllers.user_answer import UserAnswerController
from backend.lib.utils import exception_handler

app = Litestar(
    debug=settings.debug,
    route_handlers=[
        AuthController,
        ConnectionController,
        EventController,
        GameController,
        QuestionController,
        UserController,
        UserAnswerController,
        WebController,
    ],
    plugins=[admin_plugin, alchemy_plugin, channels_plugin, saq_plugin, vite_plugin, CLIPlugin()],
    on_app_init=[jwt_cookie_auth.on_app_init],
    openapi_config=OpenAPIConfig(
        title="Byte Bond",
        version="dev",
        path="/api/schema",
        render_plugins=[ScalarRenderPlugin()],
    ),
    logging_config=LoggingConfig(
        disable_stack_trace={400, 401, 403, 404, 405, NotFoundError, DuplicateKeyError},
    ),
    exception_handlers={
        Exception: exception_handler,
        RepositoryError: exception_handler,
    },
    middleware=[rate_limit.middleware],
)
