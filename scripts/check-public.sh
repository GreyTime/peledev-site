#!/usr/bin/env bash
# Prüft das Repo auf Dinge, die in einem öffentlichen Repo nichts zu suchen haben.
# Aufruf: scripts/check-public.sh   (Exit 1 = Fund)
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
fail=0

suspect_files=$(git ls-files | grep -Ei '(^|/)(\.env|_notes/|BRIEF|.*\.bak-|.*\.pem|.*\.key)$' || true)
if [ -n "$suspect_files" ]; then
  echo "FEHLER: Dateien, die nicht ins öffentliche Repo gehören:"
  echo "$suspect_files"
  fail=1
fi

# Inhalte im Working Tree (nur getrackte Dateien, ohne Fonts/Bilder)
hits=$(git ls-files -z \
  | xargs -0 grep -InE 'ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|CLOUDFLARE_API_TOKEN|TUNNEL_TOKEN|BEGIN [A-Z ]*PRIVATE KEY|[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' 2>/dev/null \
  | grep -v 'ACCOUNT-ID-ENTFERNT\|ZONE-ID-ENTFERNT\|TUNNEL-ID-ENTFERNT' || true)
if [ -n "$hits" ]; then
  echo "FEHLER: mögliche Secrets oder IDs im Inhalt:"
  echo "$hits" | sed 's/\(TOKEN=\).*/\1***/'
  fail=1
fi

# Historie: IDs und Secret-Muster
hist=$(git log -p --all 2>/dev/null | grep -cE 'ghp_[A-Za-z0-9]{20,}|CLOUDFLARE_API_TOKEN=[^ ]|TUNNEL_TOKEN=[^ ]|cf652ab60efaeecdf61e6f85bfbb5435|837b2a32-86ab-4b26-bac9-852ae9e57f94' || true)
if [ "${hist:-0}" != "0" ]; then
  echo "FEHLER: Historie enthält $hist Treffer (Secrets/IDs)."
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "check-public: sauber"
fi
exit "$fail"
