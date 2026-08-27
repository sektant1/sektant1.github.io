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
	rm -rf apps/web/dist apps/hideout/.next apps/hideout/out dist-pages .turbo
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

.PHONY: pages
pages: ## Assemble exactly what GitHub Pages serves, into dist-pages/
	npm run pages:build

.PHONY: pages-serve
pages-serve: pages ## Assemble the Pages artifact and serve it on :8000
	@echo "hideout /  ·  registry /r  ·  showcase /showcase"
	npx --yes serve dist-pages

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

.PHONY: deploy-staging
deploy-staging: ## Deploy the image built from development, not master
	@test -f $(DIR)/.env || { \
		echo "No install at $(DIR). Run scripts/install.sh first."; exit 1; }
	HIDEOUT_IMAGE=ghcr.io/sektant1/hideout:development $(COMPOSE) pull
	HIDEOUT_IMAGE=ghcr.io/sektant1/hideout:development $(COMPOSE) up -d

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
release: release-preflight ## Merge development into master, which publishes image and site
	git checkout master
	git pull --ff-only
	git merge --no-ff development
	git push
	@echo
	@echo "Pushed. Release is building the image and the Pages site; watch it with:"
	@echo "  gh run watch"
	@echo "Then update the server with: make deploy"

# Every failure below is one git would report too, but only halfway through —
# after a checkout or a merge has already moved the working copy.
.PHONY: release-preflight
release-preflight: ## Check that a release can run, without changing anything
	@git rev-parse --git-dir >/dev/null 2>&1 \
		|| { echo "Not a git repository."; exit 1; }
	@git diff --quiet && git diff --cached --quiet \
		|| { echo "Working tree is dirty. Commit or stash first."; exit 1; }
	@git remote get-url origin >/dev/null 2>&1 || { \
		echo "No 'origin' remote. Releasing pushes to GitHub, so add one:"; \
		echo "  git remote add origin git@github.com:sektant1/skt-ui-toolkit.git"; \
		exit 1; }
	@git show-ref --verify --quiet refs/heads/development || { \
		echo "No 'development' branch. Work lands there before it reaches master:"; \
		echo "  git switch -c development"; \
		exit 1; }
	@git show-ref --verify --quiet refs/heads/master \
		|| { echo "No 'master' branch."; exit 1; }
	@test -z "$$(git log master..development --oneline 2>/dev/null)" \
		&& { echo "Nothing to release: development has no commits master lacks."; \
		exit 1; } || true
	@echo "Ready to release:"
	@git log master..development --oneline | sed 's/^/  /'
