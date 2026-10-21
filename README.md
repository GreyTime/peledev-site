# peledev-site

Statische Portfolio-Seite für **peledev.de**. nginx (unprivileged) im Container, gebunden an `127.0.0.1:3016`. Öffentlich erreichbar ausschließlich über Cloudflare Tunnel → `http://localhost:3016` (kein offener Port, keine Tailnet-Ausnahme).

## Struktur
- `site/` — HTML/CSS/Fonts (read-only gemountet)
- `nginx.conf` — Security-Header, CSP, Caching (`read_only` Rootfs)
- `BRIEF.md` — Design-/Content-Spec (Quelle der Wahrheit für Änderungen)
- `docker-compose.yml` — Container `peledev-site`

## Betrieb
```
cd ~/docker/peledev-site
docker compose up -d          # startet
docker compose restart        # nach nginx.conf-Änderung
curl -sI http://127.0.0.1:3016/ | head
```
Content-Änderung: Datei in `site/` editieren, kein Restart nötig (Mount, Cache 5 min).

## Offene Platzhalter
- `site/impressum.html`: `[Name]`, `[Straße, Nr.]`, `[PLZ Ort]` füllen (Pflicht in DE).
- `site/index.html`: GitHub-Link zeigt noch auf `#projekte`.
- Mailadresse `hello@peledev.de` muss als Postfach/Alias existieren.

## Cloudflare
- Zone `peledev.de` (NS bei Netcup → Cloudflare umgestellt)
- Tunnel `peledev`: `peledev.de` + `www.peledev.de` → `http://localhost:3016`
- Proxy an (orange), TLS Full (strict), Always Use HTTPS, HSTS
- Container `cloudflared-tunnel` in `~/docker/cloudflare-tunnel/` (Token in `tunnel.env`, `network_mode: host`)

## Sicherheit
- CSP `default-src 'none'`, kein JS, keine externen Requests
- `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`
- Container: `read_only`, `cap_drop: ALL`, `no-new-privileges`, `pids_limit: 64`
- Hinweis: `mem_limit` greift auf diesem Kernel nicht (kein Memory-Cgroup-Controller aktiv).
