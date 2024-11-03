#!/bin/bash
# test-workflow.sh
source .env

# Default event file, can be overridden with a command-line argument
EVENT_FILE=${1:-tests/bot-response-event.json}

gh act -W .github/workflows/bot-response.yml -v --action-offline-mode \
    -s token="${GITHUB_TOKEN}" \
    -s GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -s GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -s GIT_USER_NAME="${GIT_USER_NAME}" \
    -j respond_to_bot \
    -e "$EVENT_FILE" \
    "${@:2}"