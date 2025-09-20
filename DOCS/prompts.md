# Goal
Fix a production runtime crash on Vercel (“Application error… Digest: 2316150757”) for a Next.js 15.5.3 app using Supabase SSR. The app builds and works locally but crashes in production. Make minimal diffs and explain what changed.

---

# Likely Root Causes
- Server-only Supabase code executing on the Edge runtime.
- Missing or misconfigured environment variables on Vercel.
- Unhandled exceptions during Supabase client initialization or first queries.
- Client hooks used on special routes (e.g., 404) without a Suspense boundary.
- Casting Supabase relation results without normalizing arrays/nullable shapes.
- Zod validation errors referenced with the wrong property name.

---

# Actions to Take (Minimal Diffs)
1. **Force Node.js runtime**  
   Set Node.js runtime for every page or API route that uses the server Supabase client or Next cookies/headers. Mark routes as dynamic if they fetch per request.

2. **Verify Vercel environment variables (Prod & Preview)**  
   Ensure public Supabase URL and anon key are set. If a service role key is used, confirm it’s server-only and never imported in client code. Match local values.

3. **Harden the Supabase server client**  
   Validate presence of required env vars at init; integrate with Next cookies/headers appropriately; fail fast with a clear error if envs are missing.

4. **Defensive error handling on server entry points**  
   Add try/catch around the first Supabase usage (init and initial queries) in server pages/routes and log errors so Vercel Functions logs show the real stack trace.

5. **Fix 404 / not-found route usage of client hooks**  
   If using client hooks like reading URL search params, make the component client and wrap hook usage inside a Suspense boundary to avoid CSR bailout.

6. **Normalize Supabase nested relation selects**  
   Treat relation fields as possibly arrays, single objects, or null; normalize to a single predictable shape before mapping to strict types. Avoid narrow casts on raw rows.

7. **Standardize Zod error handling**  
   Use the correct Zod property for validation errors (use the property your Zod version exposes, e.g., `issues`) throughout the project.

8. **Unify dynamic route param typing**  
   Keep dynamic route page prop types consistent with the Vercel build’s expectations. If `params` is delivered as a promise in your setup, await it; standardize across pages.

9. **Add a simple health-check endpoint (for verification only)**  
   Return booleans indicating presence of each required environment variable and the current deployment environment. Use it to confirm prod env configuration.

---

# Files/Areas to Review
- Server pages that read Supabase or use Next cookies/headers (e.g., dynamic player pages).
- API routes under `app/api` related to leaderboard, profile, and slander actions.
- Supabase server client helper in your `lib` folder.
- 404 / not-found route files.

---

# Acceptance Criteria
- Production URL renders without the generic “Application error” page.
- Vercel Functions logs show no unhandled exceptions; any failures are caught and logged clearly.
- All server/Supabase pages and routes run on the Node.js runtime (not Edge).
- Environment variables are present in production and validated by the health-check route.
- No Suspense warnings on 404/not-found.
- Type checks and build succeed.

---

# Verification Steps
- Open the health-check route in production and confirm env presence and deployment environment.
- Load the home page, a player page with real data, and each API endpoint; watch Vercel Functions logs for errors.
- Visit a non-existent path to test the not-found page behavior.
- Confirm voting/data flows and Supabase queries work end-to-end in production.
