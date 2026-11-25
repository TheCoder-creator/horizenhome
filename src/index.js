const MESSAGES_URL = "https://wzfdomantqeaedfexpgq.supabase.co";
const MESSAGES_KEY = "sb_publishable_vrz02Sm0olhxPqgc1MihJg_mrEMh7MG";
const OAUTH_CLIENT_ID = "1c07850f-28fa-4d37-9dec-1b0ecb186baf";
const OAUTH_REDIRECT = "https://home.horizensearch.com/oauth/callback";
const SYSTEMS = Object.freeze({ HorizenAI: "https://ai.horizensearch.com" });
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const COOKIE_NAME = "hz_home_oauth";
const encoder = new TextEncoder();
const sdk = "(function () {\n  \"use strict\";\n  const HOME = \"https://home.horizensearch.com\";\n  const STORAGE_KEY = \"hz_home_session_v1\";\n  let token = \"\";\n  let connected = false;\n  function button() { return document.getElementById(\"homeAccountBtn\"); }\n  function setButton(text, title) {\n    const el = button();\n    if (el) {\n      el.innerHTML = '<i class=\"fas fa-house\"></i> ' + text;\n      el.title = title || text;\n      el.classList.toggle(\"active\", connected);\n    }\n  }\n  async function request(path, options) {\n    return fetch(HOME + path, {\n      ...options,\n      headers: { ...(options && options.headers || {}), \"Authorization\": \"Bearer \" + token }\n    });\n  }\n  function connect() {\n    const back = location.origin + location.pathname + location.search;\n    location.assign(HOME + \"/connect?system=HorizenAI&return=\" + encodeURIComponent(back));\n  }\n  async function me() {\n    if (!token) return null;\n    const response = await request(\"/api/me\", { method: \"GET\" });\n    if (!response.ok) {\n      token = \"\";\n      connected = false;\n      localStorage.removeItem(STORAGE_KEY);\n      setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n      return null;\n    }\n    connected = true;\n    const data = await response.json();\n    setButton(\"Home ✓\", \"Connected to HorizenHome. Click to disconnect.\");\n    return data;\n  }\n  async function track(type, data) {\n    if (!token || !connected) return;\n    try {\n      await request(\"/api/events\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ type, data: data || {} })\n      });\n    } catch (_) {}\n  }\n  async function logout() {\n    if (token) {\n      try { await request(\"/api/logout\", { method: \"POST\" }); } catch (_) {}\n    }\n    localStorage.removeItem(STORAGE_KEY);\n    token = \"\";\n    connected = false;\n    setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n  }\n  async function init() {\n    const hash = new URLSearchParams(location.hash.replace(/^#/, \"\"));\n    const incoming = hash.get(\"hz_home_token\");\n    if (incoming) {\n      token = incoming;\n      localStorage.setItem(STORAGE_KEY, token);\n      history.replaceState(null, \"\", location.pathname + location.search);\n    } else {\n      token = localStorage.getItem(STORAGE_KEY) || \"\";\n    }\n    const el = button();\n    if (el) {\n      el.addEventListener(\"click\", async function () {\n        if (!connected) return connect();\n        if (confirm(\"Disconnect this browser from HorizenHome?\")) await logout();\n      });\n    }\n    if (token) {\n      const profile = await me();\n      if (profile) await track(\"app_opened\", { path: location.pathname });\n    } else {\n      setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n    }\n  }\n  window.HorizenHome = { init, connect, me, track, logout, isConnected: () => connected };\n  if (document.readyState === \"loading\") document.addEventListener(\"DOMContentLoaded\", init, { once: true });\n  else init();\n})();";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
  });
}
function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...headers }
  });
}
function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromB64url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
}
async function sha256(value) {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}
function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function signedCookie(payload, secret) {
  const encoded = b64url(encoder.encode(JSON.stringify(payload)));
  return encoded + "." + await sign(encoded, secret);
}
async function readSignedCookie(request, secret) {
  const raw = (request.headers.get("Cookie") || "").split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE_NAME + "="));
  if (!raw) return null;
  const value = raw.slice(COOKIE_NAME.length + 1);
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const encoded = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!same(signature, await sign(encoded, secret))) return null;
  try { return JSON.parse(new TextDecoder().decode(fromB64url(encoded))); }
  catch { return null; }
}
function cookieHeader(value, maxAge = 600) {
  return COOKIE_NAME + "=" + value + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + maxAge;
}
function clearCookie() {
  return COOKIE_NAME + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}
