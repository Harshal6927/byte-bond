from advanced_alchemy.exceptions import DuplicateKeyError, NotFoundError, RepositoryError
from litestar import Litestar
from litestar.exceptions import ClientException, NotAuthorizedException, NotFoundException
from litestar.logging import LoggingConfig
from litestar.openapi import OpenAPIConfig
from litestar.openapi.plugins import ScalarRenderPlugin

from src.backend.cli import CLIPlugin
from src.backend.config import (
    admin_plugin,
    alchemy_plugin,
    channels_plugin,
    jwt_cookie_auth,
    saq_plugin,
    settings,
    vite_plugin,
)
from src.backend.controllers.auth import AuthController
from src.backend.controllers.event import EventController
from src.backend.controllers.frontend import WebController
from src.backend.controllers.game import GameController
from src.backend.controllers.question import QuestionController
from src.backend.controllers.user import UserController
from src.backend.controllers.user_answer import UserAnswerController
from src.backend.lib.otel import configure_instrumentation
from src.backend.lib.utils import exception_handler

app = Litestar(
    debug=settings.debug,
    route_handlers=[
        AuthController,
        EventController,
        GameController,
        QuestionController,
        UserController,
        UserAnswerController,
        WebController,
    ],
    plugins=[
        admin_plugin,
        alchemy_plugin,
        channels_plugin,
        saq_plugin,
        vite_plugin,
        CLIPlugin(),
    ],
    on_app_init=[jwt_cookie_auth.on_app_init],
    openapi_config=OpenAPIConfig(
        title="Byte Bond",
        version="dev",
        path="/api/schema",
        render_plugins=[ScalarRenderPlugin()],
    ),
    logging_config=LoggingConfig(
        disable_stack_trace={
            400,
            401,
            403,
            404,
            405,
            429,
            NotFoundError,
            DuplicateKeyError,
            ClientException,
            NotAuthorizedException,
            NotFoundException,
        },
        log_exceptions="always",
    ),
    exception_handlers={
        Exception: exception_handler,
        RepositoryError: exception_handler,
    },
    middleware=[configure_instrumentation().middleware],
)
