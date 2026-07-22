---
name: deploy-frontend-to-cloudflare
description: Deploys static frontend (React, Vue, Vite, Next.js) to Cloudflare Workers. Use when deploying frontend or static sites.
---

# Deploy Frontend to Cloudflare Workers

## Two Critical Steps (Must Read!)

### 1. Create `wrangler.toml`
You MUST create a `wrangler.toml` file in the build output directory before deploying!

### 2. Call `nxcode deploy`
After creating wrangler.toml, you MUST call `nxcode deploy`! This is the actual deployment step!

```bash
# Complete workflow (all 3 steps required)
npm run build                                    # Step 1: Build
# Create wrangler.toml in dist/ (see template)  # Step 2: Configure
nxcode deploy --type static --dir frontend/dist  # Step 3: Deploy (required!)

# Common mistake: forgetting nxcode deploy
npm run build
# Created wrangler.toml
# Then stopped... No nxcode deploy = No actual deployment!
```

## Deployment Flow

1. Run build command (`npm run build`)
2. Create `wrangler.toml` in build output directory (e.g., `dist/`)
3. Call `nxcode deploy --type static --dir <path-to-dist>`

## Deploy Command

```bash
nxcode deploy --type static --dir <build-dir>
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--type` | Framework type (`static`, `nextjs`, `nuxt`, `astro`, `sveltekit`) | (required) |
| `--dir` | Build output directory (relative to `/workspace`) | (required) |
| `--platform` | Deployment platform | `cloudflare` |

## The `--dir` Path (Important!)

`--dir` must be a path **relative to `/workspace`**, not the current directory.

| Project Structure | Build Output | Correct `--dir` |
|-------------------|--------------|-----------------|
| `/workspace/dist/` | `dist/` | `dist` |
| `/workspace/frontend/dist/` | `frontend/dist/` | `frontend/dist` |
| `/workspace/my-app/build/` | `my-app/build/` | `my-app/build` |

```bash
# Wrong: using just dist after cd
cd my-app && npm run build
nxcode deploy --type static --dir dist  # Looks for /workspace/dist - doesn't exist!

# Correct: use full relative path
cd my-app && npm run build
nxcode deploy --type static --dir my-app/dist
```

## Why Workers Instead of Pages?

We use **Workers deployment only, not Pages**, because:
1. Pages requires pre-existing project, otherwise "Project not found" error
2. Workers is more flexible, supports D1/KV/R2 bindings
3. Workers' `[assets]` config can perfectly host static sites

**So: Even for pure static sites (React/Vue/Vite), create `wrangler.toml` and use Workers deployment.**

## wrangler.toml Location

wrangler.toml must be in the `--dir` directory, same level as `index.html`:

```
# If --dir is frontend/dist, structure must be:
/workspace/frontend/dist/
  ├── index.html
  ├── assets/
  └── wrangler.toml   <-- Must be here!

# Wrong: wrangler.toml in parent directory
/workspace/frontend/
  ├── wrangler.toml   <-- Wrong location!
  └── dist/
        └── index.html
```

## wrangler.toml Template

Create in `dist/` directory after build:

```toml
name = "my-app"
compatibility_date = "2024-12-01"

[assets]
directory = "."
not_found_handling = "single-page-application"
```

**Note:** The `name` field will be automatically prefixed with thread ID by the backend (e.g., `thr-abc123-my-app`).

## Worker Naming

| You write | Backend converts to | Final URL |
|-----------|---------------------|-----------|
| `name = "my-app"` | `name = "thr-abc123-my-app"` | `https://thr-abc123-my-app.nxcode-io.workers.dev` |

## Next.js Static Export

For Next.js with static export:

```bash
# next.config.js must have: output: 'export'
npm run build
# Creates 'out/' directory
nxcode deploy --type static --dir my-app/out
```

## SPA Routing

The `not_found_handling = "single-page-application"` setting ensures client-side routing works correctly - all routes will serve `index.html`.

## Next.js SSR (with OpenNext)

For Next.js with SSR (not static export), use OpenNext:

```bash
# Install dependencies
npm install @opennextjs/cloudflare@latest wrangler@latest -D
```

Create `open-next.config.ts`:
```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
export default defineCloudflareConfig();
```

Build and deploy:
```bash
npx opennextjs-cloudflare build
# This generates .open-next/ with wrangler.toml included
nxcode deploy --type nextjs --dir .open-next
```

After deploying, the deployed URL must load its browser assets. Do not treat HTML 200 as enough. Verify at least one page and every referenced `/_next/static/...` JS/CSS file:

```bash
curl -sS https://thr-xxx-my-next-app.workers.dev/ | grep -o '/_next/static/[^"]*' | head
curl -I https://thr-xxx-my-next-app.workers.dev/_next/static/chunks/main-app.js
```

If generated HTML references relative `/_next/static/...` but those URLs return 404, the OpenNext assets are not being served by the frontend worker. Deploy `.open-next/assets` as a static assets worker and rebuild/redeploy the frontend with `NEXT_PUBLIC_ASSET_PREFIX` pointing to that assets worker URL:

```bash
# Build with the assets worker URL baked into client HTML/JS
NEXT_PUBLIC_ASSET_PREFIX="https://thr-xxx-my-next-app-assets.nxcode-io.workers.dev" npx opennextjs-cloudflare build
nxcode deploy --type static --dir my-app/.open-next/assets
nxcode deploy --type nextjs --dir my-app/.open-next
```

When frontend and backend are deployed separately, also build with `NEXT_PUBLIC_API_URL` set to the deployed backend URL unless the deployed frontend worker rewrite for `/api/*` has been verified.

## Nuxt 3

Add Cloudflare preset to `nuxt.config.ts`:
```typescript
export default defineNuxtConfig({
  nitro: {
    preset: "cloudflare_module"
  }
})
```

Build and deploy:
```bash
npm run build
# This generates .output/ with wrangler config
nxcode deploy --type nuxt --dir .output
```

## Astro SSR

Install Cloudflare adapter:
```bash
npx astro add cloudflare
```

This updates `astro.config.mjs` automatically.

Build and deploy:
```bash
npm run build
nxcode deploy --type astro --dir dist
```

## SvelteKit

Install Cloudflare adapter:
```bash
npm install @sveltejs/adapter-cloudflare -D
```

Update `svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-cloudflare';
export default {
  kit: {
    adapter: adapter()
  }
};
```

Build and deploy:
```bash
npm run build
nxcode deploy --type sveltekit --dir .svelte-kit/cloudflare
```

## Quick Reference

| Framework | Build Command | Build Dir | wrangler.toml |
|-----------|--------------|-----------|---------------|
| Vite (React/Vue) | `npm run build` | `dist` | Create in dist/ |
| Next.js (static) | `npm run build` | `out` | Create in out/ |
| Next.js (SSR) | `npx opennextjs-cloudflare build` | `.open-next` | Auto-generated |
| Nuxt 3 | `npm run build` | `.output` | Auto-generated |
| Astro | `npm run build` | `dist` | Auto-generated |
| SvelteKit | `npm run build` | `.svelte-kit/cloudflare` | Auto-generated |

## Troubleshooting

If deployment fails, check:
1. wrangler.toml exists in the correct directory
2. `--dir` path is relative to `/workspace`
3. Build completed successfully before deploying

For latest Cloudflare docs:
```bash
curl -s "https://developers.cloudflare.com/workers/framework-guides/"
```
