from __future__ import annotations

import copy
from typing import TYPE_CHECKING, ClassVar

import logfire
from litestar.contrib.opentelemetry import (
    OpenTelemetryConfig,
    OpenTelemetryInstrumentationMiddleware,
)
from litestar.middleware import AbstractMiddleware
from opentelemetry import metrics

if TYPE_CHECKING:
    from litestar.types import ASGIApp
    from opentelemetry.instrumentation.asgi import OpenTelemetryMiddleware


class OpenTelemetrySingletonMiddleware(OpenTelemetryInstrumentationMiddleware):
    __open_telemetry_middleware__: ClassVar[OpenTelemetryMiddleware]

    def __init__(self, app: ASGIApp, config: OpenTelemetryConfig) -> None:
        cls = self.__class__
        if singleton_middleware := getattr(cls, "__open_telemetry_middleware__", None):
            AbstractMiddleware.__init__(
                self,
                app,
                scopes=config.scopes,
                exclude=config.exclude,
                exclude_opt_key=config.exclude_opt_key,
            )
            self.open_telemetry_middleware = copy.copy(singleton_middleware)
            self.open_telemetry_middleware.app = app
        else:
            super().__init__(app, config)
            cls.__open_telemetry_middleware__ = self.open_telemetry_middleware


def configure_instrumentation() -> OpenTelemetryConfig:
    logfire.configure()
    return OpenTelemetryConfig(meter=metrics.get_meter(__name__), middleware_class=OpenTelemetrySingletonMiddleware)
