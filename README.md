# peledev-site

Statische Portfolio-Seite für **peledev.de**. nginx (unprivileged) im Container, gebunden an `127.0.0.1:3016`. Öffentlich erreichbar ausschließlich über Cloudflare Tunnel → `http://localhost:3016` (kein offener Port, keine Tailnet-Ausnahme).

**Status: live** (2026-10-21). `https://peledev.de` und `https://www.peledev.de` → 200, Cert `CN=peledev.de` bis 2027-01-19.

## Struktur
- `site/` — HTML/CSS/Fonts (read-only gemountet)
- `nginx.conf` — Security-Header, CSP, Caching (`read_only` Rootfs)
- `scripts/egress-lock.sh` — iptables-DROP aller neuen Egress-Verbindungen des Containers
- `BRIEF.md` — Design-/Content-Spec (Quelle der Wahrheit für Änderungen)
- `docker-compose.yml` — Container `peledev-site` (eigenes Bridge-Netz `isolated`, feste IP `10.99.250.2`)

## Betrieb
```
cd ~/docker/peledev-site
docker compose up -d              # startet
docker compose restart            # nach nginx.conf-Änderung
sudo ./scripts/egress-lock.sh     # Egress-Lock neu setzen (nach Docker-Restart)
curl -sI http://127.0.0.1:3016/ | head
```
Content-Änderung: Datei in `site/` editieren, kein Restart nötig (Mount, Cache 5 min).

Egress-Lock ist als `peledev-egress-lock.service` (systemd oneshot, enabled) beim Boot verdrahtet.

## Offene Platzhalter
- `site/impressum.html`: `[Name]`, `[Straße, Nr.]`, `[PLZ Ort]` füllen (Pflicht in DE).
- Mailadresse `hello@peledev.de` muss als Postfach/Alias existieren.

## Cloudflare
- Zone `peledev.de`, account `ACCOUNT-ID-ENTFERNT`, status `active`
- NS bei Netcup: `owen.ns.cloudflare.com`, `wally.ns.cloudflare.com` (Glue-Felder leer)
- Tunnel `peledev` (`TUNNEL-ID-ENTFERNT`): `peledev.de` + `www.peledev.de` → `http://localhost:3016`, Catch-all `http_status:404`
- DNS: proxied CNAMEs auf `<tunnel>.cfargotunnel.com`
- Container `cloudflared-tunnel` in `~/docker/cloudflare-tunnel/` (Token in `tunnel.env`, `network_mode: host`)

**Noch offen (Token ohne `Zone Settings: Edit` → 403):** SSL/TLS Full (strict), Always Use HTTPS, HSTS, Min TLS 1.2, WAF Managed Rules. Im Dashboard setzen oder Token erweitern.

## Sicherheit
- Kein offener Port: cloudflared verbindet ausgehend (QUIC/443), Ingress nur 2 Hostnames
- CSP `default-src 'none'`, kein JS, keine externen Requests
- `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`
- Container: `read_only`, `cap_drop: ALL`, `no-new-privileges`, `pids_limit: 64`, non-root
- Egress-Lock: Container erreicht kein LAN und kein Internet (`EXT-BLOCKED`, `LAN-BLOCKED` verifiziert)
- Hinweis: `mem_limit` greift auf diesem Kernel nicht (kein Memory-Cgroup-Controller aktiv).

## Bekannte Stolperfalle
Der Pi selbst löst `peledev.de` über Tailscale-MagicDNS → FritzBox auf und hält die alte netcup-Park-IP bis TTL-Ende (24 h). LAN-Clients und `dig @127.0.0.1` (AdGuard) sind korrekt. Prüfen mit `curl --resolve peledev.de:443:<cf-ip>`.
