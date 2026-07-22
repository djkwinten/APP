---
name: deploy-frontend-backend-order
description: Guides correct deployment order for full-stack apps (backend first, then frontend). Use when deploying frontend and backend separately.
---

# Frontend + Backend Deployment Order

When frontend and backend are deployed separately, they need to know each other's URLs.

## The Problem

- Frontend needs backend API URL to make requests
- Backend URL is only known **after deployment**
- Solution: **Deploy backend first**

## Deployment Order

```
1. Deploy Backend → Get URL
2. Configure Frontend with backend URL
3. Deploy Frontend
```

## Step 1: Deploy Backend

Backend must enable CORS to allow cross-origin requests:

```python
# Python (FastAPI/Starlette)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

```typescript
// JavaScript (Hono)
import { cors } from 'hono/cors'
app.use('*', cors())
```

Deploy and save the URL:

```bash
nxcode deploy --type fastapi --dir backend
# Returns: https://thr-xxx-my-api.workers.dev  ← Save this!
```

## Step 2: Configure Frontend

Frontend should use an environment variable for the deployed API URL. Keep local preview relative/proxied, but compile external builds with the real backend URL.

```javascript
// src/config.js or src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL || ''

// Usage
fetch(`${API_URL}/api/users`)
```

For Vite and Next client bundles, `VITE_API_URL` / `NEXT_PUBLIC_API_URL` must be present during the build. A Cloudflare `[vars]` entry alone does not rewrite already-built browser JavaScript.

Build with the deployed backend URL:

```bash
VITE_API_URL="https://thr-xxx-my-api.workers.dev" npm run build
# or for Next.js:
NEXT_PUBLIC_API_URL="https://thr-xxx-my-api.workers.dev" npm run build
```

Use relative `/api` in production only when the deployed frontend worker actually proxies or rewrites `/api/*` to the backend and you have verified it from the deployed URL.

```bash
curl -i https://thr-xxx-my-frontend.workers.dev/api/health
```

## Step 3: Deploy Frontend

```bash
cd frontend && npm run build
nxcode deploy --type static --dir dist
```

## Summary

| Order | Action | Note |
|-------|--------|------|
| 1st | Deploy backend | Enable CORS `["*"]`, get URL |
| 2nd | Update frontend build config | Set `VITE_API_URL` / `NEXT_PUBLIC_API_URL` to backend URL before build |
| 3rd | Deploy frontend | Build first, then deploy |

## Common Mistakes

- Deploying frontend first (won't know backend URL)
- Forgetting CORS on backend (browser blocks requests)
- Hardcoding `localhost` in frontend code
- Switching external production API calls to relative `/api` without verifying the deployed frontend rewrite
