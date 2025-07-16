from typing import Any

import click
from click import Group
from litestar.plugins import CLIPluginProtocol


@click.group(name="users", invoke_without_command=False, help="Manage application users.")
@click.pass_context
def user_management_group(_: dict[str, Any]) -> None:
    """Manage application users."""


@user_management_group.command(name="create-user", help="Create a user for an event")
@click.option(
    "--email",
    help="Email of the new user",
    type=click.STRING,
    required=False,
    show_default=False,
)
@click.option(
    "--name",
    help="Full name of the new user",
    type=click.STRING,
    required=False,
    show_default=False,
)
@click.option(
    "--admin",
    help="Is an admin user",
    type=click.BOOL,
    default=False,
    required=False,
    show_default=False,
    is_flag=True,
)
def create_user(
    email: str | None,
    name: str | None,
    admin: bool | None,
) -> None:
    from typing import cast

    import anyio
    import click
    from rich import get_console

    from backend.config import sqlalchemy_config
    from backend.lib.dependencies import provide_user_service

    console = get_console()

    async def _create_user(
        email: str,
        name: str,
        is_admin: bool = False,
    ) -> None:
        async with sqlalchemy_config.get_session() as db_session:
            # Get services
            user_service = await anext(provide_user_service(db_session))

            # Create user data
            user_data = {
                "name": name,
                "email": email,
                "is_admin": is_admin,
            }

            # Create the user
            user = await user_service.create(data=user_data, auto_commit=True)
            console.print("[green]User created successfully![/green]")
            console.print(f"Name: {user.name}")
            console.print(f"Email: {user.email}")
            console.print(f"Admin: {user.is_admin}")

    console.rule("Create a new user")
    email = email or click.prompt("Email")
    name = name or click.prompt("Full Name")
    admin = admin or click.prompt("Create as admin?", default=False, type=click.BOOL)

    anyio.run(_create_user, cast("str", email), cast("str", name), cast("bool", admin))


class CLIPlugin(CLIPluginProtocol):
    def on_cli_init(self, cli: Group) -> None:
        cli.add_command(user_management_group)


# @user_management_group.command(name="create-event", help="Create a new event")
# @click.option(
#     "--name",
#     help="Name of the event",
#     type=click.STRING,
#     required=False,
#     show_default=False,
# )
# @click.option(
#     "--code",
#     help="Event code (unique identifier)",
#     type=click.STRING,
#     required=False,
#     show_default=False,
# )
# def create_event(
#     name: str | None,
#     code: str | None,
# ) -> None:
#     """Create a new event."""
#     from typing import cast

#     import anyio
#     import click
#     from rich import get_console

#     from backend.config import alchemy
#     from backend.lib.dependencies import provide_event_service

#     console = get_console()

#     async def _create_event(name: str, code: str) -> None:
#         async with alchemy.get_session() as db_session:
#             event_service = await anext(provide_event_service(db_session))

#             # Check if event code already exists
#             existing_event = await event_service.get_one_or_none(code=code)
#             if existing_event:
#                 console.print(f"[red]Error: Event with code '{code}' already exists[/red]")
#                 return

#             # Create event data
#             event_data = {
#                 "name": name,
#                 "code": code,
#                 "is_active": False,
#                 "whitelist": {},
#             }

#             # Create the event
#             event = await event_service.create(data=event_data, auto_commit=True)
#             console.print("[green]Event created successfully![/green]")
#             console.print(f"Name: {event.name}")
#             console.print(f"Code: {event.code}")
#             console.print(f"ID: {event.id}")

#     console.rule("Create a new event")
#     name = name or click.prompt("Event Name")
#     code = code or click.prompt("Event Code")

#     anyio.run(_create_event, cast("str", name), cast("str", code))


# @user_management_group.command(name="list-events", help="List all events")
# def list_events() -> None:
#     """List all events."""
#     import anyio
#     from rich import get_console
#     from rich.table import Table

#     from backend.config import alchemy
#     from backend.lib.dependencies import provide_event_service

#     console = get_console()

#     async def _list_events() -> None:
#         async with alchemy.get_session() as db_session:
#             event_service = await anext(provide_event_service(db_session))
#             events = await event_service.list()

#             if not events:
#                 console.print("[yellow]No events found[/yellow]")
#                 return

#             table = Table(title="Events")
#             table.add_column("ID", style="cyan")
#             table.add_column("Name", style="green")
#             table.add_column("Code", style="yellow")
#             table.add_column("Active", style="red")
#             table.add_column("Users", style="blue")

#             for event in events:
#                 table.add_row(
#                     str(event.id),
#                     event.name,
#                     event.code,
#                     "✓" if event.is_active else "✗",
#                     str(len(event.users)) if event.users else "0",
#                 )

#             console.print(table)

#     anyio.run(_list_events)
