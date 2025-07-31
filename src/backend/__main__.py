from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import NoReturn


def setup_environment() -> None:
    current_path = Path(__file__).parent.parent.resolve()
    sys.path.append(str(current_path))

    os.environ.setdefault("LITESTAR_APP", "src.backend.main:app")
    os.environ.setdefault("LITESTAR_APP_NAME", "ByteBond")


def run_cli() -> NoReturn:
    setup_environment()

    try:
        from litestar.cli.main import litestar_group

        sys.exit(litestar_group())
    except ImportError as exc:
        print(  # noqa: T201
            "Could not load required libraries. ",
            "Please check your installation and make sure you activated any necessary virtual environment",
        )
        print(exc)  # noqa: T201
        sys.exit(1)


if __name__ == "__main__":
    run_cli()
