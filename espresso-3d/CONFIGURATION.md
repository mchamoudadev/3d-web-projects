# 9 Bar configuration

Requires Node.js 22.13+, npm and a browser with WebGL. No API key, database, hosted model, downloaded HDR or environment file is required. Fonts install through npm; visual geometry is procedural.

```sh
npm ci
npm run dev
# Open http://localhost:49173
```

```sh
npm run build
npm start
npm run lint
npm run typecheck
```

Stop the development server before starting production on the same port. There is no automated test script in this Phase 1 project; see notes/verification.md for earlier checks.

For a later finished product, supply detailed GLB models if desired, final visual acceptance, a real price and a checkout/CTA destination. No credentials should be embedded in browser code.
