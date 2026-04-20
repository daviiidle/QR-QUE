#!/bin/bash
# Status line command that mimics the shell PS1 prompt
input=$(cat)
user=$(echo "$input" | jq -r '.workspace.current_dir // empty' | sed 's|'"$HOME"'|~|g')
host=$(hostname -s 2>/dev/null || hostname)
whoami_val=$(whoami 2>/dev/null || echo "user")
printf "%s@%s:%s$ " "$whoami_val" "$host" "$user"