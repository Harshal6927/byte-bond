import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from rich import get_console

console = get_console()


@dataclass
class ViteSettings:
    use_server_lifespan: bool = field(
        default_factory=lambda: os.getenv("VITE_USE_SERVER_LIFESPAN", "false").lower() in {"true", "1", "yes"},
    )
    host: str = field(
        default_factory=lambda: os.getenv("VITE_HOST", "0.0.0.0"),  # noqa: S104
    )
    port: int = field(
        default_factory=lambda: int(os.getenv("VITE_PORT", "8080")),
    )
    hot_reload: bool = field(
        default_factory=lambda: os.getenv("VITE_HOT_RELOAD", "false").lower() in {"true", "1", "yes"},
    )
    asset_url: str = field(
        default_factory=lambda: os.getenv("ASSET_URL", "/static/"),
    )
    root_dir: Path = Path(__file__).parent.parent / "frontend"
    resource_dir: Path = Path(__file__).parent.parent / "frontend" / "src"
    bundle_dir: Path = Path(__file__).parent / "web" / "static"


@dataclass
class Settings:
    debug: bool = field(
        default_factory=lambda: os.getenv("DEBUG", "false").lower() in {"true", "1", "yes"},
    )
    db_connection_string: str | None = field(
        default_factory=lambda: os.getenv("DB_CONNECTION_STRING"),
    )
    vakley_port: int = field(
        default_factory=lambda: int(os.getenv("VALKEY_PORT", "6379")),
    )
    valkey_host: str = field(
        default_factory=lambda: os.getenv("VALKEY_HOST", "localhost"),
    )
    vite: ViteSettings = field(default_factory=ViteSettings)

    def __post_init__(self) -> None: ...

    def get_conn_string_without_adaptor(self) -> str | None:
        if not self.db_connection_string:
            return None

        return self.db_connection_string.replace("+psycopg", "")

    @classmethod
    def from_env(cls, dotenv_filename: str) -> "Settings":
        env_file = (
            Path(dotenv_filename) if Path(dotenv_filename).is_absolute() else Path(f"{os.curdir}/{dotenv_filename}")
        )

        if env_file.is_file():
            from dotenv import load_dotenv

            console.print(
                f"[yellow]Loading environment configuration from {dotenv_filename}[/]",
                markup=True,
            )

            load_dotenv(env_file, override=True)
        return Settings()


@lru_cache(maxsize=1, typed=True)
def get_settings() -> Settings:
    return Settings.from_env(
        dotenv_filename=".env",
    )
