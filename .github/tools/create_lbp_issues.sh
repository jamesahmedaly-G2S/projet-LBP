#!/usr/bin/env bash
# Backlog LBP généré depuis le fichier fourni dans la conversation.
set -euo pipefail
REPO="${REPO:-jamesahmedaly-G2S/projet-LBP}"
declare -A ISSUE_URL
