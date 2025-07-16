import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from rich import get_console

console = get_console()


@dataclass
class Settings:
    debug: bool = field(
        default_factory=lambda: os.getenv("DEBUG", "false").lower() in {"true", "1", "yes"},
    )
    db_connection_string: str = field(
        default_factory=lambda: os.getenv("DB_CONNECTION_STRING"),
    )
    secret_key: str = field(
        default_factory=lambda: os.getenv("SECRET_KEY"),
    )

    def __post_init__(self) -> None: ...

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
