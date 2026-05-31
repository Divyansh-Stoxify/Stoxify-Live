#!/bin/bash
# Deploy script executed ON the target server.
# Modes:
#   raw    -> build & run the Next.js standalone server directly with Node
#   docker -> pull image from registry and run via docker compose
set -euo pipefail

DEPLOY_MODE=$1
REGISTRY_URL=$2
REGISTRY_USERNAME=$3
REGISTRY_PASSWORD=$4
TAG=$5
DISK_THRESHOLD=$6

APP_NAME="stocxify"
APP_PORT="${PORT:-3000}"

echo "Deploy mode: $DEPLOY_MODE"

install_node() {
    if ! command -v node &> /dev/null; then
        echo "Node.js is not installed. Installing via nvm..."
        if ! command -v nvm &> /dev/null; then
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        fi
        export NVM_DIR="$HOME/.nvm"
        # shellcheck disable=SC1090
        source "$NVM_DIR/nvm.sh"
        nvm install 22
        nvm use 22
    fi
}

install_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Installing Docker..."
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        echo \
          "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        sudo usermod -aG docker "$USER"
    else
        echo "Docker is already installed."
    fi
}

# ---- RAW MODE: build the Next.js standalone server and run it with Node ----
execute_raw() {
    echo "Executing $APP_NAME in raw mode..."

    # Free the app port if something is already listening on it
    if command -v lsof &> /dev/null; then
        lsof -t -i:"$APP_PORT" | xargs -r kill -9 || true
    fi
    sleep 2

    rm -rf "$APP_NAME"
    mkdir -p "$APP_NAME"
    tar -zxf "${APP_NAME}.tar.gz" -C "$APP_NAME"

    # Keep a timestamped backup of the artifact
    mkdir -p builds
    TIMESTAMP=$(date +"%Y%m%d%H%M%S")
    mv "${APP_NAME}.tar.gz" "builds/${APP_NAME}.tar.gz.${TIMESTAMP}"

    cd "$APP_NAME"
    npm ci > install.out 2>&1
    npm run build

    # next.config.ts uses output: "standalone", so a self-contained
    # server bundle is emitted to .next/standalone with a server.js entrypoint.
    cp -r public .next/standalone/ 2>/dev/null || true
    cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

    echo "Starting standalone server on port ${APP_PORT}..."
    PORT="$APP_PORT" HOSTNAME=0.0.0.0 nohup node .next/standalone/server.js > ./stocxify.log 2>&1 &
}

# ---- DOCKER MODE: pull image from registry and run via docker compose ----
execute_docker() {
    echo "Executing Docker deployment..."

    if [ ! -f "docker-compose.yml" ]; then
        echo "Error: docker-compose.yml not found!"
        exit 1
    fi

    echo "Stopping existing containers..."
    docker compose down --timeout 120 || true

    if [ "$(docker ps -q -f name=stocxify-frontend)" ]; then
        echo "Container still running, forcing removal..."
        docker stop stocxify-frontend || true
        docker rm -f stocxify-frontend || true
    fi

    echo "Logging into registry..."
    echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY_URL" -u "$REGISTRY_USERNAME" --password-stdin

    echo "Pulling images..."
    docker compose pull

    echo "Starting containers..."
    docker compose up -d

    # Disk cleanup
    if [ -n "${DISK_THRESHOLD:-}" ]; then
        CURRENT_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
        echo "Current disk usage: ${CURRENT_USAGE}% (Threshold: ${DISK_THRESHOLD}%)"
        if [ "$CURRENT_USAGE" -ge "$DISK_THRESHOLD" ]; then
            echo "Disk usage above threshold. Cleaning up old images..."
            docker image prune -f
            IMAGE_NAME="stocxify/frontend-stocxify"
            docker images "${REGISTRY_URL}/${IMAGE_NAME}" --format "{{.ID}} {{.Tag}}" | \
                grep -v "$TAG" | \
                tail -n +6 | \
                awk '{print $1}' | \
                xargs -r docker rmi || true
        else
            echo "Disk usage acceptable."
        fi
    fi
}

if [ "$DEPLOY_MODE" == "raw" ]; then
    install_node
    execute_raw
elif [ "$DEPLOY_MODE" == "docker" ]; then
    mkdir -p "$APP_NAME"
    [ -f docker-compose.deploy.yml ] && mv docker-compose.deploy.yml "$APP_NAME/docker-compose.yml"
    [ -f docker-compose.yml ] && mv docker-compose.yml "$APP_NAME/"
    [ -f .env ] && mv .env "$APP_NAME/"
    cd "$APP_NAME"
    install_docker
    execute_docker
else
    echo "ERROR: Unknown deploy mode: $DEPLOY_MODE. Expected 'raw' or 'docker'"
    exit 1
fi
