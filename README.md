# peledev-site

Statische Portfolio-Seite für **peledev.de**. nginx (unprivileged) im Container, gebunden an `127.0.0.1:3016`. Öffentlich erreichbar ausschließlich über Cloudflare Tunnel → `http://localhost:3016` (kein offener Port, keine Tailnet-Ausnahme).

**Status: live** (2026-10-21). `https://peledev.de` und `https://www.peledev.de` → 200, Cert `CN=peledev.de` bis 2027-01-19.

## Struktur
- `site/` — HTML/CSS/Fonts (read-only gemountet)
- `nginx.conf` — Security-Header, CSP, Caching (`read_only` Rootfs)
- `scripts/egress-lock.sh` — iptables-DROP aller neuen Egress-Verbindungen des Containers
- `docker-compose.yml` — Container `peledev-site` (eigenes Bridge-Netz `isolated`, feste Container-IP im eigenen Subnetz)

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

## Inhalt
Eine Seite: `Fachinformatiker Anwendungsentwicklung` als H1, Wortmarke `Pele`, GitHub-Link, darunter ein Block `Ausbildung · dmTECH · Intralogistik / Abschluss 2027` mit Logo, Footer `peledev.de` + `Datenschutz`. Kein Impressum (rein private Seite), keine Mailadresse, keine Projektliste — bewusst so.

Farbschema: Systemeinstellung als Default, manueller Umschalter (`site/theme.js`, Wahl in `localStorage`). Keine externen Requests, keine Analytics.

## Offen
- `site/datenschutz.html`: Verantwortlicher ist mit Vornamen `Pele` + GitHub-Kontakt angegeben. Bei beruflicher Nutzung: vollständiger Name + Impressum nachrüsten.

## Cloudflare
- Zone `peledev.de` in Cloudflare, Status `active` (Account- und Tunnel-IDs sind bewusst nicht im Repo)
- NS bei Netcup: `owen.ns.cloudflare.com`, `wally.ns.cloudflare.com` (Glue-Felder leer)
- Tunnel `peledev`: `peledev.de` + `www.peledev.de` → `http://localhost:3016`, Catch-all `http_status:404`
- DNS: proxied CNAMEs auf `<tunnel>.cfargotunnel.com`
- Container `cloudflared-tunnel` in `~/docker/cloudflare-tunnel/` (Token in `tunnel.env`, `network_mode: host`)

Gesetzt (im Dashboard, weil der DNS-Token `Zone Settings: Edit` nicht hatte): SSL/TLS Full (strict), Always Use HTTPS, HSTS, Min TLS 1.2, Managed Ruleset. Verifiziert: HTTP → 301, HSTS-Header, TLS 1.1 abgelehnt.

## Sicherheit
- Kein offener Port: cloudflared verbindet ausgehend (QUIC/443), Ingress nur 2 Hostnames
- CSP `default-src 'none'` + `script-src 'self'` (nur eigenes `theme.js`), keine externen Requests
- `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`
- Container: `read_only`, `cap_drop: ALL`, `no-new-privileges`, `pids_limit: 64`, non-root
- Egress-Lock: Container erreicht kein LAN und kein Internet (`EXT-BLOCKED`, `LAN-BLOCKED` verifiziert)
- Origin-Bremse in nginx: `limit_req` 20 r/s (burst 40) und `limit_conn` 20 pro echter Client-IP, Status 429; echte IP kommt aus `CF-Connecting-IP` (nur von 127.0.0.1 vertraut). Test: 60 schnelle Requests → 11x 429.
- Hinweis: `mem_limit` greift auf diesem Kernel nicht (kein Memory-Cgroup-Controller aktiv).

## Bekannte Stolperfalle
Der Pi selbst löst `peledev.de` über Tailscale-MagicDNS → FritzBox auf und hält die alte netcup-Park-IP bis TTL-Ende (24 h). LAN-Clients und `dig @127.0.0.1` (AdGuard) sind korrekt. Prüfen mit `curl --resolve peledev.de:443:<cf-ip>`.

## Polish (v5)
- `og.png` (1200x630, lokal gerendert) + `og:image`/`twitter:card` → saubere Link-Previews
- `favicon.svg` = „P" aus Newsreader als Pfad, Ink-Quadrat; `og-icon.png` 180x180 als Apple-Touch-Icon
- Hover: Akzentlinie 56 → 96 px, Headline schiebt 2 px (`transition`), `prefers-reduced-motion` aus
- Mobil <620 px: Headline skaliert, „Anwendungsentwicklung" bleibt in einer Zeile (kein Trennstrich)
- echte `404.html` (`error_page 404 /404.html`), im gleichen Raster

## Öffentliches Repo
Das Repo `GreyTime/peledev-site` ist **public**, die Seite ist es auch. Regel: nichts hinein, was nicht auf eine öffentliche Visitenkarte gehört.

- Nicht ins Repo: `.env`, Tokens, Cloudflare-Account-/Zone-/Tunnel-IDs, interne Notizen (liegen lokal in `_notes/`, per `.gitignore` ausgeschlossen), Backup-Repos, Host-Pfade mit Zugangsdaten.
- `scripts/check-public.sh` prüft Dateiliste, Inhalte und **Historie** auf Secrets und IDs.
- `scripts/hooks/pre-push` ruft das automatisch auf (`git config core.hooksPath scripts/hooks`); bei einem Fund bricht der Push ab.
- Beispiel: `./scripts/check-public.sh` → `check-public: sauber`.
