# Bolt.new Clone - AI App Builder PRD

## Architecture
- **Frontend**: React 19, Tailwind CSS, React Router, Monaco Editor
- **Backend**: FastAPI, Motor (MongoDB), JWT auth, SSE
- **AI**: OpenAI SDK → Emergent proxy → GPT-4o-mini (direct, no litellm)

## Latest Fix: Multi-Page Generation + Fast LLM (Apr 22, 2026)
- **Replaced litellm with OpenAI SDK**: Direct `openai.OpenAI(base_url=emergent_proxy)` with `max_retries=1, timeout=120`. Eliminated infinite retry loops. Generation now completes in ~12-60 seconds.
- **True multi-page architecture**: System prompt now specifies EXACT content for each of 9 pages. Each page is a full, substantial route component.
- **Pages**: HomePage (hero+features+testimonials+CTA), About (mission+team+stats), Features (6 cards grid), Pricing (3 tiers with Most Popular badge), Contact (working form), Login, Signup, Dashboard (CRUD), Settings
- **Premium design**: Dark theme, gradient text, glassmorphism navbar, pill buttons, trust bar, entrance animations

## Test Credentials
- **Demo**: demo@boltai.com / demo1234 (1000 credits, Pro)
- **Test**: test@example.com / password123 (1000 credits, Pro)

## Feature: Google Sign-In (Feb 2026)
- **Integration**: Own Google Cloud OAuth 2.0 Client (user-owned consent screen).
- **Flow**: `@react-oauth/google` popup → Google returns ID token to browser → frontend posts it to `POST /api/auth/google` → backend verifies token signature/audience with `google-auth` library → upserts user in Mongo → returns app JWT (same shape as email/password login) → stored in `localStorage['token']` → redirect to `/dashboard`.
- **Env vars**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in `backend/.env`; `REACT_APP_GOOGLE_CLIENT_ID` in `frontend/.env`.
- **Client ID**: `829340661587-hgtrdb9vd3jbu3e3l7lklimmilbqfb9p.apps.googleusercontent.com`
- **⚠️ IMPORTANT — before production**: After buying the custom domain and deploying, add the domain to Google Cloud Console → OAuth client → Authorized JavaScript origins AND Authorized redirect URIs (`https://<domain>` and `https://<domain>/auth/google`). Otherwise Google login will fail on the live site.
- **Files**: `backend/routes/auth_routes.py` (`POST /auth/google`), `backend/models/user.py` (added `auth_provider`, `picture`, optional `password_hash`), `frontend/src/App.js` (`<GoogleOAuthProvider>`), `frontend/src/context/AuthContext.jsx` (`loginWithGoogle(credential)`), Login.jsx + Signup.jsx (real `<GoogleLogin>` component).
- **Backend smoke tests**: 400 on missing credential, 401 on invalid/bogus ID token, existing email/password login still works.

## Feature: Pricing Page + Razorpay Checkout (Feb 2026)
- **Route**: `/pricing` (public) — 4 tiers in INR: Starter ₹0 · Pro ₹500/mo (Most Popular, 1,500 credits) · Business ₹1,000/mo (4,000 credits) · Agency ₹2,000/mo (10,000 credits).
- **Razorpay integration (test mode)**:
  - Backend routes in `backend/routes/payments_routes.py`:
    - `GET /api/payments/config` — public, returns key_id + plan catalog.
    - `POST /api/payments/create-order` — auth required, creates Razorpay order, persists in `payment_orders` collection.
    - `POST /api/payments/verify` — auth required, verifies HMAC signature via `razorpay.utility.verify_payment_signature`, upgrades user plan + adds credits.
  - Frontend: `Pricing.jsx` dynamically loads `https://checkout.razorpay.com/v1/checkout.js` on CTA click, opens Razorpay checkout with order_id from backend, handler posts signature to `/verify`, shows toast with new credit balance on success.
  - Env: `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in `backend/.env` (test keys).
- **Mongo**: `payment_orders` collection tracks `{order_id, user_id, plan_id, amount, status, payment_id, created_at, paid_at}`.
- **Backend smoke tests**: config returns enabled=true, unauthenticated order creation → 401, authenticated creates real Razorpay order, verify with bad signature → 400.

## Feature: Credit System (Feb 2026)
- **Credit costs** (in `backend/services/credit_service.py`): generate = 10, chat = 2, analyze = 5.
- **New users** (email/password + Google): 100 free credits on signup.
- **Enforcement**: Atomic conditional Mongo `$inc` inside `require_and_deduct_credits()` — prevents race conditions when user hits "generate" twice fast. Returns 403 with structured `detail: {code: "insufficient_credits", required, available}` when balance is insufficient.
- **Note on 402**: Emergent preview ingress strips the JSON body for HTTP 402 (non-standard code). Switched to 403 which passes through.
- **SSE caveat**: Even 403 can have body stripped on SSE endpoints, so the IDE does a pre-flight check (`user.credits >= 10`) and fires the modal immediately — avoids the streaming body-read issue entirely.
- **Frontend**:
  - `LowCreditsModal.jsx` — global modal, listens for `low-credits` custom window event. Shows "Recharge and continue" (→ `/pricing`) and "Maybe later".
  - Axios interceptors + fetch handler in `services/api.js` dispatch the event on 403 responses with `insufficient_credits` code.
  - IDE `TopBar`: credit balance pill (amber when < 20) + "Buy Credits" button — both navigate to `/pricing`.
  - AuthContext now exposes `refreshUser` + `setUser` so IDE updates credits in real time after generation completes (backend returns `credits_remaining` in `/generate/stream` done event).

## Fixes: IDE TopBar + Pricing scroll (Feb 2026)
- **Pricing page scrolling**: Root cause — `.App { height:100vh; overflow:hidden }` in `App.css` was clipping all pages globally. Changed to `min-height: 100vh` (kept IDE layout intact since it uses its own flex/fixed heights).
- **Export/Download button**: Wired through `chatAPI.downloadProject` with proper error handling, reads `Content-Disposition` header to set the real filename (e.g., `build-a-todo-app.zip`). Shows success/error toasts. Disabled while downloading.
- **Share button**: Uses `navigator.share()` on supported devices, falls back to clipboard copy + toast "Link copied!". Shares `/ide?project={id}` URL.
- **Settings button**: Opens a premium modal showing user profile (avatar/name/email), plan, credits, plus quick-actions: "Buy more credits" → `/pricing`, "Dashboard", "Sign out".

## Feature: Low-credits nudge in IDE (Feb 2026)
- Shows an amber banner inside the IDE chat panel (above messages) when `credits > 0 && credits < 15`: *"⚡ X credits left — top up anytime · Buy credits →"*.
- Dismissible (X) for the current session. CTA navigates to `/pricing`.
- Rendered in `components/ide/ChatPanel.jsx` using `useAuth().user.credits`. Tested end-to-end at 12 credits — banner visible, click navigates to pricing, dismissal works.

## Known issue: Google Sign-In inside iframe preview
- `IframeAuthWarning` component shown on Login/Signup when `window.self !== window.top` — tells user to open in new tab. Root cause: Google blocks OAuth in embedded iframes (`ERR_BLOCKED_BY_RESPONSE` / `invalid_client`). Email/password auth still works inside iframe.
