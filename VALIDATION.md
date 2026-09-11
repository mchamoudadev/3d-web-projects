# Collection validation

Validation was run against the exported projects on 11 September 2026. Dependencies were reused from the existing installations for Slice, Muqdisho and espresso-3d; with-person used a fresh npm ci from its committed lockfile. No dependency upgrades were requested.

| Project | TypeScript | Lint | Tests | Production build |
| --- | --- | --- | --- | --- |
| water | Passed | Authored-code lint passed | 8 passed | Passed |
| routes | Passed | Passed | 16 offline tests passed; database-backed place tests require a configured/seeded Postgres | Passed |
| with-person | Passed | Passed | 4 passed | Passed with fresh locked install |
| espresso-3d | Passed | Passed | No test script supplied | Passed |

The initial with-person build refused a temporary dependency symlink; installing its locked dependencies locally resolved it without application changes. The full routes test invocation was attempted without database credentials; its integration tests did not pass. No claim is made that database setup, live NLU, Docker routing, browser behavior or device performance was validated for this export. No paid generation or live NLU test was invoked.

## Export hygiene

Six .env* files (including examples and an RTF variant) were removed from the four original project folders. All environment variants are excluded from this collection and ignored in the original project folders as well. Original Git history was not copied. Known source environment-key values were checked against the export without printing them; none were found in copied files. Token/private-key patterns and signed credential URL patterns were also inspected. These checks reduce exposure risk but are not a guarantee against every possible secret format.

The three copied Muqdisho database consumers now use DATABASE_URL or standard PG* shell variables, and Compose requires PGPASSWORD. Original source applications were otherwise preserved; generated output, caches, provider job records, original deployment archives and raw/routing intermediates were excluded. Selected Slice clips/stills, its browser frames, map tiles and licensed photos are included with SHA-256 inventory entries.

Run `python3 scripts/verify-repository.py` after staging to check tracked filenames, known credential patterns, asset hashes and the Git blob size cap. Re-run project commands from each project folder after future changes. Private GitHub visibility must remain unchanged until the owner separately approves publication.
