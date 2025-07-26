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
    "--event-id",
    help="Event ID to assign the user to",
    type=click.INT,
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
def create_user(  # noqa: C901, PLR0915
    email: str | None,
    name: str | None,
    event_id: int | None,
    admin: bool | None,
) -> None:
    from typing import cast

    import anyio
    import click
    from rich import get_console
    from rich.table import Table

    from src.backend.config import sqlalchemy_config
    from src.backend.lib.dependencies import provide_event_service, provide_user_service

    console = get_console()

    async def _create_user(
        email: str,
        name: str,
        event_id: int,
        is_admin: bool = False,
    ) -> None:
        async with sqlalchemy_config.get_session() as db_session:
            # Get services
            user_service = await anext(provide_user_service(db_session))
            event_service = await anext(provide_event_service(db_session))

            # Verify event exists
            event = await event_service.get_one_or_none(id=event_id)
            if not event:
                console.print(f"[red]Error: Event with ID {event_id} not found[/red]")
                return

            # Create user data
            user_data = {
                "name": name,
                "email": email,
                "event_id": event_id,
                "is_admin": is_admin,
            }

            try:
                # Create the user
                user = await user_service.create(data=user_data, auto_commit=True)
                console.print("[green]User created successfully![/green]")
                console.print(f"Name: {user.name}")
                console.print(f"Email: {user.email}")
                console.print(f"Event: {event.name} (ID: {event.id})")
                console.print(f"Admin: {user.is_admin}")
            except Exception as e:  # noqa: BLE001
                console.print(f"[red]Error creating user: {e!s}[/red]")

    async def _list_events_for_selection() -> int:
        async with sqlalchemy_config.get_session() as db_session:
            event_service = await anext(provide_event_service(db_session))
            events = await event_service.list()

            if not events:
                console.print("[yellow]No events found. Please create an event first.[/yellow]")
                raise click.Abort

            table = Table(title="Available Events")
            table.add_column("ID", style="cyan")
            table.add_column("Name", style="green")
            table.add_column("Code", style="yellow")
            table.add_column("Active", style="red")

            for event in events:
                table.add_row(
                    str(event.id),
                    event.name,
                    event.code,
                    "✓" if event.is_active else "✗",
                )

            console.print(table)

            while True:
                try:
                    selected_id = click.prompt("Enter Event ID", type=int)
                    if any(event.id == selected_id for event in events):
                        return selected_id
                    console.print("[red]Invalid Event ID. Please try again.[/red]")
                except click.Abort:
                    raise
                except Exception:  # noqa: BLE001
                    console.print("[red]Please enter a valid number.[/red]")

    console.rule("Create a new user")
    email = email or click.prompt("Email")
    name = name or click.prompt("Full Name")

    if event_id is None:
        event_id = anyio.run(_list_events_for_selection)

    admin = admin or click.prompt("Create as admin?", default=False, type=click.BOOL)

    anyio.run(_create_user, cast("str", email), cast("str", name), cast("int", event_id), cast("bool", admin))


@user_management_group.command(name="create-event", help="Create a new event")
@click.option(
    "--name",
    help="Name of the event",
    type=click.STRING,
    required=False,
    show_default=False,
)
@click.option(
    "--code",
    help="Event code (unique identifier)",
    type=click.STRING,
    required=False,
    show_default=False,
)
@click.option(
    "--active",
    help="Set event as active",
    type=click.BOOL,
    default=False,
    required=False,
    show_default=False,
    is_flag=True,
)
def create_event(
    name: str | None,
    code: str | None,
    active: bool | None,
) -> None:
    """Create a new event."""
    from typing import cast

    import anyio
    import click
    from rich import get_console

    from src.backend.config import sqlalchemy_config
    from src.backend.lib.dependencies import provide_event_service

    console = get_console()

    async def _create_event(
        name: str,
        code: str,
        is_active: bool = False,
    ) -> None:
        async with sqlalchemy_config.get_session() as db_session:
            # Get services
            event_service = await anext(provide_event_service(db_session))

            # Check if event code already exists
            try:
                existing_event = await event_service.get_one_or_none(code=code)
                if existing_event:
                    console.print(f"[red]Error: Event with code '{code}' already exists[/red]")
                    return
            except Exception:  # noqa: BLE001, S110
                pass

            # Create event data
            event_data = {
                "name": name,
                "code": code,
                "is_active": is_active,
                "whitelist": {},
            }

            try:
                # Create the event
                event = await event_service.create(data=event_data, auto_commit=True)
                console.print("[green]Event created successfully![/green]")
                console.print(f"Name: {event.name}")
                console.print(f"Code: {event.code}")
                console.print(f"ID: {event.id}")
                console.print(f"Active: {event.is_active}")
            except Exception as e:  # noqa: BLE001
                console.print(f"[red]Error creating event: {e!s}[/red]")

    console.rule("Create a new event")
    name = name or click.prompt("Event Name")
    code = code or click.prompt("Event Code")
    active = active or click.prompt("Set event as active?", default=False, type=click.BOOL)

    anyio.run(_create_event, cast("str", name), cast("str", code), cast("bool", active))


@user_management_group.command(name="list-events", help="List all events")
def list_events() -> None:
    """List all events."""
    import anyio
    from rich import get_console
    from rich.table import Table

    from src.backend.config import sqlalchemy_config
    from src.backend.lib.dependencies import provide_event_service

    console = get_console()

    async def _list_events() -> None:
        async with sqlalchemy_config.get_session() as db_session:
            event_service = await anext(provide_event_service(db_session))
            events = await event_service.list()

            if not events:
                console.print("[yellow]No events found[/yellow]")
                return

            table = Table(title="Events")
            table.add_column("ID", style="cyan")
            table.add_column("Name", style="green")
            table.add_column("Code", style="yellow")
            table.add_column("Active", style="red")

            for event in events:
                table.add_row(
                    str(event.id),
                    event.name,
                    event.code,
                    "✓" if event.is_active else "✗",
                )

            console.print(table)

    anyio.run(_list_events)


class CLIPlugin(CLIPluginProtocol):
    def on_cli_init(self, cli: Group) -> None:
        cli.add_command(user_management_group)
