#!/usr/bin/env bash
#
# Installs sektant.dev on a Debian/Ubuntu box.
#
#   curl -fsSL https://raw.githubusercontent.com/sektant1/sektant1.github.io/master/scripts/install.sh | bash
#
# Always installs what is on master. Merging to master publishes a new image
# and re-running this picks it up; `development` is for work in progress and is
# never what a server ends up on.
#
# Two ways to run it, picked in this order:
#
#   docker  — pulls the image CI built and starts it with compose. Nothing is
#             compiled here, and CasaOS manages the container.
#   node    — clones the repo and builds on the host, behind a systemd unit.
#             Used when Docker is not installed.
#
# Override anything with an environment variable:
#
#   SKT_MODE=node SKT_PORT=8080 SKT_REF=development curl -fsSL … | bash
#
# Re-running is safe: it pulls, restarts, and keeps your .env and content.

set -euo pipefail

OWNER="${SKT_OWNER:-sektant1}"
REPO="${SKT_REPO_NAME:-skt-ui-toolkit}"
REF="${SKT_REF:-master}"
REPO_URL="${SKT_REPO:-https://github.com/$OWNER/$REPO.git}"
RAW_URL="https://raw.githubusercontent.com/$OWNER/$REPO/$REF"
IMAGE="${SKT_IMAGE:-ghcr.io/$OWNER/hideout:latest}"
INSTALL_DIR="${SKT_DIR:-$HOME/hideout}"
PORT="${SKT_PORT:-3000}"
MODE="${SKT_MODE:-auto}"
SERVICE_NAME="hideout"
NODE_MAJOR=22

# ── output ───────────────────────────────────────────────────────────────────

if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'; OFF=$'\033[0m'
else
  BOLD=""; DIM=""; GREEN=""; RED=""; OFF=""
fi

step() { printf '%s==>%s %s\n' "$GREEN$BOLD" "$OFF$BOLD" "$1$OFF"; }
info() { printf '    %s%s%s\n' "$DIM" "$1" "$OFF"; }
die()  { printf '%serror:%s %s\n' "$RED$BOLD" "$OFF" "$1" >&2; exit 1; }

# When piped from curl there is no terminal on stdin, so prompts read from the
# tty directly. If there is no tty either — a cron run, a CI job — the defaults
# stand and nothing blocks.
ask() {
  local prompt="$1" default="$2" answer=""
  if [ -r /dev/tty ]; then
    read -r -p "    $prompt [$default]: " answer </dev/tty || true
  fi
  printf '%s' "${answer:-$default}"
}

# ── preflight ────────────────────────────────────────────────────────────────

[ "$(id -u)" -eq 0 ] && die "Run this as your normal user. It calls sudo where it needs root."
command -v sudo >/dev/null 2>&1 || die "sudo is required and was not found."
command -v apt-get >/dev/null 2>&1 || die "This installer targets Debian and Ubuntu."
command -v curl >/dev/null 2>&1 || die "curl is required and was not found."

step "Checking prerequisites"

if [ "$MODE" = "auto" ]; then
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    MODE="docker"
  else
    MODE="node"
  fi
fi
info "Install mode: $MODE, tracking $REF"

mkdir -p "$INSTALL_DIR"

# ── credentials ──────────────────────────────────────────────────────────────
#
# The CMS at /admin writes files. Whatever is set here is the only thing
# standing between the network and those writes, so it is never left at a
# built-in default.

ENV_FILE="$INSTALL_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  step "Setting up the CMS login"

  ADMIN_USER="$(ask 'Admin username' 'admin')"
  ADMIN_PASS=""
  if [ -r /dev/tty ]; then
    read -r -s -p "    Admin password (blank to generate one): " ADMIN_PASS </dev/tty || true
    echo
  fi
  if [ -z "$ADMIN_PASS" ]; then
    ADMIN_PASS="$(head -c 18 /dev/urandom | base64 | tr -d '/+=' | cut -c1-20)"
    info "Generated password: $ADMIN_PASS"
    info "It is stored in $ENV_FILE — write it down now."
  fi

  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  SITE_URL="$(ask 'Public URL of the site' "http://${LAN_IP:-localhost}:$PORT")"

  umask 077
  cat > "$ENV_FILE" <<EOF
# Written by scripts/install.sh. Contains the CMS password: keep it out of git.
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASS
SITE_URL=$SITE_URL
HIDEOUT_PORT=$PORT
HIDEOUT_IMAGE=$IMAGE
# Set to true to serve the public site with the CMS switched off entirely.
HIDE_ADMIN=false
EOF
  info "Wrote $ENV_FILE"
else
  info "Keeping the existing $ENV_FILE"
  PORT="$(grep -E '^HIDEOUT_PORT=' "$ENV_FILE" | cut -d= -f2- || echo "$PORT")"
fi

# ── docker ───────────────────────────────────────────────────────────────────

install_docker_mode() {
  docker info >/dev/null 2>&1 || die \
    "Cannot talk to the Docker daemon. Add yourself to the docker group ('sudo usermod -aG docker $USER'), log out and back in, then re-run this."

  step "Fetching the compose file"
  curl -fsSL "$RAW_URL/docker-compose.yml" -o "$INSTALL_DIR/docker-compose.yml" \
    || die "Could not download the compose file from $RAW_URL."

  # The CMS writes into this, and the compose file mounts it. Seeded from the
  # image on first run so an empty install still has the posts.
  mkdir -p "$INSTALL_DIR/content"

  step "Pulling the image"
  info "$IMAGE"
  docker compose --env-file "$ENV_FILE" -f "$INSTALL_DIR/docker-compose.yml" pull \
    || die "Could not pull $IMAGE. If the package is private, run 'docker login ghcr.io' first."

  if [ -z "$(ls -A "$INSTALL_DIR/content" 2>/dev/null)" ]; then
    step "Seeding content from the image"
    # A one-shot container, only to copy the posts the image was built with
    # out to the host before the volume shadows them.
    local cid
    cid="$(docker create "$IMAGE")"
    docker cp "$cid:/app/apps/hideout/content/." "$INSTALL_DIR/content/" 2>/dev/null || true
    docker rm -f "$cid" >/dev/null
    info "Content is now at $INSTALL_DIR/content — commit changes from there."
  fi

  step "Starting"
  docker compose --env-file "$ENV_FILE" -f "$INSTALL_DIR/docker-compose.yml" up -d

  install_update_timer

  step "Done"
  info "Logs:     docker compose -f $INSTALL_DIR/docker-compose.yml logs -f"
  info "Update:   $INSTALL_DIR/update.sh"
  info "CasaOS:   Apps → Custom Install → Import, then pick $INSTALL_DIR/docker-compose.yml"
}

# A pull-and-restart script, plus an optional timer that runs it. This is the
# other half of the deploy: merging to master publishes an image, and this is
# what puts it on the server.
install_update_timer() {
  cat > "$INSTALL_DIR/update.sh" <<EOF
#!/usr/bin/env bash
# Pulls the current master image and restarts if it changed.
set -euo pipefail
cd "$INSTALL_DIR"
docker compose --env-file .env pull
docker compose --env-file .env up -d
# Old layers pile up fast on a laptop disk.
docker image prune -f >/dev/null
EOF
  chmod +x "$INSTALL_DIR/update.sh"

  local answer
  answer="$(ask 'Check for updates automatically, once a day? (y/n)' 'y')"
  case "$answer" in
    y | Y | yes) ;;
    *)
      info "Skipped. Run $INSTALL_DIR/update.sh when you want to update."
      return
      ;;
  esac

  sudo tee /etc/systemd/system/hideout-update.service >/dev/null <<EOF
