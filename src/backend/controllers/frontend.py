import anyio
from litestar import Controller, MediaType, Response, get
from litestar.status_codes import HTTP_200_OK

from backend.settings import get_settings


class WebController(Controller):
    opt = {"exclude_from_auth": True}
    include_in_schema = False

    @get(["/", "/{path:path}"], operation_id="WebIndex", status_code=HTTP_200_OK)
    async def index(self) -> Response[str]:
        settings = get_settings()

        file_path = (
            anyio.Path("src/frontend/index.html") if settings.debug else anyio.Path("src/backend/web/static/index.html")
        )

        async with await anyio.open_file(file_path) as file:
            return Response(content=await file.read(), status_code=HTTP_200_OK, media_type=MediaType.HTML)
