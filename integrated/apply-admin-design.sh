#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
    printf '%s\n' 'Usage: sh apply-admin-design.sh /path/to/current-alzamiliah-checkout' >&2
    exit 1
fi

source_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
target_dir=$(CDPATH='' cd -- "$1" && pwd)
source_admin="$source_dir/src/app/[locale]/admin"
target_admin="$target_dir/src/app/[locale]/admin"

for page in layout.tsx projects/new/page.tsx qrcode-leads/page.tsx; do
    if [ ! -f "$target_admin/$page" ]; then
        printf 'Current Alzamiliah source required. Missing: %s\n' "$page" >&2
        exit 1
    fi
done

if ! grep -q '/api/auth/me' "$target_admin/layout.tsx" ||
   ! grep -q '/api/auth/logout' "$target_admin/layout.tsx"; then
    printf '%s\n' 'The current layout uses a different authentication flow. Integrate the design manually to preserve it.' >&2
    exit 1
fi

mkdir -p "$target_dir/public/admin-brand"
cp "$source_dir"/public/admin-brand/* "$target_dir/public/admin-brand/"
cp "$source_admin/workspace.css" "$target_admin/workspace.css"
printf '%s\n' 'Theme assets copied. Integrate the sidebar layout with the existing authentication guard before building.'