[Unit]
Description=Pull the current sektant.dev image
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=$USER
ExecStart=$INSTALL_DIR/update.sh
EOF

  sudo tee /etc/systemd/system/hideout-update.timer >/dev/null <<EOF
[Unit]
Description=Daily check for a new sektant.dev image

[Timer]
OnCalendar=daily
# Spread over an hour so every box does not hit the registry at once, and
# catch up after the laptop has been asleep.
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable --now hideout-update.timer
  info "Timer on: systemctl status hideout-update.timer"
}

# ── node ─────────────────────────────────────────────────────────────────────

install_node_mode() {
  if ! command -v git >/dev/null 2>&1; then
    info "Installing git"
    sudo apt-get update -qq
    sudo apt-get install -y -qq git
  fi

  if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
    step "Installing Node $NODE_MAJOR"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
    sudo apt-get install -y -qq nodejs
  fi
  info "Node $(node -v)"

  local src="$INSTALL_DIR/src"

  step "Fetching the source"
  if [ -d "$src/.git" ]; then
    git -C "$src" fetch --depth 1 origin "$REF"
    git -C "$src" reset --hard "origin/$REF"
  else
    git clone --depth 1 --branch "$REF" "$REPO_URL" "$src" \
      || die "Could not clone $REPO_URL at $REF."
  fi

  cd "$src"

  step "Installing dependencies"
  npm ci

  step "Building the site"
  info "This takes a few minutes on a laptop. Docker mode skips it entirely."
  ln -sf "$ENV_FILE" apps/hideout/.env.local
  npm run build --workspace hideout

  # The standalone output does not include these, and the server reads both.
  cp -r apps/hideout/.next/static apps/hideout/.next/standalone/apps/hideout/.next/
  cp -r apps/hideout/public apps/hideout/.next/standalone/apps/hideout/

  step "Installing the systemd service"

  sudo tee "/etc/systemd/system/$SERVICE_NAME.service" >/dev/null <<EOF
[Unit]
Description=Sektant's Hideout
Documentation=$REPO_URL
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$src/apps/hideout
EnvironmentFile=$ENV_FILE
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOSTNAME=0.0.0.0
# The standalone bundle: the server plus only the modules it imports.
ExecStart=$(command -v node) $src/apps/hideout/.next/standalone/apps/hideout/server.js
Restart=on-failure
RestartSec=5

# The service serves a public site and only ever needs its own directory.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=$src/apps/hideout/content

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable --now "$SERVICE_NAME"

  step "Done"
  info "Service: sudo systemctl status $SERVICE_NAME"
  info "Logs:    journalctl -u $SERVICE_NAME -f"
  info "Update:  re-run this installer"
}

case "$MODE" in
  docker) install_docker_mode ;;
  node)   install_node_mode ;;
  *)      die "SKT_MODE must be 'docker', 'node' or 'auto' — got '$MODE'." ;;
esac

printf '\n%sThe site is on http://%s:%s%s\n' \
  "$BOLD" "$(hostname -I 2>/dev/null | awk '{print $1}')" "$PORT" "$OFF"
printf '%sThe CMS is at /admin, signed in with the credentials in %s%s\n\n' \
  "$DIM" "$ENV_FILE" "$OFF"
