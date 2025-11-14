# Makefile for Docker Compose commands
# Makes working with separate dev/prod configs easier

.PHONY: help dev-up dev-down dev-logs dev-rebuild prod-test clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev-up        - Start local development environment"
	@echo "  make dev-down      - Stop local development environment"
	@echo "  make dev-logs      - Follow logs in development"
	@echo "  make dev-rebuild   - Rebuild and start development environment"
	@echo "  make dev-clean     - Stop and remove all volumes (fresh start)"
	@echo "  make prod-test     - Test production config locally (requires env vars)"
	@echo "  make clean         - Remove all containers and volumes"

# Local development commands
dev-up:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-up-d:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

dev-rebuild:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-clean:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# Production testing (requires RDS env vars to be set)
prod-test:
	@echo "Testing production configuration..."
	@echo "Make sure you have RDS_* environment variables set!"
	docker compose up

# Clean everything
clean:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
	docker compose down -v
