.PHONY: start-infra stop-infra start-prod stop-prod lint api-schema build

INFRA_COMPOSE_FILE := containers/docker-compose.infra.yaml
APP_COMPOSE_FILE := containers/docker-compose.prod.yaml

start-infra:
	@echo "Starting infrastructure (AlloyDB Omni)... 🔄"
	docker compose -f $(INFRA_COMPOSE_FILE) up -d
	@echo "Infrastructure started. ✅"

stop-infra:
	@echo "Stopping infrastructure... 🔄"
	docker compose -f $(INFRA_COMPOSE_FILE) down
	@echo "Infrastructure stopped. ✅"

start-prod:
	@echo "Starting application... 🔄"
	docker compose -f $(INFRA_COMPOSE_FILE) up -d
	docker compose -f $(APP_COMPOSE_FILE) up --build -d
	@echo "Application started. ✅"

stop-prod:
	@echo "Stopping application... 🔄"
	docker compose -f $(APP_COMPOSE_FILE) down
	docker compose -f $(INFRA_COMPOSE_FILE) down
	@echo "Application stopped. ✅"

lint:
	@echo "Running linters... 🔄"
	cd src/frontend && npm run lint
	pre-commit install
	pre-commit run -a
	@echo "Linters completed. ✅"

api-schema:
	@echo "Generating API schema... 🔄"
	cd src/frontend && npm run export-schema && npm run generate-types
	@echo "API schema generated. ✅"

build:
	@echo "Building frontend... 🔄"
	cd src/frontend && npm run build
	@echo "Frontend build completed. ✅"
