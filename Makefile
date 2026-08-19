.PHONY: install build dev serve lint clean help

install: ## Install all dependencies
	pip install -e .
	npm install

build: ## Build CSS for production
	npm run build

dev: ## Build CSS in dev mode (expanded, source maps)
	npm run dev

serve: ## Start MkDocs dev server
	mkdocs serve

watch: ## Watch and rebuild CSS on changes
	npm start

lint: ## Run linter on Python code
	ruff check neoabs/

clean: ## Remove build artifacts
	rm -rf site/ dist/ build/ *.egg-info .ruff_cache/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
