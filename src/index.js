const MESSAGES_URL = "https://wzfdomantqeaedfexpgq.supabase.co";
const MESSAGES_KEY = "sb_publishable_vrz02Sm0olhxPqgc1MihJg_mrEMh7MG";
const OAUTH_CLIENT_ID = "302a7def-f3ac-493a-adf6-378256f36351";
const OAUTH_REDIRECT = "https://home.horizensearch.com/oauth/callback";
const SYSTEMS = Object.freeze({ HorizenHome: "https://home.horizensearch.com", HorizenAI: "https://ai.horizensearch.com" });
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const COOKIE_NAME = "hz_home_oauth";
const encoder = new TextEncoder();
const sdk = "(function () {\n  \"use strict\";\n  const HOME = \"https://home.horizensearch.com\";\n  const STORAGE_KEY = \"hz_home_session_v1\";\n  let token = \"\";\n  let connected = false;\n  function button() { return document.getElementById(\"homeAccountBtn\"); }\n  function setButton(text, title) {\n    const el = button();\n    if (el) {\n      el.innerHTML = '<i class=\"fas fa-house\"></i> ' + text;\n      el.title = title || text;\n      el.classList.toggle(\"active\", connected);\n    }\n  }\n  async function request(path, options) {\n    return fetch(HOME + path, {\n      ...options,\n      headers: { ...(options && options.headers || {}), \"Authorization\": \"Bearer \" + token }\n    });\n  }\n  function connect() {\n    const back = location.origin + location.pathname + location.search;\n    location.assign(HOME + \"/connect?system=HorizenAI&return=\" + encodeURIComponent(back));\n  }\n  async function me() {\n    if (!token) return null;\n    const response = await request(\"/api/me\", { method: \"GET\" });\n    if (response.status === 423) {\n      location.assign(\"https://secure.horizensearch.com/?system=\" + encodeURIComponent(location.origin) + "&return=" + encodeURIComponent(location.href));\n      return null;\n    }\n    if (!response.ok) {\n      token = \"\";\n      connected = false;\n      localStorage.removeItem(STORAGE_KEY);\n      setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n      return null;\n    }\n    connected = true;\n    const data = await response.json();\n    setButton(\"Home ✓\", \"Connected to HorizenHome. Click to disconnect.\");\n    return data;\n  }\n  async function track(type, data) {\n    if (!token || !connected) return;\n    try {\n      await request(\"/api/events\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ type, data: data || {} })\n      });\n    } catch (_) {}\n  }\n  async function pollLock() {\n    if (!token || !connected) return;\n    try {\n      const response = await request(\"/api/lock/poll\", { method: \"GET\" });\n      if (!response.ok) return;\n      const status = await response.json();\n      if (status.locked) location.assign(\"https://secure.horizensearch.com/?system=\" + encodeURIComponent(location.origin) + "&return=" + encodeURIComponent(location.href));\n    } catch (_) {}\n  }\n  async function logout() {\n    if (token) {\n      try { await request(\"/api/logout\", { method: \"POST\" }); } catch (_) {}\n    }\n    localStorage.removeItem(STORAGE_KEY);\n    token = \"\";\n    connected = false;\n    setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n  }\n  async function init() {\n    const hash = new URLSearchParams(location.hash.replace(/^#/, \"\"));\n    const incoming = hash.get(\"hz_home_token\");\n    if (incoming) {\n      token = incoming;\n      localStorage.setItem(STORAGE_KEY, token);\n      history.replaceState(null, \"\", location.pathname + location.search);\n    } else {\n      token = localStorage.getItem(STORAGE_KEY) || \"\";\n    }\n    const el = button();\n    if (el) {\n      el.addEventListener(\"click\", async function () {\n        if (!connected) return connect();\n        if (confirm(\"Disconnect this browser from HorizenHome?\")) await logout();\n      });\n    }\n    if (token) {\n      const profile = await me();\n      if (profile) {\n        await track(\"app_opened\", { path: location.pathname });\n        setInterval(pollLock, 8000);\n      }\n    } else {\n      setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n    }\n  }\n  window.HorizenHome = { init, connect, me, track, logout, isConnected: () => connected };\n  if (document.readyState === \"loading\") document.addEventListener(\"DOMContentLoaded\", init, { once: true });\n  else init();\n})();";

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
  try { const u = new URL(origin); return u.protocol === "https:" && u.origin === origin && !u.username && !u.password; }
  catch { return false; }
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
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("Origin") || (requestOrigin === "https://home.horizensearch.com" ? requestOrigin : "");
  if (!allowedOrigin(origin)) return null;
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (token.length < 30 || token.length > 200) return null;
  const hash = await sha256(token);
  const rows = await db(env,
    "home_system_sessions?select=id,messages_user_id,expires_at,revoked_at,home_systems!home_session_system_owner_fk!inner(id,system_name,system_origin,enabled,locked,detailed_logging,lock_password_hash)&token_hash=eq." + encodeURIComponent(hash) + "&limit=1"
  );
  const session = rows && rows[0];
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const system = session.home_systems;
  if (!system || !system.enabled || system.system_origin !== origin) return null;
  return { session, system, userId: session.messages_user_id, origin };
}
async function api(request, env, url) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("Origin") || (requestOrigin === "https://home.horizensearch.com" ? requestOrigin : "");
  const cors = corsHeaders(origin);
  if (!allowedOrigin(origin)) return json({ error: "Origin not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  if (url.pathname.startsWith("/api/lock/service/")) {
    const supplied = request.headers.get("X-Horizen-Lock-Service") || "";
    if (!env.LOCK_SERVICE_SECRET || !same(supplied, env.LOCK_SERVICE_SECRET)) return json({ error: "Unauthorized." }, 401);
    if (url.pathname === "/api/lock/service/inspect" && request.method === "GET") {
      const rawOrigin = url.searchParams.get("origin") || "";
      let targetOrigin;
      try { const parsed = new URL(rawOrigin); if (parsed.protocol !== "https:" || parsed.origin !== rawOrigin) throw new Error(); targetOrigin = parsed.origin; }
      catch { return json({ error: "Invalid system address." }, 400); }
      const rows = await db(env, "home_systems?select=id,system_name,system_origin,enabled,locked&system_origin=eq." + encodeURIComponent(targetOrigin) + "&limit=1");
      const target = rows && rows[0];
      if (!target || !target.enabled) return json({ found: false, locked: false }, 404);
      return json({ found: true, locked: !!target.locked, system: target.system_name, origin: target.system_origin });
    }
    if (url.pathname === "/api/lock/service/verify" && request.method === "POST") {
      let body; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
      if (typeof body.origin !== "string" || typeof body.password !== "string" || body.password.length > 128) return json({ error: "Invalid request." }, 400);
      let targetOrigin;
      try { const parsed = new URL(body.origin); if (parsed.protocol !== "https:" || parsed.origin !== body.origin) throw new Error(); targetOrigin = parsed.origin; }
      catch { return json({ error: "Invalid system address." }, 400); }
      const rows = await db(env, "home_systems?select=id,owner_messages_user_id,system_name,system_origin,enabled,locked,lock_password_salt,lock_password_hash&system_origin=eq." + encodeURIComponent(targetOrigin) + "&limit=1");
      const target = rows && rows[0];
      if (!target || !target.enabled) return json({ error: "System not found." }, 404);
      if (!target.locked) return json({ ok: true, locked: false, redirect: target.system_origin });
      if (!target.lock_password_hash || !target.lock_password_salt) return json({ error: "This system has no lock password configured." }, 409);
      const ip = String(body.clientIp || "unknown").slice(0, 128);
      const ipHash = await sha256(ip + ":" + env.LOCK_SERVICE_SECRET);
      const attempts = await db(env, "home_system_lock_attempts?select=id&system_id=eq." + encodeURIComponent(target.id) + "&ip_hash=eq." + encodeURIComponent(ipHash) + "&succeeded=eq.false&attempted_at=gte." + encodeURIComponent(new Date(Date.now() - 15 * 60 * 1000).toISOString()));
      if (attempts && attempts.length >= 8) return json({ error: "Too many attempts. Wait 15 minutes and try again." }, 429);
      const material = await crypto.subtle.importKey("raw", encoder.encode(body.password), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromB64url(target.lock_password_salt), iterations: 100000, hash: "SHA-256" }, material, 256);
      const valid = same(b64url(new Uint8Array(bits)), target.lock_password_hash);
      await db(env, "home_system_lock_attempts", { method: "POST", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ system_id: target.id, ip_hash: ipHash, succeeded: valid }) });
      if (!valid) return json({ error: "Incorrect password." }, 403);
      await db(env, "home_systems?id=eq." + encodeURIComponent(target.id) + "&locked=eq.true", { method: "PATCH", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ locked: false }) });
      await db(env, "home_system_lock_messages", { method: "POST", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ system_id: target.id, owner_messages_user_id: target.owner_messages_user_id, action: "unlock" }) });
      return json({ ok: true, locked: false, redirect: target.system_origin });
    }
    return json({ error: "Not found." }, 404);
  }

  const identity = await authenticate(request, env);
  if (!identity) return json({ error: "Session is missing, expired, or revoked. Sign in again." }, 401, cors);
  if (url.pathname === "/api/lock/poll" && request.method === "GET") {
    const messages = await db(env, "home_system_lock_messages?select=id,action,created_at&system_id=eq." + encodeURIComponent(identity.system.id) + "&order=created_at.desc&limit=1");
    return json({ locked: !!identity.system.locked, system: identity.system.system_name, origin: identity.system.system_origin, message: messages && messages[0] || null }, 200, cors);
  }
  if (identity.system.locked) return json({ error: "This system is locked.", locked: true, lockUrl: "https://secure.horizensearch.com/?system=" + encodeURIComponent(identity.system.system_origin) }, 423, cors);

  if (url.pathname === "/api/dashboard" && request.method === "GET") {
    const uid = encodeURIComponent(identity.userId);
    const [accounts, systems, sessions, events] = await Promise.all([
      db(env, "home_accounts?select=email,display_name&messages_user_id=eq." + uid + "&limit=1"),
      db(env, "home_systems?select=id,system_name,system_origin,enabled,locked,lock_password_hash,detailed_logging,created_at,last_seen_at&owner_messages_user_id=eq." + uid + "&order=created_at.asc"),
      db(env, "home_system_sessions?select=id,created_at,expires_at,revoked_at,home_systems!home_session_system_owner_fk!inner(system_name,system_origin)&messages_user_id=eq." + uid + "&order=created_at.desc&limit=40"),
      db(env, "home_events?select=id,event_type,event_data,created_at,home_systems!home_event_system_owner_fk!inner(system_name)&messages_user_id=eq." + uid + "&order=created_at.desc&limit=40")
    ]);
    return json({
      account: accounts && accounts[0] || { email: null, displayName: null },
      systems: (systems || []).map(({ lock_password_hash, ...system }) => ({ ...system, has_lock_password: !!lock_password_hash })),
      sessions: sessions || [],
      events: events || []
    }, 200, cors);
  }

  if (url.pathname === "/api/sessions/revoke" && request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400, cors); }
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) return json({ error: "Invalid session ID." }, 400, cors);
    await db(env, "home_system_sessions?id=eq." + encodeURIComponent(body.id) + "&messages_user_id=eq." + encodeURIComponent(identity.userId), {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ revoked_at: new Date().toISOString() })
    });
    return json({ ok: true }, 200, cors);
  }

  if (url.pathname === "/api/systems/toggle" && request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400, cors); }
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id) || typeof body.enabled !== "boolean") {
      return json({ error: "Invalid system update." }, 400, cors);
    }
    const uid = encodeURIComponent(identity.userId);
    const id = encodeURIComponent(body.id);
    const changed = await db(env, "home_systems?id=eq." + id + "&owner_messages_user_id=eq." + uid, {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ enabled: body.enabled })
    });
    if (!changed || !changed.length) return json({ error: "System not found." }, 404, cors);
    if (!body.enabled) {
      await db(env, "home_system_sessions?system_id=eq." + id + "&messages_user_id=eq." + uid + "&revoked_at=is.null", {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ revoked_at: new Date().toISOString() })
      });
    }
    return json({ ok: true }, 200, cors);
  }

  if (url.pathname === "/api/system/lock-password" && request.method === "POST") {
    let body; try { body = await request.json(); } catch { return json({error:"Invalid request."},400,cors); }
    if(typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id)||typeof body.password!=="string"||body.password.length<10||body.password.length>128)return json({error:"Use a password between 10 and 128 characters."},400,cors);
    const salt=randomToken(16),material=await crypto.subtle.importKey("raw",encoder.encode(body.password),"PBKDF2",false,["deriveBits"]);
    const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:fromB64url(salt),iterations:100000,hash:"SHA-256"},material,256),hash=b64url(new Uint8Array(bits));
    const changed=await db(env,"home_systems?id=eq."+encodeURIComponent(body.id)+"&owner_messages_user_id=eq."+encodeURIComponent(identity.userId)+"&system_name=neq.HorizenHome",{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({lock_password_salt:salt,lock_password_hash:hash})});
    if(!changed||!changed.length)return json({error:"System not found, or the Home control system cannot be locked."},404,cors);return json({ok:true},200,cors);
  }
  if (url.pathname === "/api/system/lock" && request.method === "POST") {
    let body;try{body=await request.json();}catch{return json({error:"Invalid request."},400,cors);}
    if(typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id))return json({error:"Invalid system."},400,cors);
    const uid=encodeURIComponent(identity.userId),id=encodeURIComponent(body.id);
    const changed=await db(env,"home_systems?id=eq."+id+"&owner_messages_user_id=eq."+uid+"&system_name=neq.HorizenHome+"&lock_password_hash=not.is.null",{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({locked:true})});
    if(!changed||!changed.length)return json({error:"Set a lock password first. HorizenHome itself cannot be locked."},400,cors);
    await db(env,"home_system_lock_messages",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({system_id:body.id,owner_messages_user_id:identity.userId,action:"lock"})});return json({ok:true},200,cors);
  }
  if (url.pathname === "/api/system/unlock" && request.method === "POST") {
    let body;try{body=await request.json();}catch{return json({error:"Invalid request."},400,cors);}
    if(typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id)||typeof body.password!=="string")return json({error:"Invalid request."},400,cors);
    const rows=await db(env,"home_systems?select=lock_password_salt,lock_password_hash&id=eq."+encodeURIComponent(body.id)+"&owner_messages_user_id=eq."+encodeURIComponent(identity.userId)+"&system_name=neq.HorizenHome&limit=1"),target=rows&&rows[0];
    if(!target||!target.lock_password_hash||!target.lock_password_salt)return json({error:"No lock password is configured."},400,cors);
    const material=await crypto.subtle.importKey("raw",encoder.encode(body.password),"PBKDF2",false,["deriveBits"]),bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:fromB64url(target.lock_password_salt),iterations:100000,hash:"SHA-256"},material,256);
    if(!same(b64url(new Uint8Array(bits)),target.lock_password_hash))return json({error:"Incorrect lock password."},403,cors);
    await db(env,"home_systems?id=eq."+encodeURIComponent(body.id)+"&owner_messages_user_id=eq."+encodeURIComponent(identity.userId),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({locked:false})});await db(env,"home_system_lock_messages",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({system_id:body.id,owner_messages_user_id:identity.userId,action:"unlock"})});return json({ok:true},200,cors);
  }
  if (url.pathname === "/api/systems/logging" && request.method === "POST") {
    let body;try{body=await request.json();}catch{return json({error:"Invalid request."},400,cors);}
    if(typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id)||typeof body.enabled!=="boolean")return json({error:"Invalid setting."},400,cors);
    await db(env,"home_systems?id=eq."+encodeURIComponent(body.id)+"&owner_messages_user_id=eq."+encodeURIComponent(identity.userId),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({detailed_logging:body.enabled})});return json({ok:true},200,cors);
  }
  if (url.pathname === "/api/me" && request.method === "GET") {
    const accounts = await db(env, "home_accounts?select=email,display_name&messages_user_id=eq." + encodeURIComponent(identity.userId) + "&limit=1");
    await db(env, "home_systems?id=eq." + identity.system.id, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ last_seen_at: new Date().toISOString() })
    });
    return json({
      connected: true,
      detailedLogging: identity.system.detailed_logging === true,
      system: identity.system.system_name,
      email: accounts && accounts[0] && accounts[0].email || null,
      displayName: accounts && accounts[0] && accounts[0].display_name || null,
      expiresAt: identity.session.expires_at
    }, 200, cors);
  }

  if (url.pathname === "/api/events" && request.method === "POST") {
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 12000) return json({ error: "Event too large." }, 413, cors);
    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid event." }, 400, cors); }
    const allowedTypes = new Set(["app_opened", "chat_created", "chat_sent", "chat_response", "chat_exported"]);
    if (!allowedTypes.has(body.type)) return json({ error: "Event type not allowed." }, 400, cors);
    const eventData = {};
    if (typeof body.data?.hasImages === "boolean") eventData.hasImages = body.data.hasImages;
    if (typeof body.data?.path === "string") eventData.path = body.data.path.slice(0, 180).replace(/[^a-zA-Z0-9/_-]/g, "");
    if (identity.system.detailed_logging === true && body.type === "chat_sent" && body.data?.hasImages !== true && typeof body.data?.query === "string") eventData.query = body.data.query.slice(0, 3000);
    if (identity.system.detailed_logging === true && body.type === "chat_response" && typeof body.data?.response === "string") eventData.response = body.data.response.slice(0, 5000);
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

