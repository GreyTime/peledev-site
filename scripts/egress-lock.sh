#!/usr/bin/env bash
# Egress-Lock für peledev-site: blockt ausgehende NEUE Verbindungen des Containers.
# Inbound (published port 127.0.0.1:3016) bleibt unberührt, weil die Regel auf
# die Quell-IP des Containers matcht.
#
# Idempotent: Regel wird vorher entfernt und neu eingefügt.
set -euo pipefail

IP="${1:-10.99.250.2}"
CHAIN="DOCKER-USER"

iptables -n -L "$CHAIN" >/dev/null 2>&1 || { echo "chain $CHAIN fehlt (docker nicht gestartet?)"; exit 0; }

while iptables -C "$CHAIN" -s "$IP" -m conntrack --ctstate NEW -j DROP 2>/dev/null; do
    iptables -D "$CHAIN" -s "$IP" -m conntrack --ctstate NEW -j DROP
done
iptables -I "$CHAIN" 1 -s "$IP" -m conntrack --ctstate NEW -j DROP

iptables -S "$CHAIN" | grep -F -- "$IP" || true
