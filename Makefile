.PHONY: lint api-schema

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