function dashboardPage() {
  const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#070a09"><title>HorizenHome</title>
<style>
:root{color-scheme:dark;--bg:#070a09;--panel:#101713;--panel2:#141e18;--line:#24392e;--muted:#9aada2;--green:#00eb84;--red:#ff6577}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 15% 0%,#0d2419 0,transparent 42%),var(--bg);color:#eaf4ee;font:15px Inter,system-ui,sans-serif;min-height:100vh}
button{font:inherit;cursor:pointer}header{height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 max(22px,calc((100vw - 1180px)/2));background:#080d0aeF;position:sticky;top:0;z-index:3}
.brand{font-size:22px;font-weight:800;color:var(--green);letter-spacing:-.7px}.brand span{color:#eaf4ee}.head-actions{display:flex;gap:10px;align-items:center}
.btn{border:1px solid var(--line);background:#142019;color:#eaf4ee;border-radius:9px;padding:10px 14px;font-weight:650}.btn.primary{background:var(--green);color:#06130b;border-color:var(--green)}.btn.danger{color:#ff9eaa;border-color:#63313a;background:#251317}.btn:disabled{opacity:.5;cursor:not-allowed}
main{max-width:1180px;margin:0 auto;padding:34px 22px 70px}.welcome{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:26px}.eyebrow{color:var(--green);font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase}h1{font-size:clamp(28px,4vw,40px);letter-spacing:-1.4px;margin:8px 0 6px}.sub{color:var(--muted);line-height:1.6;margin:0}.status{font-size:12px;color:var(--green);border:1px solid #28553d;border-radius:99px;padding:8px 11px;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:15px}.card{background:linear-gradient(145deg,#111b15,#0d1410);border:1px solid var(--line);border-radius:15px;padding:19px;min-width:0}.span-8{grid-column:span 8}.span-4{grid-column:span 4}.span-12{grid-column:span 12}.card h2{font-size:16px;margin:0 0 5px}.hint{font-size:12px;color:var(--muted);line-height:1.55;margin:0 0 15px}.metric{font-size:32px;font-weight:800;color:var(--green);margin:10px 0 0}.item{padding:13px 0;border-top:1px solid #203127;display:flex;justify-content:space-between;gap:14px;align-items:center}.item:first-child{border-top:0}.item-title{font-weight:700}.item-meta{font-size:12px;color:var(--muted);margin-top:4px;overflow-wrap:anywhere}.pill{font-size:10px;border:1px solid #28553d;color:var(--green);padding:5px 8px;border-radius:99px;white-space:nowrap}.pill.off{color:#ffb4bd;border-color:#63313a}.empty{padding:16px;border:1px dashed #304638;border-radius:10px;color:var(--muted);font-size:13px;line-height:1.6}.event{display:grid;grid-template-columns:1fr auto;gap:10px;padding:11px 0;border-top:1px solid #203127}.event:first-child{border-top:0}.event strong{font-size:13px}.event small{display:block;color:var(--muted);margin-top:4px}.family{display:flex;justify-content:space-between;align-items:center;gap:16px}.notice{font-size:12px;color:#b5c5bb;background:#111e16;border:1px solid #294331;padding:12px;border-radius:10px;line-height:1.6}.login{max-width:480px;margin:12vh auto;padding:30px}.login h1{font-size:34px}.login p{color:var(--muted);line-height:1.7}.hidden{display:none!important}.error{color:#ff9eaa;font-size:13px;margin-top:12px;line-height:1.5}.foot{color:#6f8276;font-size:11px;margin-top:24px;line-height:1.6}
@media(max-width:760px){header{padding:0 16px}.welcome{align-items:flex-start;flex-direction:column}.span-8,.span-4{grid-column:span 12}.family{align-items:flex-start;flex-direction:column}}

body{background:radial-gradient(900px 500px at 5% -10%,rgba(0,235,132,.19),transparent 65%),radial-gradient(700px 460px at 100% 10%,rgba(50,110,255,.12),transparent 65%),#050807}header{backdrop-filter:blur(20px);background:rgba(5,10,7,.84);border-bottom-color:rgba(0,235,132,.2)}.brand{font-size:24px;text-shadow:0 0 24px rgba(0,235,132,.3)}.card{background:linear-gradient(145deg,rgba(19,31,24,.96),rgba(8,15,11,.96));border-color:rgba(119,190,145,.23);border-radius:19px;box-shadow:0 18px 55px rgba(0,0,0,.23);transition:border-color .2s,transform .2s}.card:hover{border-color:rgba(0,235,132,.45);transform:translateY(-1px)}.metric{font-size:38px;text-shadow:0 0 24px rgba(0,235,132,.2)}.welcome h1{font-size:clamp(34px,5vw,48px);background:linear-gradient(100deg,#f3fff8,#8dffc3 65%,#7ca9ff);-webkit-background-clip:text;background-clip:text;color:transparent}.event{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:13px;margin:8px 0;border:1px solid #203127;border-radius:12px;background:#0a100c}.event-detail{margin-top:6px;padding:10px;border:1px solid #203127;background:#060a08;border-radius:9px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto;font-size:12px;line-height:1.55;color:#cbd9cf}
</style></head><body>
<header><div class="brand">Horizen<span>Home</span></div><div class="head-actions"><span id="accountLabel" class="item-meta"></span><button id="signOut" class="btn hidden">Sign out</button></div></header>
<main>
<section id="loginPanel" class="card login"><div class="eyebrow">Your connected ecosystem</div><h1>One home for Horizen.</h1><p>Sign in securely with your existing HorizenMessages account to view your connected apps, sessions, and activity.</p><button id="loginBtn" class="btn primary">Continue with HorizenMessages</button><div id="loginError" class="error"></div><div class="foot">HorizenHome only receives information explicitly shared by connected apps. It does not scan your files or passwords.</div></section>
<section id="dashboard" class="hidden">
<div class="welcome"><div><div class="eyebrow">Personal control center</div><h1 id="welcomeTitle">Your Horizen system</h1><p class="sub">Manage the apps and browser sessions connected to your account.</p></div><div class="status">● Home services online</div></div>
<div class="grid">
<article class="card span-4"><h2>Connected systems</h2><p class="hint">Apps linked to this Messages account.</p><div class="metric" id="systemCount">0</div></article>
<article class="card span-4"><h2>Active sessions</h2><p class="hint">Signed-in app/browser connections.</p><div class="metric" id="sessionCount">0</div></article>
<article class="card span-4"><h2>Recent activity</h2><p class="hint">Metadata events shared by connected apps.</p><div class="metric" id="eventCount">0</div></article>
<article class="card span-8"><h2>My systems</h2><p class="hint">Disable an app to revoke its current Home sessions. You can reconnect it later.</p><div id="systemsList" class="empty">Loading systems…</div></article>
<article class="card span-4"><h2>Computer connections</h2><p class="hint">These are app/browser sessions, not a scan of your device.</p><div id="sessionsList" class="empty">Loading sessions…</div></article>
<article class="card span-8"><h2>Activity timeline</h2><p class="hint">Only approved event names and limited metadata are stored.</p><div id="eventsList" class="empty">No activity yet.</div></article>
<article class="card span-4"><h2>HorizenFamily</h2><p class="hint">Family controls are optional and separate from your personal Home account.</p><div class="notice">Family connection is not enabled yet. Your personal HorizenHome works without joining a family.</div></article>
<article class="card span-12"><h2>Privacy and security</h2><div class="notice">HorizenHome stores your Messages account ID, connected-app registrations, hashed session tokens, and limited activity metadata. It does not collect chat contents, prompts, images, passwords, files, or a device fingerprint. Revoke sessions you no longer recognize.</div></article>
</div><div id="dashError" class="error"></div><div class="foot">HorizenHome · Sessions expire after seven days. Signing out revokes this dashboard session.</div>
</section></main>
<script>
(function(){
"use strict";
var KEY="hz_home_dashboard_token_v1",token=localStorage.getItem(KEY)||"";
var $=function(id){return document.getElementById(id)};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function date(v){try{return new Date(v).toLocaleString()}catch(e){return "Unknown"}}
function showLogin(message){$("loginPanel").classList.remove("hidden");$("dashboard").classList.add("hidden");$("signOut").classList.add("hidden");$("loginError").textContent=message||""}
function showDashboard(){ $("loginPanel").classList.add("hidden");$("dashboard").classList.remove("hidden");$("signOut").classList.remove("hidden"); }
function login(){location.href="/connect?system=HorizenHome&return="+encodeURIComponent(location.origin+"/")}
async function api(path,opts){var r=await fetch(path,Object.assign({},opts||{},{headers:Object.assign({"Authorization":"Bearer "+token,"Content-Type":"application/json"},(opts&&opts.headers)||{})}));var d=await r.json().catch(function(){return {}});if(!r.ok)throw new Error(d.error||"Request failed ("+r.status+")");return d}
async function load(){
 try{
  var d=await api("/api/dashboard");
  showDashboard();$("accountLabel").textContent=d.account.display_name||d.account.email||"Messages account";
  $("welcomeTitle").textContent="Welcome"+(d.account.display_name?" back, "+d.account.display_name:" home");
  $("systemCount").textContent=d.systems.length;$("sessionCount").textContent=d.sessions.filter(function(x){return !x.revoked_at&&new Date(x.expires_at).getTime()>Date.now()}).length;$("eventCount").textContent=d.events.length;
  $("systemsList").className="";$("systemsList").innerHTML=d.systems.length?d.systems.map(function(s){var home=s.system_name==="HorizenHome",locked=!!s.locked,has=!!s.has_lock_password;return '<div class="item"><div><div class="item-title">'+esc(s.system_name)+'</div><div class="item-meta">'+esc(s.system_origin)+' · Last seen '+esc(s.last_seen_at?date(s.last_seen_at):"Not yet")+'</div></div><div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap"><span class="pill '+(s.enabled?"":"off")+'">'+(s.enabled?"Enabled":"Disabled")+'</span>'+(locked?'<span class="pill off">Locked</span>':'')+'<button class="btn '+(s.enabled?"danger":"")+'" data-system="'+esc(s.id)+'" data-enabled="'+(s.enabled?"1":"0")+'">'+(s.enabled?"Disable":"Enable")+'</button>'+(home?'':'<button class="btn" data-password="'+esc(s.id)+'">'+(has?'Change lock password':'Set lock password')+'</button><button class="btn '+(locked?'primary':'danger')+'" data-lock="'+esc(s.id)+'" data-locked="'+(locked?'1':'0')+'" '+(!has&&!locked?'disabled':'')+'>'+(locked?'Unlock':'Lock')+'</button>')+'<label class="item-meta"><input type="checkbox" data-logging="'+esc(s.id)+'" '+(s.detailed_logging?'checked':'')+'> Detailed AI logs</label></div></div>'}).join(""):'<div class="empty">No systems registered yet. Connect from a supported Horizen app.</div>';
  $("sessionsList").className="";$("sessionsList").innerHTML=d.sessions.length?d.sessions.map(function(s){var active=!s.revoked_at&&new Date(s.expires_at).getTime()>Date.now();var app=s.home_systems&&s.home_systems.system_name||"App";return '<div class="item"><div><div class="item-title">'+esc(app)+'</div><div class="item-meta">'+(active?"Expires ":"Ended ")+esc(date(s.expires_at))+'</div></div>'+(active?'<button class="btn danger" data-session="'+esc(s.id)+'">Revoke</button>':'<span class="pill off">Ended</span>')+'</div>'}).join(""):'<div class="empty">No sessions found.</div>';
  $("eventsList").className="";$("eventsList").innerHTML=d.events.length?d.events.map(function(e){var app=e.home_systems&&e.home_systems.system_name||"App",v=e.event_data||{};return '<div class="event"><div><strong>'+esc(e.event_type.replace(/_/g," "))+'</strong><small>'+esc(app)+'</small>'+(v.query?'<div class="item-meta">Exact prompt / search</div><div class="event-detail">'+esc(v.query)+'</div>':'')+(v.response?'<div class="item-meta">HorizenAI response</div><div class="event-detail">'+esc(v.response)+'</div>':'')+'</div><small>'+esc(date(e.created_at))+'</small></div>'}).join(""):'<div class="empty">No activity has been shared yet.</div>';
 }catch(e){if(/Session is missing|expired|revoked/i.test(e.message)){localStorage.removeItem(KEY);token="";showLogin("Your session expired. Please sign in again.");}else{$("dashError").textContent=e.message;showDashboard();}}
}
document.addEventListener("click",async function(e){
 var b=e.target.closest("button[data-session],button[data-system],button[data-password],button[data-lock]");
 if(b){try{b.disabled=true;if(b.dataset.session)await api("/api/sessions/revoke",{method:"POST",body:JSON.stringify({id:b.dataset.session})});else if(b.dataset.system)await api("/api/systems/toggle",{method:"POST",body:JSON.stringify({id:b.dataset.system,enabled:b.dataset.enabled!=="1"})});else if(b.dataset.password){var pw=prompt("Set a unique lock password (10–128 characters):");if(pw===null){b.disabled=false;return;}await api("/api/system/lock-password",{method:"POST",body:JSON.stringify({id:b.dataset.password,password:pw})});}else if(b.dataset.lock){var pass="";if(b.dataset.locked==="1"){pass=prompt("Enter this system's lock password to unlock:");if(pass===null){b.disabled=false;return;}await api("/api/system/unlock",{method:"POST",body:JSON.stringify({id:b.dataset.lock,password:pass})});}else await api("/api/system/lock",{method:"POST",body:JSON.stringify({id:b.dataset.lock})});}await load();}catch(err){$("dashError").textContent=err.message;b.disabled=false;}return;}
 var cb=e.target.closest("input[data-logging]");if(cb){try{await api("/api/systems/logging",{method:"POST",body:JSON.stringify({id:cb.dataset.logging,enabled:cb.checked})});await load();}catch(err){$("dashError").textContent=err.message;}}
});
$("loginBtn").addEventListener("click",login);
$("signOut").addEventListener("click",async function(){try{await api("/api/logout",{method:"POST"})}catch(e){}localStorage.removeItem(KEY);token="";showLogin("You have signed out.");});
var params=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.replace(/^#/,""));
var incoming=hash.get("hz_home_token");if(incoming){token=incoming;localStorage.setItem(KEY,token);history.replaceState(null,"",location.pathname);}
if(params.has("home_error"))showLogin("Messages sign-in did not complete. Please try again.");else if(token)load();else showLogin("");
})();
</script></body></html>`;
  return html(page,200,{"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY","Permissions-Policy":"camera=(), microphone=(), geolocation=()"});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/health") return json({ ok: true, service: "HorizenHome" });
      if (url.pathname === "/") {
        return dashboardPage();
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