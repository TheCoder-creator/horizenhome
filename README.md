# HorizenHome

HorizenHome is the server-side identity and connected-system service for Horizen apps.

## First integration

- App: HorizenAI
- App origin: https://ai.horizensearch.com
- Home origin: https://home.horizensearch.com
- Identity provider: existing HorizenMessages OAuth
- Database: the HorizenSearch Supabase project (project ref xlisbmtenekjmundxbcn)

The browser SDK only reports the small event types explicitly allowed by the Worker. It does not read or upload the app's localStorage, chat text, prompts, images, passwords, or other browser data.

## 1. Set up the database

Open the SQL Editor for the **HorizenSearch Supabase project**, not the HorizenMessages project, and run the contents of schema.sql.

The tables are private to the Worker. RLS is enabled and browser roles receive no table permissions.

## 2. Configure Worker secrets

In Cloudflare, open the HorizenHome Worker > Settings > Variables and Secrets. Add these as **Secrets**:

- SUPABASE_URL = https://xlisbmtenekjmundxbcn.supabase.co
- SUPABASE_SERVICE_ROLE_KEY = the legacy service_role key from the HorizenSearch Supabase project's API settings
- HOME_SIGNING_SECRET = a new random secret with at least 32 characters

Never put the service-role key or signing secret in this repository, wrangler.jsonc, or browser code.

## 3. Register the Messages OAuth redirect

In the HorizenMessages OAuth client configuration, allow this exact redirect URI:

https://home.horizensearch.com/oauth/callback

The Worker uses the existing Messages OAuth client ID and PKCE. It does not store the Messages access or refresh token.

## 4. Attach the custom domain

Deploy this Worker and attach home.horizensearch.com as its custom domain.

## 5. HorizenAI integration

HorizenAI loads https://home.horizensearch.com/sdk.js.

The SDK adds the Home connection button and stores only a short-lived, revocable Home session token in that app's localStorage. The token is valid for seven days. After it expires, the user signs in again with Messages.

## API

- GET /health - health check
- GET /sdk.js - browser integration SDK
- GET /connect?system=HorizenAI&return=... - starts Messages OAuth
- GET /oauth/callback - validates the OAuth response and issues a Home session
- GET /api/me - validates the current app session
- POST /api/events - records allowlisted, metadata-only events
- POST /api/logout - revokes the current app session

The Worker only accepts the registered HorizenAI origin. Add another system to the SYSTEMS map and its origin checks only when that app is ready to integrate.

## Important

This initial version connects identity and records a small amount of explicit app activity. It is not remote desktop software and cannot inspect a computer's full storage or control the operating system. A web page cannot directly read another origin's localStorage.

## Dashboard

The root URL serves the HorizenHome dashboard. Users sign in with the existing HorizenMessages OAuth client. The dashboard can list the signed-in user's systems, recent metadata events, and app/browser sessions, and can disable a system or revoke a session.

Dashboard API routes:
- GET /api/dashboard
- POST /api/sessions/revoke
- POST /api/systems/toggle

The computer section represents registered browser/app sessions only. It does not scan devices, inspect files, or collect passwords. The optional HorizenFamily panel is informational until its separate integration and permissions are implemented.
