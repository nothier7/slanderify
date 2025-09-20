# Fix: “Attempted to call `buttonVariants()` from the server”

Your production 500s are caused by a **server component** (e.g., `app/page.tsx`) **calling a function from a client module** (shadcn `@/components/ui/button`). Server components can render client components, but they **cannot invoke client-only functions**.

---

## What’s Happening
- `buttonVariants` is defined in a **client module**.
- A **server component** imports and calls `buttonVariants(...)`.
- This violates React Server Component boundaries and crashes in production.

---

## Fix Options (choose one and apply consistently)

### A) Don’t call client helpers inside server components
- In server components, **render** the client `<Button>` and let it compute styles internally.
- Do **not** import or call `buttonVariants` directly from server components.

### B) Split variant logic into a server-safe module
- Move CVA/classname logic to a **separate file without** `"use client"`.
- Server components import that server-safe module to compute classes.
- The client `<Button>` also imports the same logic for consistency.

### C) Make the page a client component (last resort)
- Convert the page to a client component only if you must call `buttonVariants` there.
- You will lose some RSC benefits; prefer A or B when possible.

---

## Where to Look First
- `app/page.tsx` (home route) — logs point here as the crash site.
- Any server component that imports `@/components/ui/button` and **calls** `buttonVariants(...)` to build `className`.

---

## Project-Wide Audit
- Search for usages of `*Variants(` (e.g., `buttonVariants`, `badgeVariants`, `inputVariants`).
- Ensure **no server component** calls these helpers if they come from client modules.

---

## Sanity Checks
- If `@/components/ui/button` has **no hooks or browser APIs**, consider removing `"use client"` so its helpers are server-safe.
- If it must remain a client file, **don’t export helpers** intended for server use; keep style computation **inside** the client component.

---

## After the Change
- Redeploy and hit `/` again.
- Check Vercel **Functions** logs; the 500 should be gone.
- If another 500 appears, capture the new stack (route + error message) and repeat the audit for other client-only helpers.
