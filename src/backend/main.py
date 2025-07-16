from litestar import Litestar
from litestar.openapi import OpenAPIConfig
from litestar.openapi.plugins import ScalarRenderPlugin

from backend.config import alchemy_plugin, channels_plugin

app = Litestar(
    route_handlers=[],
    plugins=[alchemy_plugin, channels_plugin],
    debug=True,
    openapi_config=OpenAPIConfig(
        title="Byte Bond",
        version="dev",
        render_plugins=[ScalarRenderPlugin()],
    ),
)
