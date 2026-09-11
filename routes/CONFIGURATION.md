# Muqdisho configuration

Requires Node.js 22.13+, npm, Docker Desktop, Python 3, osmium-tool, and roughly 3 GB disk space. Docker downloads Planetiler and OSRM containers. No hosted map key is needed.

## Shell settings

Set these in every shell that starts the app, runs data scripts, or starts Compose. Get PGPASSWORD from your secret manager or enter it privately; no password is shipped.

| Variable | Value / purpose |
| --- | --- |
| PGHOST | 127.0.0.1 |
| PGPORT | 5432 |
| PGUSER | muqdisho |
| PGDATABASE | muqdisho |
| PGPASSWORD | Your chosen local database password; required by Compose |
| DATABASE_URL | Optional alternative to PG*; supply your own connection URL |
| OSRM_PORT | 5001 is useful when macOS AirPlay occupies 5000; default 5000 |
| OPENROUTER_API_KEY | Your server-only key for free-text intent |
| OPENROUTER_MODEL | Optional model ID; code defaults to openai/gpt-4.1-mini |
| OSRM_URL | Optional traffic-generation URL override |
| DOWNLOAD_CONNECTIONS | Optional bounded downloader parallelism |

```sh
export PGHOST=127.0.0.1 PGPORT=5432 PGUSER=muqdisho PGDATABASE=muqdisho
export OSRM_PORT=5001
# Supply PGPASSWORD privately before continuing.
npm ci
npm run data:download
npm run data:clip
npm run data:tiles
npm run data:osrm
npm run data:places
docker compose up -d
npm run data:seed
npm run data:verify
npm run data:traffic
npm run data:audit
npm run dev
```

Open http://localhost:4319. A tiles archive is included for convenience; data:tiles refreshes it. Routing still requires the generated OSRM graph. npm ci runs postinstall to recreate local browser workers. Postgres and OSRM bind only to loopback. When reusing an existing Postgres volume, PGPASSWORD must match that volume's configured password; setting it in Compose does not reset an existing database.

No .env files or templates are included. Shell variables keep the app, Compose and data scripts consistent. scripts/test-nlu.ts performs live billable requests; it is not a routine offline test.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Use this guide over original laptop-specific environment-file instructions in README.md. The original source hardcoded a development database password; this collection uses PG* variables or your supplied DATABASE_URL instead.
