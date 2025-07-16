#!/bin/bash
set -e

# Run database migrations
litestar database upgrade --no-prompt

# Execute the main command
exec "$@"
