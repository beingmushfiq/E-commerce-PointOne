#!/usr/bin/env bash
# ==============================================================================
# CENTERPOINT — Quick Terminal One-Click Deploy Wrapper
# ==============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${SCRIPT_DIR}/bin/cpanel-deploy.sh" "$@"
