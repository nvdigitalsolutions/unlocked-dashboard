# Upgrade Guide: Secure Authentication & Craft.js Editing for *Unlocked Dashboard*

## 1  Overview

This guide explains **how to upgrade the `nvdigitalsolutions/unlocked-dashboard` project** so that:

* Login via the `/login` page reliably authenticates against Strapi
* The JWT issued by Strapi is used **securely** (HttpOnly) *and* recognised by the frontend
* Craft.js loads on `/dashboard`, `/` and `[slug]` pages only for authenticated users
* Editors can **save** inline page changes back to Strapi

It assumes:

* **Frontend:** Next.js 13+ (Pages Router)
* **Backend:** Strapi v5.x running at `BACKEND_URL`
* **Node ≥ 20** and **Yarn ≥ 3**

---

## 2  Goals

|  #  |  Objective                                                         | Success Metric                                            |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------- |
|  1  | Authenticated users see Craft.js editor on `/dashboard` within 3 s | ✔ Editor renders; `Save` button visible                   |
|  2  | Non‑authenticated visitors never see editing tools                 | ✔ `useCraftDisabled` returns `true`                       |
|  3  | Inline edits on any page persist to Strapi                         | ✔ `PUT /api/pages/:id` returns 200 & page content updates |
|  4  | Login session lasts ≥ 7 days via JWT cookie                        | ✔ Cookie `jwt` TTL ≥ 604 800 s                            |

---

## 3  High‑Level Change List

1. **New API route `/api/check-auth`** – server‑side validation of the JWT cookie.
2. **Proxy Strapi data fetch** via `/api/pages` to automatically attach `Authorization: Bearer …`.
3. **Rewrite `useCraftDisabled`** to call `check-auth` instead of reading the HttpOnly cookie.
4. **Move page content fetch to SSR** in `/dashboard` to eliminate client‑only loading.
5. **Add `SaveButton` & `handleSave`** to `/pages/[slug].js` & `index.js`.
6. **Add CORS & cookie settings** in Strapi for `credentials: "include"`.
7. **Optional UX**: non‑HttpOnly cookie `loggedIn=true` for quick client hints.

---

## 4  Detailed Implementation Steps

### 4.1  Backend (Strapi)

1. **Enable CORS** for the frontend origin and allow credentials:

   ```js
   // ./config/middlewares.js
   module.exports = [
     'strapi::security',
     {
       name: 'strapi::cors',
       config: {
         origin: [process.env.FRONTEND_URL],
         credentials: true,
       },
     },
     // …
   ];
   ```
2. **Check Permissions** for collection type *Pages*:
   \* `find` and `findOne` – authenticated role only (leave public off if pages are private)
   \* `update` – authenticated role only
3. *(Optional)* Create a dedicated **Editor role** in Strapi & assign permissions above.

### 4.2  Frontend

#### 4.2.1  `/api/check-auth.ts`

