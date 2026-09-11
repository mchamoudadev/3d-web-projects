# 3D web projects

Four independent projects built with Codex, collected for private review. Each folder retains its own package.json, npm lockfile, source, brief/notes, and assets. This is a collection, not a shared workspace package: install and run inside the folder you want.

| Project | Experience | Implementation status | Local port |
| --- | --- | --- | --- |
| [Slice / water](water/PROJECT.md) | Six-scene watermelon-to-juice scroll story | Completed media and static site; see documented composition and browser-QA limits | 58349 (explicit override) |
| [Muqdisho 3D / routes](routes/PROJECT.md) | Somali/English destination search, real road routes, 3D city flight and exploration | Implemented local experience; needs routing graph, database and optional intent API | 4319 |
| [9 Bar / with-person](with-person/PROJECT.md) | Barista prepares and serves coffee; customer drinks it | Revised procedural people sequence; original interior-machine brief remains incomplete | 52743 |
| [9 Bar / espresso-3d](espresso-3d/PROJECT.md) | Scroll-controlled espresso machine and camera study | Phase 1 only; later story scenes remain planned | 49173 |

Start with each project's PROJECT.md for how it was made, CONFIGURATION.md for prerequisites/settings, and RESOURCES.md for included and regenerable assets. Original README files and briefs provide deeper implementation context; historical acceptance claims are not new validation of this collection.

## Requirements

Node.js 22.13+ and npm for all four projects. Use the committed lockfiles with `npm ci`. A current browser with WebGL is needed for the 3D projects. Muqdisho additionally requires Docker Desktop, Python 3, osmium-tool and around 3 GB free disk space. Slice media regeneration needs FFmpeg, cwebp and optional paid OpenRouter access; viewing the shipped site needs no key.

Ports are distinct defaults, not permanently reserved on your machine. Check availability before starting, or provide a different port.

## Credentials and review

No `.env` files, `.env.local`, `.env.example`, other `.env*` variants, private keys, original Git histories, provider job records, dependency trees or build caches are included. The root and project .gitignore files exclude environment files. Supply credentials through your shell or a secret manager; configuration documents list names without real values. The copied Muqdisho project no longer contains the original hardcoded development database password.

The repository is private. Making it public requires the owner's separate approval after reviewing all four folders. No new blanket open-source license has been assigned. Existing dependency and media licenses remain applicable; OpenStreetMap-derived data is ODbL, and landmark photo attribution is retained.

See [PACKAGING.json](PACKAGING.json), [RESOURCE-INVENTORY.json](RESOURCE-INVENTORY.json) and [VALIDATION.md](VALIDATION.md) for the export contents and checks.