function allowedOrigin(origin) {
  return Object.values(SYSTEMS).includes(origin);
}
function corsHeaders(origin) {
  if (!allowedOrigin(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function appError(returnUrl, message) {
  const target = new URL(returnUrl);
  target.searchParams.set("home_error", message.slice(0, 120));
  return target.toString();
}
async function db(env, path, init = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !key) throw new Error("HorizenHome database secrets are not configured.");
  const headers = new Headers(init.headers || {});
  headers.set("apikey", key);
  headers.set("Authorization", "Bearer " + key);
  headers.set("Content-Type", "application/json");
  const response = await fetch(env.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/" + path, { ...init, headers });
  const raw = await response.text();
  if (!response.ok) {
    console.error("HorizenHome database error", response.status, raw.slice(0, 300));
    throw new Error("HorizenHome database request failed. Check that schema.sql has been run.");
  }
  return raw ? JSON.parse(raw) : null;
}
async function startLogin(request, env) {
  if (!env.HOME_SIGNING_SECRET || env.HOME_SIGNING_SECRET.length < 32) {
    return html("<h2>HorizenHome needs its signing secret configured.</h2>", 503);
  }
  const url = new URL(request.url);
  const system = url.searchParams.get("system") || "";
  const expectedOrigin = SYSTEMS[system];
  const returnUrlRaw = url.searchParams.get("return") || "";
  let returnUrl;
  try { returnUrl = new URL(returnUrlRaw); }
  catch { return html("<h2>Invalid return address.</h2>", 400); }
  if (!expectedOrigin || returnUrl.origin !== expectedOrigin || returnUrl.protocol !== "https:") {
    return html("<h2>This app is not registered with HorizenHome.</h2>", 403);
  }
  returnUrl.hash = "";
  const state = randomToken(24);
  const verifier = randomToken(32);
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
  const cookie = await signedCookie({ state, verifier, system, returnUrl: returnUrl.toString(), createdAt: Date.now() }, env.HOME_SIGNING_SECRET);
  const authorize = new URL(MESSAGES_URL + "/auth/v1/oauth/authorize");
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "openid email profile"
  }).toString();
  return new Response(null, {
    status: 302,
    headers: { "Location": authorize.toString(), "Set-Cookie": cookieHeader(cookie), "Cache-Control": "no-store" }
  });
}
async function finishLogin(request, env) {
  const url = new URL(request.url);
  const cookie = await readSignedCookie(request, env.HOME_SIGNING_SECRET || "");
  if (!cookie || Date.now() - cookie.createdAt > 10 * 60 * 1000) {
    return html("<h2>Login expired. Return to HorizenAI and try again.</h2>", 400, { "Set-Cookie": clearCookie() });
  }
  const returnUrl = new URL(cookie.returnUrl);
  if (returnUrl.origin !== SYSTEMS[cookie.system]) {
    return html("<h2>Invalid app return address.</h2>", 400, { "Set-Cookie": clearCookie() });
  }
  if (url.searchParams.get("state") !== cookie.state) {
    return html("<h2>Login state did not match. Please try again.</h2>", 400, { "Set-Cookie": clearCookie() });
  }
  if (url.searchParams.get("error")) {
    return new Response(null, {
      status: 302,
      headers: { "Location": appError(returnUrl.toString(), "Messages login was not completed."), "Set-Cookie": clearCookie(), "Cache-Control": "no-store" }
    });
  }
  const code = url.searchParams.get("code");
  if (!code) return html("<h2>Messages did not return a login code.</h2>", 400, { "Set-Cookie": clearCookie() });
  const tokenResponse = await fetch(MESSAGES_URL + "/auth/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "apikey": MESSAGES_KEY },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: OAUTH_REDIRECT,
      code_verifier: cookie.verifier
    })
  });
  if (!tokenResponse.ok) {
    console.error("Messages token exchange failed", tokenResponse.status);
    return html("<h2>Messages sign-in could not be completed. Please try again.</h2>", 502, { "Set-Cookie": clearCookie() });
  }
  const tokens = await tokenResponse.json();
  if (!tokens.access_token) return html("<h2>Messages did not provide an access token.</h2>", 502, { "Set-Cookie": clearCookie() });
  const userResponse = await fetch(MESSAGES_URL + "/auth/v1/oauth/userinfo", {
    headers: { "Authorization": "Bearer " + tokens.access_token, "apikey": MESSAGES_KEY }
  });
  if (!userResponse.ok) {
    console.error("Messages userinfo failed", userResponse.status);
    return html("<h2>Could not verify your Messages account.</h2>", 502, { "Set-Cookie": clearCookie() });
  }
  const user = await userResponse.json();
  const userId = user.sub || user.user_id || user.id;
  if (!userId || typeof userId !== "string") {
    return html("<h2>Messages returned an invalid account identity.</h2>", 502, { "Set-Cookie": clearCookie() });
  }
  const email = typeof user.email === "string" ? user.email.slice(0, 320) : null;
  const name = user.name || user.full_name;
  const displayName = typeof name === "string" ? name.slice(0, 120) : null;
  const systemOrigin = SYSTEMS[cookie.system];
  try {
    await db(env, "home_accounts?on_conflict=messages_user_id", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ messages_user_id: userId, email, display_name: displayName, updated_at: new Date().toISOString() })
    });
    const systems = await db(env, "home_systems?on_conflict=owner_messages_user_id%2Csystem_origin&select=id", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        owner_messages_user_id: userId,
        system_name: cookie.system,
        system_origin: systemOrigin,
        last_seen_at: new Date().toISOString()
      })
    });
    const systemId = systems && systems[0] && systems[0].id;
    if (!systemId) throw new Error("Could not register this app.");
    const sessionToken = randomToken(32);
    const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
    await db(env, "home_system_sessions", {
      method: "POST",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({
        system_id: systemId,
        messages_user_id: userId,
        token_hash: await sha256(sessionToken),
        expires_at: expiresAt
      })
    });
    return new Response(null, {
      status: 302,
      headers: {
        "Location": returnUrl.toString() + "#hz_home_token=" + encodeURIComponent(sessionToken),
        "Set-Cookie": clearCookie(),
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer"
      }
    });
  } catch (error) {
    console.error("HorizenHome session creation failed", error.message);
    return html("<h2>HorizenHome could not create your session. Check its database setup.</h2>", 500, { "Set-Cookie": clearCookie() });
  }
}
async function authenticate(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigin(origin)) return null;
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (token.length < 30 || token.length > 200) return null;
  const hash = await sha256(token);
  const rows = await db(env,
    "home_system_sessions?select=id,messages_user_id,expires_at,revoked_at,home_systems!home_session_system_owner_fk!inner(id,system_name,system_origin,enabled)&token_hash=eq." + encodeURIComponent(hash) + "&limit=1"
  );
  const session = rows && rows[0];
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const system = session.home_systems;
  if (!system || !system.enabled || system.system_origin !== origin) return null;
  return { session, system, userId: session.messages_user_id, origin };
}
async function api(request, env, url) {
  const origin = request.headers.get("Origin") || "";
  const cors = corsHeaders(origin);
  if (!allowedOrigin(origin)) return json({ error: "Origin not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const identity = await authenticate(request, env);
  if (!identity) return json({ error: "Session is missing, expired, or revoked. Sign in again." }, 401, cors);

  if (url.pathname === "/api/me" && request.method === "GET") {
    const accounts = await db(env, "home_accounts?select=email,display_name&messages_user_id=eq." + encodeURIComponent(identity.userId) + "&limit=1");
    await db(env, "home_systems?id=eq." + identity.system.id, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ last_seen_at: new Date().toISOString() })
    });
    return json({
      connected: true,
      system: identity.system.system_name,
      email: accounts && accounts[0] && accounts[0].email || null,
      displayName: accounts && accounts[0] && accounts[0].display_name || null,
      expiresAt: identity.session.expires_at
    }, 200, cors);
  }

  if (url.pathname === "/api/events" && request.method === "POST") {
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 4096) return json({ error: "Event too large." }, 413, cors);
    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid event." }, 400, cors); }
    const allowedTypes = new Set(["app_opened", "chat_created", "chat_sent", "chat_exported"]);
    if (!allowedTypes.has(body.type)) return json({ error: "Event type not allowed." }, 400, cors);
    const eventData = {};
    if (typeof body.data?.hasImages === "boolean") eventData.hasImages = body.data.hasImages;
    if (typeof body.data?.path === "string") eventData.path = body.data.path.slice(0, 180).replace(/[^a-zA-Z0-9/_-]/g, "");
    await db(env, "home_events", {
      method: "POST",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({
        system_id: identity.system.id,
        messages_user_id: identity.userId,
        event_type: body.type,
        event_data: eventData
      })
    });
    return json({ ok: true }, 200, cors);
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    await db(env, "home_system_sessions?id=eq." + identity.session.id, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ revoked_at: new Date().toISOString() })
    });
    return json({ ok: true }, 200, cors);
  }
  return json({ error: "Not found." }, 404, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/health") return json({ ok: true, service: "HorizenHome" });
      if (url.pathname === "/") {
        const page = "<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>HorizenHome</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#070a09;color:#e8f5ef;font:16px system-ui;display:grid;place-items:center;padding:24px}main{max-width:620px;width:100%;padding:34px;border:1px solid #1b3b30;border-radius:18px;background:#0e1512;box-shadow:0 20px 80px #0008}h1{color:#00eb84;margin:0 0 8px;font-size:38px}p{color:#a6b8af;line-height:1.7}code{color:#00eb84}</style></head><body><main><h1>HorizenHome</h1><p>Your connected-system service is online.</p><p>Connect supported Horizen apps with the <code>HorizenMessages</code> sign-in button inside each app.</p><p>First connected system: <strong>HorizenAI</strong>.</p></main></body></html>";
        return html(page);
      }
      if (url.pathname === "/sdk.js" && request.method === "GET") {
        return new Response(sdk, {
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "Access-Control-Allow-Origin": "*",
            "X-Content-Type-Options": "nosniff"
          }
        });
      }
      if (url.pathname === "/connect" && request.method === "GET") return await startLogin(request, env);
      if (url.pathname === "/oauth/callback" && request.method === "GET") return await finishLogin(request, env);
      if (url.pathname.startsWith("/api/")) return await api(request, env, url);
      return json({ error: "Not found." }, 404);
    } catch (error) {
      console.error("HorizenHome error", error.message);
      return json({ error: "HorizenHome could not complete that request." }, 500);
    }
  }
};