```ts
// Next.js API – validates JWT in HttpOnly cookie
import { serialize } from 'cookie';
export default async function handler(req, res) {
  const jwt = req.cookies.jwt;
  if (!jwt) return res.status(401).end();

  try {
    const strapiRes = await fetch(`${process.env.BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!strapiRes.ok) throw new Error('Invalid');
    const user = await strapiRes.json();

    // OPTIONAL: also set a non‑HttpOnly cookie for client hints
    res.setHeader(
      'Set-Cookie',
      serialize('loggedIn', 'true', {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    );

    res.status(200).json({ user });
  } catch {
    res.status(401).end();
  }
}
```

#### 4.2.2  Update `useCraftDisabled.ts`

```ts
import { useEffect, useState } from 'react';
export const useCraftDisabled = () => {
  const [disabled, setDisabled] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/check-auth');
        setDisabled(!res.ok);
      } catch {
        setDisabled(true);
      }
    })();
  }, []);
  return disabled;
};
```

#### 4.2.3  Proxy Strapi Pages Fetch – `/api/pages.ts`

```ts
// Accepts ?slug=… or ?id=… and proxies to Strapi with JWT
export default async function handler(req, res) {
  const { slug, id } = req.query;
  const jwt = req.cookies.jwt;
  if (!jwt) return res.status(401).end();
  const qs = slug
    ? `filters[slug][$eq]=${slug}`
    : `filters[id][$eq]=${id}`;
  const strapiRes = await fetch(`${process.env.BACKEND_URL}/api/pages?${qs}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const data = await strapiRes.json();
  res.status(strapiRes.status).json(data);
}
```

#### 4.2.4  Dashboard – server‑side fetch

```ts
export const getServerSideProps = withAuth(async ({ req }) => {
  const jwt = req.cookies.jwt;
  const resp = await fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/pages?slug=home`, {
    headers: { Cookie: req.headers.cookie },
  });
  const { data } = await resp.json();
  return { props: { pageEntry: data?.[0] ?? null } };
});
```

*(Wrap withAuth around the existing auth logic.)*

Then in the component:

```tsx
function Dashboard({ pageEntry }) {
  const [content, setContent] = useState(pageEntry?.attributes.content);
  // remove old useEffect load()
}
```

#### 4.2.5  Saving Inline Edits on Pages

Add to `/pages/[slug].js` & `index.js`:

```tsx
const handleSave = async (nodes) => {
  if (!pageEntry) return;
  const res = await fetch(`/api/pages?id=${pageEntry.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: nodes }),
  });
  if (!res.ok) alert('Save failed');
};
...
<SaveButton onSave={handleSave} />
```

#### 4.2.6  Dynamic Imports & Suspense

Wrap dynamic components:

```tsx
<Suspense fallback={null}>
  <SaveButton ... />
</Suspense>
```

### 4.3  Environment Variables

| Variable                       | Example                  | Purpose             |
| ------------------------------ | ------------------------ | ------------------- |
|  `BACKEND_URL`                 |  `http://localhost:1337` | Base URL to Strapi  |
|  `FRONTEND_URL`                |  `http://localhost:3000` | Used in CORS config |
|  `NEXT_PUBLIC_BACKEND_URL`     | Same as `BACKEND_URL`    | Client fetch/proxy  |
|  `NEXT_PUBLIC_DISABLE_CRAFTJS` | `false`                  | Global kill‑switch  |

---

## 5  Upgrade Sequence

1. **Pull latest `main`** branch locally.
2. **Create feature branch** `upgrade-secure-auth`.
3. **Apply backend CORS change** and restart Strapi.
4. **Add new API routes & hook updates** in frontend.
5. **Move dashboard page fetch to SSR**.
6. **Implement save buttons** on index & slug pages.
7. **Commit & push** feature branch; open PR.
8. **Run unit & integration tests** (see §6).
9. **Deploy to staging**; verify editor flows.
10. **Merge PR & deploy to production**.

---

## 6  Testing Checklist

|  Test             | Steps                    | Expected                          |
| ----------------- | ------------------------ | --------------------------------- |
| Login Success     | Submit valid creds       | Redirect to `/dashboard`          |
| JWT Cookie        | Inspect cookies          | `jwt` exists, HttpOnly, 7‑day TTL |
| Auth Check        | `GET /api/check-auth`    |  200 & user JSON                  |
| Dashboard Content | Load `/dashboard`        | Editor appears within 3 s         |
| Save Edit         | Drag Text → Save         | 200 PUT; refresh shows change     |
| Public View       | Incognito → `/dashboard` | Redirects to `/login`             |
| Craft Disabled    | Remove JWT → Home        | No editor visible                 |

---

## 7  Rollback Plan

* **Git**: revert merge commit via `git revert`.
* **Frontend**: redeploy previous build.
* **Backend**: restore old `middlewares.js` or revert env changes.
* **Cookies**: invalidate by setting `jwt` expiry to past date.

---

## 8  Reference Code Snippets

See `/examples` directory in repo after upgrade for:

* `useCraftDisabled.ts`
* `check-auth.ts` API route
* `pages/api/pages.ts` proxy
* Updated dashboard component

---

## 9  Glossary

| Term         | Meaning                                      |
| ------------ | -------------------------------------------- |
| **JWT**      | JSON Web Token issued by Strapi on login     |
| **HttpOnly** | Cookie flag preventing client‑side JS access |
| **SSR**      | Server Side Rendering in Next.js             |


DO NOT DO NOW: Deployment on DigitalOcean

1. Edit `.do/app.yaml` so each service exposes the correct environment variables and routes. The example file already shows the structure.
2. Create a DigitalOcean App via the dashboard or `doctl` and supply the secrets referenced in the spec.
3. Optionally enable the provided GitHub Actions workflow which runs `doctl apps update` whenever you push to `main`.

This guide does not cover every detail of the final application but provides a high‑level checklist to help you iterate from the starter code. Consult the README and official docs for Next.js, Strapi and DigitalOcean as you expand the project.
