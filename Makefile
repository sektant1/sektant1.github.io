# skt-ui-toolkit
#
# `make` on its own lists everything. Targets are grouped by what you are
# doing: working on the toolkit, working on the site, or running the site on a
# server.

.DEFAULT_GOAL := help
SHELL := /usr/bin/env bash
.SHELLFLAGS := -eu -o pipefail -c

# Where a self-hosted install lives. Override for a different directory:
#   make deploy DIR=/srv/hideout
DIR ?= $(HOME)/hideout
COMPOSE := docker compose --env-file $(DIR)/.env -f $(DIR)/docker-compose.yml
# The local overlay builds from this working copy instead of pulling.
COMPOSE_LOCAL := docker compose -f docker-compose.yml -f docker-compose.dev.yml

##@ General

.PHONY: help
help: ## Show this list
	@awk 'BEGIN { FS = ":.*##" } \
		/^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5); next } \
		/^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[32m%-18s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)
	@echo

##@ Setup

.PHONY: install
install: ## Install dependencies for every workspace
	npm ci

.PHONY: clean
clean: ## Remove build output and caches (keeps node_modules)
	rm -rf apps/web/dist apps/hideout/.next apps/hideout/out .turbo
	find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete

.PHONY: reset
reset: clean ## Remove node_modules too, then reinstall
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	npm install

##@ Develop

.PHONY: dev
dev: ## Run the showcase and the site together (5173 and 3000)
	npm run dev

.PHONY: dev-site
dev-site: ## Run just sektant.dev, on :3000
	npm run dev --workspace hideout

.PHONY: dev-showcase
dev-showcase: ## Run just the component showcase, on :5173
	npm run dev --workspace web

##@ Verify

.PHONY: check
check: registry-check test typecheck lint ## Everything CI runs, except the builds

.PHONY: test
test: ## Unit tests for the registry generator and storage
	npm run test

.PHONY: typecheck
typecheck: ## tsc --noEmit across every workspace
	npm run typecheck

.PHONY: lint
lint: ## eslint across every workspace
	npm run lint

.PHONY: format
format: ## Rewrite files with prettier
	npm run format

##@ Registry

.PHONY: registry
registry: ## Regenerate registry.json and the served /r/*.json
	npm run registry:build

.PHONY: registry-check
registry-check: ## Fail if registry.json and the components directory disagree
	npm run registry:check

##@ Build

.PHONY: build
build: ## Build every workspace
	npm run build

.PHONY: build-site
build-site: ## Build sektant.dev as a standalone Node server
	npm run build --workspace hideout

.PHONY: build-pages
build-pages: ## Build sektant.dev as a static export, CMS stripped out
	npm run build:pages --workspace hideout

.PHONY: image
image: ## Build the container image locally
	docker build -f apps/hideout/Dockerfile -t hideout:local .

##@ Serve

.PHONY: up
up: ## Start the site from this working copy (builds the image)
	$(COMPOSE_LOCAL) up -d --build

.PHONY: down
down: ## Stop the locally-built site
	$(COMPOSE_LOCAL) down

.PHONY: logs
logs: ## Follow the locally-built site's logs
	$(COMPOSE_LOCAL) logs -f

##@ Deploy

.PHONY: deploy
deploy: ## Pull the published image and restart (override with DIR=)
	@test -f $(DIR)/.env || { \
		echo "No install at $(DIR). Run scripts/install.sh first."; exit 1; }
	$(COMPOSE) pull
	$(COMPOSE) up -d
	docker image prune -f >/dev/null

.PHONY: deploy-logs
deploy-logs: ## Follow the deployed site's logs
	$(COMPOSE) logs -f

.PHONY: deploy-status
deploy-status: ## Show what the deployed site is running
	@$(COMPOSE) ps
	@echo
	@docker inspect --format \
		'image: {{.Config.Image}}{{"\n"}}started: {{.State.StartedAt}}' hideout

.PHONY: release
release: ## Merge development into master, which publishes a new image
	@git diff --quiet || { echo "Working tree is dirty. Commit first."; exit 1; }
	git checkout master
	git pull --ff-only
	git merge --no-ff development
	git push
	@echo
	@echo "Pushed. CI is building the image; watch it with:"
	@echo "  gh run watch"
	@echo "Then update the server with: make deploy"
