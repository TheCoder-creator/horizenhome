const MESSAGES_URL = "https://wzfdomantqeaedfexpgq.supabase.co";
const MESSAGES_KEY = "sb_publishable_vrz02Sm0olhxPqgc1MihJg_mrEMh7MG";
const OAUTH_CLIENT_ID = "302a7def-f3ac-493a-adf6-378256f36351";
const OAUTH_REDIRECT = "https://home.horizensearch.com/oauth/callback";
const SYSTEMS = Object.freeze({ HorizenHome: "https://home.horizensearch.com", HorizenAI: "https://ai.horizensearch.com", "Horizen OS": "https://horizensearch.com", "Horizen Play": "https://play.horizensearch.com", "Horizen Pages": "https://pages.horizensearch.com" });
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const COOKIE_NAME = "hz_home_oauth";
const encoder = new TextEncoder();
const sdk = "(function () {\n  \"use strict\";\n  const HOME = \"https://home.horizensearch.com\";\n  const STORAGE_KEY = \"hz_home_session_v1\";\n  let token = \"\";\n  let connected = false;\n  function button() { return document.getElementById(\"homeAccountBtn\"); }\n  function setButton(text, title) {\n    const el = button();\n    if (el) {\n      el.innerHTML = '<i class=\"fas fa-house\"></i> ' + text;\n      el.title = title || text;\n      el.classList.toggle(\"active\", connected);\n    }\n  }\n  async function request(path, options) {\n    return fetch(HOME + path, {\n      ...options,\n      headers: { ...(options && options.headers || {}), \"Authorization\": \"Bearer \" + token }\n    });\n  }\n  function connect() {\n    const names = { \"https://ai.horizensearch.com\": \"HorizenAI\", \"https://horizensearch.com\": \"Horizen OS\", \"https://play.horizensearch.com\": \"Horizen Play\", \"https://pages.horizensearch.com\": \"Horizen Pages\" };\n    const system = names[location.origin];\n    if (!system) { alert(\"This Horizen app is not registered with HorizenHome.\"); return; }\n    const back = location.origin + location.pathname + location.search;\n    location.assign(HOME + \"/connect?system=\" + encodeURIComponent(system) + \"&return=\" + encodeURIComponent(back));\n  }\n  async function secureRedirect() {\n    try {\n      const response = await request(\"/api/lock/context\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ returnUrl: location.href })\n      });\n      if (!response.ok) return;\n      const data = await response.json();\n      if (data.url) location.assign(data.url);\n    } catch (_) {}\n  }\n  async function me() {\n    if (!token) return null;\n    const response = await request(\"/api/me\", { method: \"GET\" });\n    if (response.status === 423) {\n      await secureRedirect();\n      return null;\n    }\n    if (!response.ok) {\n      token = \"\";\n      connected = false;\n      localStorage.removeItem(STORAGE_KEY);\n      setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n      return null;\n    }\n    connected = true;\n    const data = await response.json();\n    setButton(\"Home ✓\", \"Connected to HorizenHome. Click to disconnect.\");\n    return data;\n  }\n  async function track(type, data) {\n    if (!token || !connected) return;\n    try {\n      await request(\"/api/events\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ type, data: data || {} })\n      });\n    } catch (_) {}\n  }\n  async function pollLock() {\n    if (!token || !connected) return;\n    try {\n      const response = await request(\"/api/lock/poll\", { method: \"GET\" });\n      if (!response.ok) return;\n      const status = await response.json();\n      if (status.locked) await secureRedirect();\n    } catch (_) {}\n  }\n  async function logout() {\n    if (token) {\n      try { await request(\"/api/logout\", { method: \"POST\" }); } catch (_) {}\n    }\n    localStorage.removeItem(STORAGE_KEY);\n    token = \"\";\n    connected = false;\n    setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n  }\n  async function init() {\n    const hash = new URLSearchParams(location.hash.replace(/^#/, \"\"));\n    const incoming = hash.get(\"hz_home_token\");\n    if (incoming) {\n      token = incoming;\n      localStorage.setItem(STORAGE_KEY, token);\n      history.replaceState(null, \"\", location.pathname + location.search);\n    } else {\n      token = localStorage.getItem(STORAGE_KEY) || \"\";\n    }\n    const el = button();\n    if (el) {\n      el.addEventListener(\"click\", async function () {\n        if (!connected) return connect();\n        if (confirm(\"Disconnect this browser from HorizenHome?\")) await logout();\n      });\n    }\n    if (token) {\n      const profile = await me();\n      if (profile) {\n        await track(\"app_opened\", { path: location.pathname });\n        setInterval(pollLock, 2000);\n      }\n    } else {\n      setButton(\"Connect Home\", \"Connect this app to HorizenHome\");\n    }\n  }\n  window.HorizenHome = { init, connect, me, track, logout, isConnected: () => connected };\n  if (document.readyState === \"loading\") document.addEventListener(\"DOMContentLoaded\", init, { once: true });\n  else init();\n})();"

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
async function readSignedCookie(request, secret, name = COOKIE_NAME) {
  const raw = (request.headers.get("Cookie") || "").split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  if (!raw) return null;
  const value = raw.slice(name.length + 1);
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const encoded = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!same(signature, await sign(encoded, secret))) return null;
  try { return JSON.parse(new TextDecoder().decode(fromB64url(encoded))); }
  catch { return null; }
}
function cookieHeader(value, maxAge = 600, name = COOKIE_NAME, path = "/") {
  return name + "=" + value + "; Path=" + path + "; HttpOnly; Secure; SameSite=Lax; Max-Age=" + maxAge;
}
function clearCookie(name = COOKIE_NAME, path = "/") {
  return name + "=; Path=" + path + "; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
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
async function finishFamilyLogin(request, env, cookie, url) {
  const clearOAuth = clearCookie("hz_family_oauth", "/oauth/callback");
  if (!cookie || cookie.flow !== "family" || Date.now() - cookie.createdAt > 600000) return html("<h2>Family sign-in expired. Please try again.</h2>", 400, { "Set-Cookie": clearOAuth });
  if (url.searchParams.get("state") !== cookie.state) return html("<h2>Family sign-in state did not match.</h2>", 400, { "Set-Cookie": clearOAuth });
  if (url.searchParams.get("error")) return new Response(null, { status: 302, headers: { "Location": "/?family_error=1", "Set-Cookie": clearOAuth, "Cache-Control": "no-store" } });
  const code = url.searchParams.get("code");
  if (!code) return html("<h2>Messages did not return a family login code.</h2>", 400, { "Set-Cookie": clearOAuth });
  const tokenResponse = await fetch(MESSAGES_URL + "/auth/v1/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "apikey": MESSAGES_KEY }, body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: OAUTH_CLIENT_ID, redirect_uri: OAUTH_REDIRECT, code_verifier: cookie.verifier }) });
  if (!tokenResponse.ok) return html("<h2>Family Messages sign-in could not be completed.</h2>", 502, { "Set-Cookie": clearOAuth });
  const tokens = await tokenResponse.json();
  if (!tokens.access_token) return html("<h2>Messages did not provide an access token.</h2>", 502, { "Set-Cookie": clearOAuth });
  const userResponse = await fetch(MESSAGES_URL + "/auth/v1/oauth/userinfo", { headers: { "Authorization": "Bearer " + tokens.access_token, "apikey": MESSAGES_KEY } });
  if (!userResponse.ok) return html("<h2>Could not verify your Messages account.</h2>", 502, { "Set-Cookie": clearOAuth });
  const user = await userResponse.json(), userId = user.sub || user.user_id || user.id;
  if (!userId || userId !== cookie.expectedUserId) return html("<h2>Use the same Messages account for HorizenHome and Family.</h2>", 403, { "Set-Cookie": clearOAuth });
  const email = typeof user.email === "string" ? user.email.slice(0, 320).trim().toLowerCase() : "";
  if (!email || user.email_verified === false) return html("<h2>A verified Messages email is required for Family.</h2>", 403, { "Set-Cookie": clearOAuth });
  const familyPayload = await signedCookie({ userId, email, displayName: String(user.name || user.full_name || "").slice(0, 120), createdAt: Date.now() }, env.HOME_SIGNING_SECRET || "");
  const headers = new Headers({ "Location": "/?family_auth=success", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  headers.append("Set-Cookie", cookieHeader(familyPayload, 14400, "hz_family_auth", "/"));
  headers.append("Set-Cookie", clearOAuth);
  return new Response(null, { status: 302, headers });
}
async function finishLogin(request, env) {
  const url = new URL(request.url);
  const familyCookie = await readSignedCookie(request, env.HOME_SIGNING_SECRET || "", "hz_family_oauth");
  if (familyCookie && familyCookie.flow === "family" && url.searchParams.get("state") === familyCookie.state) return await finishFamilyLogin(request, env, familyCookie, url);
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
async function familyContext(request, env, identity) {
  const auth = await readSignedCookie(request, env.HOME_SIGNING_SECRET || "", "hz_family_auth");
  if (!auth || auth.userId !== identity.userId || !auth.email || Date.now() - auth.createdAt > 14400000) return null;
  const email = auth.email.toLowerCase();
  let rows = await db(env, "horizen_accounts?select=id,username,email,display_name,avatar_color&email=eq." + encodeURIComponent(email) + "&limit=1");
  let account = rows && rows[0];
  if (!account) {
    const base = String(auth.displayName || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "horizenuser";
    const username = base + "_" + randomToken(5).replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase();
    rows = await db(env, "horizen_accounts", { method: "POST", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ username, email, password_hash: "messages:" + randomToken(24), display_name: auth.displayName || base }) });
    account = rows && rows[0];
    if (!account) { rows = await db(env, "horizen_accounts?select=id,username,email,display_name,avatar_color&email=eq." + encodeURIComponent(email) + "&limit=1"); account = rows && rows[0]; }
  }
  if (!account) throw new Error("Could not load your HorizenFamily profile.");
  const memberships = await db(env, "family_members?select=id,family_id,account_id,role,joined_at&account_id=eq." + encodeURIComponent(account.id) + "&limit=1");
  const membership = memberships && memberships[0] || null;
  return { auth, account, membership, familyId: membership && membership.family_id || null, role: membership && membership.role || "parent" };
}
async function familyApi(request, env, url, identity, cors) {
  const ctx = await familyContext(request, env, identity);
  if (!ctx) return json({ error: "Sign in to HorizenFamily with Messages first." }, 401, cors);
  const accountId = ctx.account.id, isParent = ctx.role === "parent";
  const readBody = async () => { try { return await request.json(); } catch { return null; } };
  const verifyChild = async id => {
    if (!isParent || !ctx.familyId || typeof id !== "string") return false;
    const rows = await db(env, "family_members?select=id&family_id=eq." + encodeURIComponent(ctx.familyId) + "&account_id=eq." + encodeURIComponent(id) + "&role=eq.child&limit=1");
    return !!(rows && rows.length);
  };
  if (url.pathname === "/api/family/logout" && request.method === "POST") return json({ ok: true }, 200, { ...cors, "Set-Cookie": clearCookie("hz_family_auth", "/") });
  if (url.pathname === "/api/family/dashboard" && request.method === "GET") {
    const invites = await db(env, "family_invites?select=id,family_id,from_account_id,to_account_id,status,created_at,role,from_account:horizen_accounts!family_invites_from_account_id_fkey(username,display_name),family:horizen_family(family_name)&to_account_id=eq." + encodeURIComponent(accountId) + "&order=created_at.desc&limit=20");
    if (!ctx.membership) return json({ account: { id: accountId, username: ctx.account.username, display_name: ctx.account.display_name }, role: "parent", family: null, members: [], restrictions: [], invites: invites || [] }, 200, cors);
    const familyRows = await db(env, "horizen_family?select=id,family_name,parent_account_id,created_at&id=eq." + encodeURIComponent(ctx.familyId) + "&limit=1");
    const members = await db(env, "family_members?select=id,family_id,account_id,role,joined_at,account:horizen_accounts!family_members_account_id_fkey(id,username,display_name,avatar_color)&family_id=eq." + encodeURIComponent(ctx.familyId) + "&order=joined_at.asc");
    const restrictions = isParent
      ? await db(env, "family_restrictions?select=id,family_id,child_account_id,safe_search,screen_time_limit_minutes,blocked_urls,locked,location_tracking,updated_at&family_id=eq." + encodeURIComponent(ctx.familyId))
      : await db(env, "family_restrictions?select=id,family_id,child_account_id,safe_search,screen_time_limit_minutes,blocked_urls,locked,location_tracking,updated_at&family_id=eq." + encodeURIComponent(ctx.familyId) + "&child_account_id=eq." + encodeURIComponent(accountId));
    return json({ account: { id: accountId, username: ctx.account.username, display_name: ctx.account.display_name }, role: ctx.role, family: familyRows && familyRows[0] || null, members: members || [], restrictions: restrictions || [], invites: invites || [] }, 200, cors);
  }
  if (url.pathname === "/api/family/create" && request.method === "POST") {
    if (!isParent) return json({ error: "Only a parent can create a family." }, 403, cors);
    if (ctx.familyId) return json({ error: "You already belong to a family." }, 409, cors);
    const created = await db(env, "horizen_family", { method: "POST", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ family_name: (ctx.account.display_name || ctx.account.username) + "'s Family", parent_account_id: accountId }) });
    const family = created && created[0];
    if (!family) return json({ error: "Could not create your family." }, 500, cors);
    await db(env, "family_members", { method: "POST", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ family_id: family.id, account_id: accountId, role: "parent" }) });
    return json({ ok: true }, 200, cors);
  }
  if (url.pathname === "/api/family/invite/search" && request.method === "POST") {
    if (!isParent || !ctx.familyId) return json({ error: "Create a family first. Only parents can invite members." }, 403, cors);
    const data = await readBody(), q = String(data && data.query || "").trim().replace(/[*,()]/g, "");
    if (q.length < 2 || q.length > 40) return json({ error: "Enter at least 2 characters." }, 400, cors);
    const users = await db(env, "horizen_accounts?select=id,username,display_name,avatar_color&username=ilike.*" + encodeURIComponent(q) + "*&id=neq." + encodeURIComponent(accountId) + "&limit=8");
    const [members, pending] = await Promise.all([
      db(env, "family_members?select=account_id&family_id=eq." + encodeURIComponent(ctx.familyId)),
      db(env, "family_invites?select=to_account_id&family_id=eq." + encodeURIComponent(ctx.familyId) + "&status=eq.pending")
    ]);
    const memberIds = new Set((members || []).map(x => x.account_id)), pendingIds = new Set((pending || []).map(x => x.to_account_id));
    return json({ users: (users || []).map(x => ({ ...x, is_member: memberIds.has(x.id), invited: pendingIds.has(x.id) })) }, 200, cors);
  }
  if (url.pathname === "/api/family/invite" && request.method === "POST") {
    if (!isParent || !ctx.familyId) return json({ error: "Create a family first. Only parents can invite members." }, 403, cors);
    const data = await readBody(), targetId = data && data.accountId, role = data && data.role;
    if (typeof targetId !== "string" || !/^[0-9a-f-]{36}$/i.test(targetId) || !["child", "parent"].includes(role) || targetId === accountId) return json({ error: "Invalid invitation." }, 400, cors);
    const [member, pending] = await Promise.all([
      db(env, "family_members?select=id&family_id=eq." + encodeURIComponent(ctx.familyId) + "&account_id=eq." + encodeURIComponent(targetId) + "&limit=1"),
      db(env, "family_invites?select=id&family_id=eq." + encodeURIComponent(ctx.familyId) + "&to_account_id=eq." + encodeURIComponent(targetId) + "&status=eq.pending&limit=1")
    ]);
    if (member && member.length) return json({ error: "That account is already in your family." }, 409, cors);
    if (pending && pending.length) return json({ error: "An invitation is already pending." }, 409, cors);
    await db(env, "family_invites", { method: "POST", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ family_id: ctx.familyId, from_account_id: accountId, to_account_id: targetId, status: "pending", role }) });
    return json({ ok: true }, 200, cors);
  }
  if (url.pathname === "/api/family/invite/respond" && request.method === "POST") {
    const data = await readBody(), inviteId = data && data.id, status = data && data.status;
    if (typeof inviteId !== "string" || !/^[0-9a-f-]{36}$/i.test(inviteId) || !["accepted", "declined"].includes(status)) return json({ error: "Invalid invitation response." }, 400, cors);
    const rows = await db(env, "family_invites?select=id,family_id,role&id=eq." + encodeURIComponent(inviteId) + "&to_account_id=eq." + encodeURIComponent(accountId) + "&status=eq.pending&limit=1");
    const invite = rows && rows[0];
    if (!invite) return json({ error: "Invitation not found or already answered." }, 404, cors);
    if (status === "accepted") {
      const existing = await db(env, "family_members?select=id&account_id=eq." + encodeURIComponent(accountId) + "&limit=1");
      if (existing && existing.length) return json({ error: "This account already belongs to a family." }, 409, cors);
      await db(env, "family_members", { method: "POST", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ family_id: invite.family_id, account_id: accountId, role: invite.role || "child" }) });
    }
    await db(env, "family_invites?id=eq." + encodeURIComponent(invite.id) + "&to_account_id=eq." + encodeURIComponent(accountId) + "&status=eq.pending", { method: "PATCH", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ status }) });
    return json({ ok: true }, 200, cors);
  }
  if (url.pathname === "/api/family/restriction" && request.method === "POST") {
    if (!isParent || !ctx.familyId) return json({ error: "Only parents can change family controls." }, 403, cors);
    const data = await readBody(), childId = data && data.childAccountId;
    if (!(await verifyChild(childId))) return json({ error: "That child is not in your family." }, 403, cors);
    const patch = {};
    for (const key of ["safe_search", "locked", "location_tracking"]) if (typeof data[key] === "boolean") patch[key] = data[key];
    if (Number.isInteger(data.screen_time_limit_minutes) && data.screen_time_limit_minutes >= 0 && data.screen_time_limit_minutes <= 1440) patch.screen_time_limit_minutes = data.screen_time_limit_minutes;
    if (Array.isArray(data.blocked_urls)) patch.blocked_urls = data.blocked_urls.filter(x => typeof x === "string").slice(0, 100).map(x => x.trim().slice(0, 180)).filter(Boolean);
    if (!Object.keys(patch).length) return json({ error: "No valid control settings were provided." }, 400, cors);
    const existing = await db(env, "family_restrictions?select=id&family_id=eq." + encodeURIComponent(ctx.familyId) + "&child_account_id=eq." + encodeURIComponent(childId) + "&limit=1");
    if (existing && existing[0]) await db(env, "family_restrictions?id=eq." + encodeURIComponent(existing[0].id), { method: "PATCH", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }) });
    else await db(env, "family_restrictions", { method: "POST", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ family_id: ctx.familyId, child_account_id: childId, ...patch }) });
    return json({ ok: true }, 200, cors);
  }
  if (url.pathname === "/api/family/activity" && request.method === "GET") {
    const childId = url.searchParams.get("child");
    if (!(await verifyChild(childId))) return json({ error: "You cannot view activity for that account." }, 403, cors);
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const [apps, searches, screen] = await Promise.all([
      db(env, "account_app_history?select=id,app_name,app_url,opened_at&account_id=eq." + encodeURIComponent(childId) + "&opened_at=gte." + encodeURIComponent(since) + "&order=opened_at.desc&limit=30"),
      db(env, "account_search_history?select=id,query,searched_at&account_id=eq." + encodeURIComponent(childId) + "&searched_at=gte." + encodeURIComponent(since) + "&order=searched_at.desc&limit=30"),
      db(env, "screen_time_logs?select=date,minutes_used&account_id=eq." + encodeURIComponent(childId) + "&order=date.desc&limit=7")
    ]);
    return json({ apps: apps || [], searches: searches || [], screenTime: screen || [] }, 200, cors);
  }
  if (url.pathname === "/api/family/location" && request.method === "GET") {
    const childId = url.searchParams.get("child");
    if (!(await verifyChild(childId))) return json({ error: "You cannot view that location." }, 403, cors);
    const restrictions = await db(env, "family_restrictions?select=location_tracking&family_id=eq." + encodeURIComponent(ctx.familyId) + "&child_account_id=eq." + encodeURIComponent(childId) + "&limit=1");
    if (!restrictions || !restrictions[0] || restrictions[0].location_tracking !== true) return json({ error: "Location sharing is turned off for this family member." }, 403, cors);
    const locations = await db(env, "child_locations?select=id,latitude,longitude,accuracy,recorded_at&account_id=eq." + encodeURIComponent(childId) + "&order=recorded_at.desc&limit=10");
    return json({ locations: locations || [] }, 200, cors);
  }
  if (url.pathname === "/api/family/member/remove" && request.method === "POST") {
    if (!isParent || !ctx.familyId) return json({ error: "Only parents can remove members." }, 403, cors);
    const data = await readBody(), childId = data && data.accountId;
    if (typeof childId !== "string" || childId === accountId || !(await verifyChild(childId))) return json({ error: "That child cannot be removed." }, 403, cors);
    await db(env, "family_members?family_id=eq." + encodeURIComponent(ctx.familyId) + "&account_id=eq." + encodeURIComponent(childId), { method: "DELETE", headers: { "Prefer": "return=minimal" } });
    return json({ ok: true }, 200, cors);
  }
  return json({ error: "Family endpoint not found." }, 404, cors);
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
      const ticket = url.searchParams.get("ticket") || "";
      if (ticket.length < 30 || ticket.length > 200) return json({ error: "Invalid lock ticket." }, 400);
      const rows = await db(env, "home_system_lock_contexts?select=id,system_id,messages_user_id,expires_at,consumed_at,home_systems!home_system_lock_contexts_system_owner_fk!inner(system_name,system_origin,enabled,locked)&ticket_hash=eq." + encodeURIComponent(await sha256(ticket)) + "&limit=1");
      const context = rows && rows[0];
      if (!context || context.consumed_at) return json({ error: "This lock link has already been used. Return to the system and try again." }, 410);
      const target = context.home_systems;
      if (!target || !target.enabled) return json({ error: "System is unavailable." }, 404);
      return json({ found: true, locked: !!target.locked, system: target.system_name, origin: target.system_origin });
    }
    if (url.pathname === "/api/lock/service/verify" && request.method === "POST") {
      let body; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
      if (typeof body.ticket !== "string" || body.ticket.length < 30 || body.ticket.length > 200 || typeof body.password !== "string" || body.password.length > 128) return json({ error: "Invalid request." }, 400);
      const rows = await db(env, "home_system_lock_contexts?select=id,system_id,messages_user_id,expires_at,consumed_at,home_systems!home_system_lock_contexts_system_owner_fk!inner(system_name,system_origin,enabled,locked,lock_password_salt,lock_password_hash)&ticket_hash=eq." + encodeURIComponent(await sha256(body.ticket)) + "&limit=1");
      const context = rows && rows[0];
      if (!context || context.consumed_at) return json({ error: "This lock link has already been used. Return to the system and try again." }, 410);
      const target = context.home_systems;
      if (!target || !target.enabled) return json({ error: "System is unavailable." }, 404);
      if (!target.locked) {
        await db(env, "home_system_lock_contexts?id=eq." + encodeURIComponent(context.id) + "&consumed_at=is.null", { method: "PATCH", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ consumed_at: new Date().toISOString() }) });
        return json({ ok: true, locked: false, redirect: target.system_origin });
      }
      if (!target.lock_password_hash || !target.lock_password_salt) return json({ error: "This system has no lock password configured." }, 409);
      const ip = String(body.clientIp || "unknown").slice(0, 128);
      const ipHash = await sha256(ip + ":" + env.LOCK_SERVICE_SECRET);
      const attempts = await db(env, "home_system_lock_attempts?select=id&system_id=eq." + encodeURIComponent(context.system_id) + "&ip_hash=eq." + encodeURIComponent(ipHash) + "&succeeded=eq.false&attempted_at=gte." + encodeURIComponent(new Date(Date.now() - 15 * 60 * 1000).toISOString()));
      if (attempts && attempts.length >= 8) return json({ error: "Too many attempts. Wait 15 minutes and try again." }, 429);
      const material = await crypto.subtle.importKey("raw", encoder.encode(body.password), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromB64url(target.lock_password_salt), iterations: 100000, hash: "SHA-256" }, material, 256);
      const valid = same(b64url(new Uint8Array(bits)), target.lock_password_hash);
      await db(env, "home_system_lock_attempts", { method: "POST", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ system_id: context.system_id, ip_hash: ipHash, succeeded: valid }) });
      if (!valid) return json({ error: "Incorrect password." }, 403);
      const unlockedRows = await db(env, "home_systems?id=eq." + encodeURIComponent(context.system_id) + "&owner_messages_user_id=eq." + encodeURIComponent(context.messages_user_id) + "&locked=eq.true", { method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ locked: false }) });
      if (!unlockedRows || !unlockedRows.length) {
        const currentRows = await db(env, "home_systems?select=locked&id=eq." + encodeURIComponent(context.system_id) + "&owner_messages_user_id=eq." + encodeURIComponent(context.messages_user_id) + "&limit=1");
        if (!currentRows || !currentRows.length || currentRows[0].locked) return json({ error: "HorizenHome could not confirm that this system was unlocked. Please try again." }, 409);
      }
      await db(env, "home_system_lock_contexts?id=eq." + encodeURIComponent(context.id) + "&consumed_at=is.null", { method: "PATCH", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ consumed_at: new Date().toISOString() }) });
      await db(env, "home_system_lock_messages", { method: "POST", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ system_id: context.system_id, owner_messages_user_id: context.messages_user_id, action: "unlock" }) });
      return json({ ok: true, locked: false, redirect: target.system_origin });
    }
    return json({ error: "Not found." }, 404);
  }

  const identity = await authenticate(request, env);
  if (!identity) return json({ error: "Session is missing, expired, or revoked. Sign in again." }, 401, cors);
  if (url.pathname === "/api/family/auth/start" && request.method === "POST") {
    if (!env.HOME_SIGNING_SECRET || env.HOME_SIGNING_SECRET.length < 32) return json({ error: "Family sign-in is not configured." }, 503, cors);
    const state = randomToken(24), verifier = randomToken(32);
    const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
    const signed = await signedCookie({ flow: "family", state, verifier, expectedUserId: identity.userId, createdAt: Date.now() }, env.HOME_SIGNING_SECRET);
    const authorize = new URL(MESSAGES_URL + "/auth/v1/oauth/authorize");
    authorize.search = new URLSearchParams({ response_type: "code", client_id: OAUTH_CLIENT_ID, redirect_uri: OAUTH_REDIRECT, state, code_challenge: challenge, code_challenge_method: "S256", scope: "openid email profile" }).toString();
    return json({ url: authorize.toString() }, 200, { ...cors, "Set-Cookie": cookieHeader(signed, 600, "hz_family_oauth", "/oauth/callback") });
  }

  if (url.pathname === "/api/lock/context" && request.method === "POST") {
    let body; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400, cors); }
    if (!identity.system.locked) return json({ locked: false }, 200, cors);
    let returnUrl;
    try {
      returnUrl = new URL(typeof body.returnUrl === "string" ? body.returnUrl : identity.system.system_origin);
      if (returnUrl.protocol !== "https:" || returnUrl.origin !== identity.system.system_origin || returnUrl.username || returnUrl.password) throw new Error();
    } catch { return json({ error: "Invalid return address." }, 400, cors); }
    const ticket = randomToken(32);
    await db(env, "home_system_lock_contexts", {
      method: "POST",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({
        system_id: identity.system.id,
        messages_user_id: identity.userId,
        ticket_hash: await sha256(ticket),
        expires_at: null
      })
    });
    const lockUrl = "https://secure.horizensearch.com/?ticket=" + encodeURIComponent(ticket) + "&return=" + encodeURIComponent(returnUrl.toString());
    return json({ locked: true, url: lockUrl }, 200, cors);
  }

  if (url.pathname === "/api/lock/poll" && request.method === "GET") {
    const messages = await db(env, "home_system_lock_messages?select=id,action,created_at&system_id=eq." + encodeURIComponent(identity.system.id) + "&order=created_at.desc&limit=1");
    return json({ locked: !!identity.system.locked, system: identity.system.system_name, origin: identity.system.system_origin, message: messages && messages[0] || null }, 200, cors);
  }
  if (identity.system.locked) return json({ error: "This system is locked.", locked: true, lockUrl: "https://secure.horizensearch.com/?system=" + encodeURIComponent(identity.system.system_origin) }, 423, cors);

  if (url.pathname.startsWith("/api/family/")) return await familyApi(request, env, url, identity, cors);

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
    const changed=await db(env,"home_systems?id=eq."+id+"&owner_messages_user_id=eq."+uid+"&system_name=neq.HorizenHome&lock_password_hash=not.is.null",{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify({locked:true})});
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
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
:root{color-scheme:dark;--bg:#050914;--panel:#0d1730;--panel2:#122044;--line:#263c68;--muted:#9eafd0;--green:#63a8ff;--red:#ff718d}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 12% -8%,#123a80 0,transparent 43%),radial-gradient(ellipse at 95% 10%,#14265a 0,transparent 42%),var(--bg);color:#edf4ff;font:15px Inter,system-ui,sans-serif;min-height:100vh}
button{font:inherit;cursor:pointer}header{height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 max(22px,calc((100vw - 1180px)/2));background:rgba(5,10,25,.88);position:sticky;top:0;z-index:3}
.brand{font-size:22px;font-weight:800;color:#79b8ff;letter-spacing:-.7px}.brand span{color:#eaf4ee}.head-actions{display:flex;gap:10px;align-items:center}
.btn{border:1px solid var(--line);background:#111f3d;color:#edf4ff;border-radius:9px;padding:10px 14px;font-weight:650}.btn.primary{background:linear-gradient(120deg,#62a8ff,#8b9dff);color:#071329;border-color:#72b1ff}.btn.danger{color:#ff9eaa;border-color:#63313a;background:#251317}.btn:disabled{opacity:.5;cursor:not-allowed}
main{max-width:1180px;margin:0 auto;padding:34px 22px 70px}.welcome{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:26px}.eyebrow{color:var(--green);font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase}h1{font-size:clamp(28px,4vw,40px);letter-spacing:-1.4px;margin:8px 0 6px}.sub{color:var(--muted);line-height:1.6;margin:0}.status{font-size:12px;color:#8fc3ff;border:1px solid #31558c;border-radius:99px;padding:8px 11px;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:15px}.card{background:linear-gradient(145deg,rgba(17,31,61,.97),rgba(8,15,33,.98));border:1px solid var(--line);border-radius:15px;padding:19px;min-width:0}.span-8{grid-column:span 8}.span-4{grid-column:span 4}.span-12{grid-column:span 12}.card h2{font-size:16px;margin:0 0 5px}.hint{font-size:12px;color:var(--muted);line-height:1.55;margin:0 0 15px}.metric{font-size:32px;font-weight:800;color:#82baff;margin:10px 0 0}.item{padding:13px 0;border-top:1px solid #203127;display:flex;justify-content:space-between;gap:14px;align-items:center}.item:first-child{border-top:0}.item-title{font-weight:700}.item-meta{font-size:12px;color:var(--muted);margin-top:4px;overflow-wrap:anywhere}.pill{font-size:10px;border:1px solid #28553d;color:var(--green);padding:5px 8px;border-radius:99px;white-space:nowrap}.pill.off{color:#ffb4bd;border-color:#63313a}.empty{padding:16px;border:1px dashed #304638;border-radius:10px;color:var(--muted);font-size:13px;line-height:1.6}.event{display:grid;grid-template-columns:1fr auto;gap:10px;padding:11px 0;border-top:1px solid #203127}.event:first-child{border-top:0}.event strong{font-size:13px}.event small{display:block;color:var(--muted);margin-top:4px}.family{display:flex;justify-content:space-between;align-items:center;gap:16px}.notice{font-size:12px;color:#b5c5bb;background:#111e16;border:1px solid #294331;padding:12px;border-radius:10px;line-height:1.6}.login{max-width:480px;margin:12vh auto;padding:30px}.login h1{font-size:34px}.login p{color:var(--muted);line-height:1.7}.hidden{display:none!important}.error{color:#ff9eaa;font-size:13px;margin-top:12px;line-height:1.5}.foot{color:#6f8276;font-size:11px;margin-top:24px;line-height:1.6}
.family-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 17px;border:1px solid var(--line);border-radius:12px;background:#0a142b;margin-bottom:12px}.family-toolbar>div{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.family-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 18px}.family-tab{margin-top:12px}.family-tabs button{font-size:12px}.family-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.family-setting{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border:1px solid var(--line);border-radius:10px;background:#0a142b}.family-setting input[type=checkbox]{width:18px;height:18px;accent-color:#68adff}.family-setting input[type=number],#familySearchInput,#familyInviteRole,#familyControlChild,#familyActivityChild,#familyLocationChild,.family-field textarea{width:100%;padding:11px;border:1px solid var(--line);border-radius:9px;background:#071126;color:#edf4ff;font:inherit}.family-field{display:block;margin:12px 0;color:var(--muted);font-size:12px}.family-field textarea{display:block;margin-top:7px;resize:vertical}.family-map{height:360px;border:1px solid var(--line);border-radius:12px;margin:14px 0;overflow:hidden;background:#071126}.family-result{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 0;border-top:1px solid var(--line)}.family-result:first-child{border-top:0}.family-activity{padding:10px 0;border-top:1px solid var(--line);font-size:13px}.family-activity small{display:block;color:var(--muted);margin-top:4px}
@media(max-width:760px){header{padding:0 16px}.welcome{align-items:flex-start;flex-direction:column}.span-8,.span-4{grid-column:span 12}.family{align-items:flex-start;flex-direction:column}}

body{background:radial-gradient(900px 500px at 5% -10%,rgba(48,117,255,.24),transparent 65%),radial-gradient(700px 460px at 100% 10%,rgba(85,102,255,.18),transparent 65%),#050914}header{backdrop-filter:blur(20px);background:rgba(5,10,25,.88);border-bottom-color:rgba(87,151,255,.24)}.brand{font-size:24px;text-shadow:0 0 24px rgba(70,145,255,.34)}.card{background:linear-gradient(145deg,rgba(17,31,61,.97),rgba(8,15,33,.98));border-color:rgba(105,155,235,.24);border-radius:19px;box-shadow:0 18px 55px rgba(0,0,0,.28);transition:border-color .2s,transform .2s}.card:hover{border-color:rgba(102,169,255,.52);transform:translateY(-1px)}.metric{font-size:38px;text-shadow:0 0 24px rgba(70,145,255,.24)}.welcome h1{font-size:clamp(34px,5vw,48px);background:linear-gradient(100deg,#f4f8ff,#91c7ff 65%,#a4aaff);-webkit-background-clip:text;background-clip:text;color:transparent}.event{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:13px;margin:8px 0;border:1px solid #263b68;border-radius:12px;background:#0a1227}.family-shortcuts{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.family-shortcuts .btn{font-size:11px;padding:8px 9px;text-align:center;text-decoration:none}.head-actions a.btn{display:inline-flex;align-items:center;text-decoration:none}
.event-detail{margin-top:6px;padding:10px;border:1px solid #263b68;background:#060b19;border-radius:9px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto;font-size:12px;line-height:1.55;color:#d1e0ff}
</style></head><body>
<header><div class="brand">Horizen<span>Home</span></div><div class="head-actions"><span id="accountLabel" class="item-meta"></span><span id="refreshStatus" class="item-meta">Live refresh · 2s</span><button id="refreshBtn" class="btn hidden" type="button" title="Refresh dashboard">↻ Refresh</button><button id="familyConnectionsBtn" class="btn hidden" type="button">👨‍👩‍👧 Family</button><button id="signOut" class="btn hidden">Sign out</button></div></header>
<main>
<section id="loginPanel" class="card login"><div class="eyebrow">Your connected ecosystem</div><h1>One home for Horizen.</h1><p>Sign in securely with your existing HorizenMessages account to view your connected apps, sessions, and activity.</p><button id="loginBtn" class="btn primary">Continue with HorizenMessages</button><div id="loginError" class="error"></div><div class="foot">HorizenHome only receives information explicitly shared by connected apps. It does not scan your files or passwords.</div></section>
<section id="dashboard" class="hidden">
<div class="welcome" id="homeWelcome"><div><div class="eyebrow">Personal control center</div><h1 id="welcomeTitle">Your Horizen system</h1><p class="sub">Manage the apps and browser sessions connected to your account.</p></div><div class="status">● Home services online</div></div>
<div class="grid" id="homeOverviewGrid">
<article class="card span-4"><h2>Connected systems</h2><p class="hint">Apps linked to this Messages account.</p><div class="metric" id="systemCount">0</div></article>
<article class="card span-4"><h2>Active sessions</h2><p class="hint">Signed-in app/browser connections.</p><div class="metric" id="sessionCount">0</div></article>
<article class="card span-4"><h2>Recent activity</h2><p class="hint">Metadata events shared by connected apps.</p><div class="metric" id="eventCount">0</div></article>
<article class="card span-8"><h2>My systems</h2><p class="hint">Disable an app to revoke its current Home sessions. You can reconnect it later.</p><div id="systemsList" class="empty">Loading systems…</div></article>
<article class="card span-4"><h2>Computer connections</h2><p class="hint">These are app/browser sessions, not a scan of your device.</p><div id="sessionsList" class="empty">Loading sessions…</div></article>
<article class="card span-8"><h2>System logs</h2><p class="hint">Search activity by system name, event type, or logged details.</p><input id="eventSearch" type="search" placeholder="Search systems and logs…" autocomplete="off" style="width:100%;margin:0 0 12px;padding:12px 14px;border-radius:10px;border:1px solid #304b7b;background:#071126;color:#edf4ff;font:inherit;outline:none"><div id="eventsList" class="empty">No activity yet.</div></article>
<article class="card span-4"><h2>HorizenFamily</h2><p class="hint">Manage family members, device controls, activity, and shared location inside HorizenHome.</p><button class="btn primary" type="button" onclick="document.getElementById('familyConnectionsBtn').click()">Open Family Control Center</button><div class="item-meta" style="margin-top:10px">Separate Messages sign-in · Existing Family accounts</div></article>
<article class="card span-12"><h2>Privacy and security</h2><div class="notice">HorizenHome stores your Messages account ID, connected-app registrations, hashed session tokens, and limited activity metadata. It does not collect chat contents, prompts, images, passwords, files, or a device fingerprint. Revoke sessions you no longer recognize.</div></article>
</div>
<section id="familyModule" class="hidden">
  <div class="welcome"><div><div class="eyebrow">HorizenFamily · Native Home module</div><h1>Family Control Center</h1><p class="sub">Family tools run inside HorizenHome and use your existing Family profile.</p></div><button class="btn" id="familyBackBtn" type="button">← Back to Home</button></div>
  <div id="familyGate" class="card login"><h2>Connect HorizenFamily</h2><p class="hint">Sign in again with the same HorizenMessages account to open your family data and controls.</p><button id="familyAuthBtn" class="btn primary" type="button">Continue with HorizenMessages</button><div id="familyGateError" class="error"></div></div>
  <div id="familyWorkspace" class="hidden">
    <div class="family-toolbar"><div><strong id="familyTitle">My Family</strong><span id="familyRole" class="pill">Parent</span></div><div><button class="btn" id="familyRefreshBtn" type="button">↻ Refresh</button> <button class="btn danger" id="familySignOutBtn" type="button">Sign out of Family</button></div></div>
    <div class="family-tabs"><button class="btn primary" data-family-tab="overview">Overview</button><button class="btn" data-family-tab="members">Members</button><button class="btn" data-family-tab="controls">Controls</button><button class="btn" data-family-tab="activity">Activity</button><button class="btn" data-family-tab="location">Location</button></div>
    <div id="familyError" class="error"></div>
    <div id="familyTab-overview" class="family-tab"><div class="grid">
      <article class="card span-4"><h2>Family members</h2><div class="metric" id="familyMemberCount">0</div></article><article class="card span-4"><h2>Children</h2><div class="metric" id="familyChildCount">0</div></article><article class="card span-4"><h2>Pending invitations</h2><div class="metric" id="familyInviteCount">0</div></article>
      <article class="card span-8"><h2>People in your family</h2><div id="familyOverviewMembers" class="empty">Loading…</div></article><article class="card span-4"><h2>Invitations</h2><div id="familyOverviewInvites" class="empty">No invitations.</div></article>
    </div><div id="familyCreateBox" class="card hidden"><h2>Create your family</h2><p class="hint">Your Messages account is connected, but it is not part of a family yet.</p><button class="btn primary" id="familyCreateBtn" type="button">Create Family</button></div></div>
    <div id="familyTab-members" class="family-tab hidden"><div class="grid"><article class="card span-8"><h2>Family members</h2><div id="familyMembersList" class="empty">Loading…</div></article><article class="card span-4" id="familyInviteCard"><h2>Invite a member</h2><p class="hint">Search by HorizenFamily username.</p><input id="familySearchInput" placeholder="Search username" autocomplete="off"><select id="familyInviteRole"><option value="child">Child</option><option value="parent">Parent</option></select><button class="btn primary" id="familySearchBtn" type="button">Search</button><div id="familySearchResults"></div></article></div></div>
    <div id="familyTab-controls" class="family-tab hidden"><article class="card"><h2>Parental controls</h2><p class="hint" id="familyControlsHint">Select a child to manage their settings.</p><select id="familyControlChild"></select><div id="familyControlsEditor" class="hidden"><div class="family-control-grid">
      <label class="family-setting"><span>Safe Search</span><input type="checkbox" id="familySafeSearch"></label><label class="family-setting"><span>Device locked</span><input type="checkbox" id="familyLocked"></label><label class="family-setting"><span>Location sharing</span><input type="checkbox" id="familyLocationTracking"></label><label class="family-setting"><span>Daily screen-time limit (minutes)</span><input type="number" id="familyScreenLimit" min="0" max="1440" step="5"></label></div>
      <label class="family-field">Blocked websites (one domain per line)<textarea id="familyBlockedUrls" rows="5" placeholder="example.com"></textarea></label><button class="btn primary" id="familySaveControls" type="button">Save Family Controls</button></div><div id="familyChildReadOnly" class="notice hidden">You are signed in as a child. These settings are read-only.</div></article></div>
    <div id="familyTab-activity" class="family-tab hidden"><article class="card"><h2>Family activity · Last 7 days</h2><p class="hint">Activity is only available to parents for children in their family.</p><select id="familyActivityChild"></select><div id="familyActivityContent" class="empty">Select a child to view activity.</div></article></div>
    <div id="familyTab-location" class="family-tab hidden"><article class="card"><h2>Family location</h2><p class="hint">Location is shown only when the family member has enabled location sharing.</p><select id="familyLocationChild"></select><div id="familyLocationMap" class="family-map"></div><div id="familyLocationInfo" class="item-meta">Choose a family member.</div><div id="familyLocationHistory"></div></article></div>
  </div>
</section>
<div id="dashError" class="error"></div><div class="foot">HorizenHome · Sessions expire after seven days. Signing out revokes this dashboard session.</div>
</section></main>
<script>
(function(){
"use strict";
var KEY="hz_home_dashboard_token_v1",token=localStorage.getItem(KEY)||"";
var $=function(id){return document.getElementById(id)};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function date(v){try{return new Date(v).toLocaleString()}catch(e){return "Unknown"}}
function showLogin(message){$("loginPanel").classList.remove("hidden");$("dashboard").classList.add("hidden");$("signOut").classList.add("hidden");$("familyConnectionsBtn").classList.add("hidden");$("loginError").textContent=message||""}
function showDashboard(){ $("loginPanel").classList.add("hidden");$("dashboard").classList.remove("hidden");$("signOut").classList.remove("hidden");$("familyConnectionsBtn").classList.remove("hidden"); }
function login(){location.href="/connect?system=HorizenHome&return="+encodeURIComponent(location.origin+"/")}
async function api(path,opts){var r=await fetch(path,Object.assign({},opts||{},{headers:Object.assign({"Authorization":"Bearer "+token,"Content-Type":"application/json"},(opts&&opts.headers)||{})}));var d=await r.json().catch(function(){return {}});if(!r.ok)throw new Error(d.error||"Request failed ("+r.status+")");return d}
var loading=false;
async function load(silent){
 if(loading||!token)return;
 loading=true;
 var refresh=$("refreshBtn");if(refresh)refresh.disabled=true;
 try{
  var d=await api("/api/dashboard");
  showDashboard();$("accountLabel").textContent=d.account.display_name||d.account.email||"Messages account";
  $("welcomeTitle").textContent="Welcome"+(d.account.display_name?" back, "+d.account.display_name:" home");
  $("systemCount").textContent=d.systems.length;$("sessionCount").textContent=d.sessions.filter(function(x){return !x.revoked_at&&new Date(x.expires_at).getTime()>Date.now()}).length;$("eventCount").textContent=d.events.length;
  $("systemsList").className="";$("systemsList").innerHTML=d.systems.length?d.systems.map(function(s){var home=s.system_name==="HorizenHome",locked=!!s.locked,has=!!s.has_lock_password;return '<div class="item"><div><div class="item-title">'+esc(s.system_name)+'</div><div class="item-meta">'+esc(s.system_origin)+' · Last seen '+esc(s.last_seen_at?date(s.last_seen_at):"Not yet")+'</div></div><div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap"><span class="pill '+(s.enabled?"":"off")+'">'+(s.enabled?"Enabled":"Disabled")+'</span>'+(locked?'<span class="pill off">Locked</span>':'')+'<button class="btn '+(s.enabled?"danger":"")+'" data-system="'+esc(s.id)+'" data-enabled="'+(s.enabled?"1":"0")+'">'+(s.enabled?"Disable":"Enable")+'</button>'+(home?'':'<button class="btn" data-password="'+esc(s.id)+'">'+(has?'Change lock password':'Set lock password')+'</button><button class="btn '+(locked?'primary':'danger')+'" data-lock="'+esc(s.id)+'" data-locked="'+(locked?'1':'0')+'" '+(!has&&!locked?'disabled':'')+'>'+(locked?'Unlock':'Lock')+'</button>')+'<label class="item-meta"><input type="checkbox" data-logging="'+esc(s.id)+'" '+(s.detailed_logging?'checked':'')+'> Detailed AI logs</label></div></div>'}).join(""):'<div class="empty">No systems registered yet. Connect from a supported Horizen app.</div>';
  $("sessionsList").className="";$("sessionsList").innerHTML=d.sessions.length?d.sessions.map(function(s){var active=!s.revoked_at&&new Date(s.expires_at).getTime()>Date.now();var app=s.home_systems&&s.home_systems.system_name||"App";return '<div class="item"><div><div class="item-title">'+esc(app)+'</div><div class="item-meta">'+(active?"Expires ":"Ended ")+esc(date(s.expires_at))+'</div></div>'+(active?'<button class="btn danger" data-session="'+esc(s.id)+'">Revoke</button>':'<span class="pill off">Ended</span>')+'</div>'}).join(""):'<div class="empty">No sessions found.</div>';
  window.homeEvents=d.events||[];renderEvents();
  $("refreshStatus").textContent="Updated "+new Date().toLocaleTimeString()+" · every 2s";
 }catch(e){if(/Session is missing|expired|revoked/i.test(e.message)){localStorage.removeItem(KEY);token="";showLogin("Your session expired. Please sign in again.");}else{$("dashError").textContent=e.message;if(!silent)showDashboard();}}
 finally{loading=false;if(refresh)refresh.disabled=false;}
}
var familyData=null,familyMap=null,familyMarker=null;
function showHomeOverview(){$("homeOverviewGrid").classList.remove("hidden");$("homeWelcome").classList.remove("hidden");$("familyModule").classList.add("hidden")}
function showFamilyModule(){$("homeOverviewGrid").classList.add("hidden");$("homeWelcome").classList.add("hidden");$("familyModule").classList.remove("hidden");loadFamily()}
function familyTab(name){document.querySelectorAll(".family-tab").forEach(function(x){x.classList.add("hidden")});var p=$("familyTab-"+name);if(p)p.classList.remove("hidden");document.querySelectorAll("[data-family-tab]").forEach(function(b){b.classList.toggle("primary",b.dataset.familyTab===name)});if(name==="location"&&familyMap)setTimeout(function(){familyMap.invalidateSize()},100)}
async function loadFamily(){ $("familyError").textContent="";$("familyGateError").textContent="";try{familyData=await api("/api/family/dashboard");$("familyGate").classList.add("hidden");$("familyWorkspace").classList.remove("hidden");renderFamily()}catch(e){$("familyWorkspace").classList.add("hidden");$("familyGate").classList.remove("hidden");$("familyGateError").textContent=/Sign in to HorizenFamily/i.test(e.message)?"Connect your Family profile with HorizenMessages to continue.":e.message}}
function renderFamily(){
 var d=familyData,role=d.role||"parent",members=d.members||[],children=members.filter(function(m){return m.role==="child"}),invites=d.invites||[];
 $("familyTitle").textContent=d.family&&d.family.family_name||"My Family";$("familyRole").textContent=role==="parent"?"Parent":"Child";
 $("familyMemberCount").textContent=members.length;$("familyChildCount").textContent=children.length;$("familyInviteCount").textContent=invites.filter(function(i){return i.status==="pending"}).length;
 $("familyCreateBox").classList.toggle("hidden",!!d.family||role!=="parent");$("familyInviteCard").classList.toggle("hidden",role!=="parent");
 $("familyOverviewMembers").innerHTML=members.length?members.map(function(m){var a=m.account||{};return '<div class="family-result"><div><strong>'+esc(a.display_name||a.username||"Family member")+'</strong><div class="item-meta">@'+esc(a.username||"unknown")+' · '+esc(m.role)+'</div></div><span class="pill">'+esc(m.role)+'</span></div>'}).join(""):'<div class="empty">No family members yet.</div>';
 $("familyMembersList").innerHTML=members.length?members.map(function(m){var a=m.account||{};return '<div class="family-result"><div><strong>'+esc(a.display_name||a.username||"Family member")+'</strong><div class="item-meta">@'+esc(a.username||"unknown")+' · '+esc(m.role)+'</div></div>'+(role==="parent"&&m.role==="child"?'<button class="btn danger" data-family-remove="'+esc(m.account_id)+'">Remove</button>':'<span class="pill">'+esc(m.role)+'</span>')+'</div>'}).join(""):'<div class="empty">No members yet.</div>';
 var pending=invites.filter(function(i){return i.status==="pending"});$("familyOverviewInvites").innerHTML=pending.length?pending.map(function(i){return '<div class="family-result"><div><strong>'+esc(i.from_account&&(i.from_account.display_name||i.from_account.username)||"Family member")+'</strong><div class="item-meta">Invited you as '+esc(i.role||"child")+'</div></div><div><button class="btn primary" data-family-respond="'+esc(i.id)+'" data-status="accepted">Accept</button> <button class="btn danger" data-family-respond="'+esc(i.id)+'" data-status="declined">Decline</button></div></div>'}).join(""):'<div class="empty">No pending invitations.</div>';
 var options=children.map(function(m){var a=m.account||{};return '<option value="'+esc(m.account_id)+'">'+esc(a.display_name||a.username||"Child")+'</option>'}).join("");
 ["familyControlChild","familyActivityChild","familyLocationChild"].forEach(function(id){var el=$(id),old=el.value;el.innerHTML=options||'<option value="">No children</option>';if(old&&children.some(function(m){return m.account_id===old}))el.value=old});
 $("familyChildReadOnly").classList.toggle("hidden",role!=="child");$("familyControlsEditor").classList.toggle("hidden",role!=="parent"||!children.length);
 $("familyControlsHint").textContent=role==="parent"?"Choose a child and configure their family restrictions.":"Your family restrictions are read-only.";
 document.querySelector('[data-family-tab="activity"]').classList.toggle("hidden",role!=="parent");document.querySelector('[data-family-tab="location"]').classList.toggle("hidden",role!=="parent");
 if(role==="parent"&&children.length)loadFamilyControls();if(role==="child"){var own=(d.restrictions||[])[0]||{};$("familyChildReadOnly").textContent="Your restrictions: Safe Search "+(own.safe_search?"ON":"OFF")+", screen-time limit "+(own.screen_time_limit_minutes||0)+" minutes, device "+(own.locked?"locked":"unlocked")+".";
 }
}
function loadFamilyControls(){var id=$("familyControlChild").value;if(!id)return;var r=(familyData.restrictions||[]).find(function(x){return x.child_account_id===id})||{};$("familySafeSearch").checked=!!r.safe_search;$("familyLocked").checked=!!r.locked;$("familyLocationTracking").checked=!!r.location_tracking;$("familyScreenLimit").value=r.screen_time_limit_minutes==null?120:r.screen_time_limit_minutes;$("familyBlockedUrls").value=Array.isArray(r.blocked_urls)?r.blocked_urls.join("\n"):"";$("familyControlsEditor").classList.remove("hidden")}
async function familySearch(){var q=$("familySearchInput").value.trim();if(q.length<2){$("familySearchResults").textContent="Enter at least 2 characters.";return}$("familySearchResults").textContent="Searching…";try{var d=await api("/api/family/invite/search",{method:"POST",body:JSON.stringify({query:q})});$("familySearchResults").innerHTML=d.users.length?d.users.map(function(u){var state=u.is_member?"Already a member":u.invited?"Invitation pending":'<button class="btn primary" data-family-invite="'+esc(u.id)+'">Invite</button>';return '<div class="family-result"><div><strong>'+esc(u.display_name||u.username)+'</strong><div class="item-meta">@'+esc(u.username)+'</div></div>'+state+'</div>'}).join(""):'<div class="empty">No users found.</div>'}catch(e){$("familySearchResults").textContent=e.message}}
async function loadFamilyActivity(){var id=$("familyActivityChild").value;if(!id)return;$("familyActivityContent").textContent="Loading activity…";try{var d=await api("/api/family/activity?child="+encodeURIComponent(id)),rows=[];(d.screenTime||[]).forEach(function(x){rows.push('<div class="family-activity"><strong>Screen time · '+esc(x.minutes_used||0)+' minutes</strong><small>'+esc(x.date)+'</small></div>')});(d.apps||[]).forEach(function(x){rows.push('<div class="family-activity"><strong>Opened '+esc(x.app_name||"an app")+'</strong><small>'+esc(x.app_url||"")+' · '+esc(date(x.opened_at))+'</small></div>')});(d.searches||[]).forEach(function(x){rows.push('<div class="family-activity"><strong>Search</strong><div>'+esc(x.query)+'</div><small>'+esc(date(x.searched_at))+'</small></div>')});$("familyActivityContent").innerHTML=rows.length?rows.join(""):'<div class="empty">No activity recorded in the last 7 days.</div>'}catch(e){$("familyActivityContent").textContent=e.message}}
function initFamilyMap(){if(familyMap||!window.L)return;familyMap=L.map("familyLocationMap",{zoomControl:true}).setView([0,0],2);L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors",maxZoom:19,minZoom:2,crossOrigin:true}).addTo(familyMap);familyMarker=L.marker([0,0]).addTo(familyMap);familyMarker.setOpacity(0)}
async function loadFamilyLocation(){var id=$("familyLocationChild").value;if(!id)return;$("familyLocationInfo").textContent="Loading location…";try{var d=await api("/api/family/location?child="+encodeURIComponent(id)),locs=d.locations||[],latest=locs[0];initFamilyMap();if(familyMap)setTimeout(function(){familyMap.invalidateSize()},100);if(latest&&Number.isFinite(Number(latest.latitude))&&Number.isFinite(Number(latest.longitude))){var point=[Number(latest.latitude),Number(latest.longitude)];familyMap.setView(point,15);familyMarker.setLatLng(point);familyMarker.setOpacity(1);$("familyLocationInfo").textContent=point[0].toFixed(5)+", "+point[1].toFixed(5)+" · "+(latest.accuracy?"±"+Math.round(latest.accuracy)+"m":"accuracy unknown")+" · "+date(latest.recorded_at)}else{$("familyLocationInfo").textContent="No location has been shared.";familyMarker.setOpacity(0)}$("familyLocationHistory").innerHTML=locs.slice(1).map(function(x){return '<div class="family-activity">'+Number(x.latitude).toFixed(4)+", "+Number(x.longitude).toFixed(4)+'<small>'+esc(date(x.recorded_at))+'</small></div>'}).join("")}catch(e){$("familyLocationInfo").textContent=e.message;initFamilyMap();if(familyMarker)familyMarker.setOpacity(0)}}
async function saveFamilyControls(){var id=$("familyControlChild").value;if(!id)return;var data={childAccountId:id,safe_search:$("familySafeSearch").checked,locked:$("familyLocked").checked,location_tracking:$("familyLocationTracking").checked,screen_time_limit_minutes:Number($("familyScreenLimit").value),blocked_urls:$("familyBlockedUrls").value.split("\n").map(function(x){return x.trim()}).filter(Boolean)};try{await api("/api/family/restriction",{method:"POST",body:JSON.stringify(data)});$("familyError").textContent="Family controls saved.";await loadFamily()}catch(e){$("familyError").textContent=e.message}}
function renderEvents(){var input=$("eventSearch"),q=(input?input.value:"").trim().toLowerCase();var rows=(window.homeEvents||[]).filter(function(e){var app=e.home_systems&&e.home_systems.system_name||"App";return (app+" "+e.event_type+" "+JSON.stringify(e.event_data||{})).toLowerCase().indexOf(q)!==-1;});$("eventsList").className="";$("eventsList").innerHTML=rows.length?rows.map(function(e){var app=e.home_systems&&e.home_systems.system_name||"App",v=e.event_data||{};return '<div class="event"><div><strong>'+esc(e.event_type.replace(/_/g," "))+'</strong><small>'+esc(app)+'</small>'+(v.query?'<div class="item-meta">Exact prompt / search</div><div class="event-detail">'+esc(v.query)+'</div>':'')+(v.response?'<div class="item-meta">HorizenAI response</div><div class="event-detail">'+esc(v.response)+'</div>':'')+'</div><small>'+esc(date(e.created_at))+'</small></div>'}).join(""):'<div class="empty">'+(q?'No logs match your search.':'No activity has been shared yet.')+'</div>';}
document.addEventListener("click",async function(e){
 var b=e.target.closest("button[data-session],button[data-system],button[data-password],button[data-lock]");
 if(b){try{b.disabled=true;if(b.dataset.session)await api("/api/sessions/revoke",{method:"POST",body:JSON.stringify({id:b.dataset.session})});else if(b.dataset.system)await api("/api/systems/toggle",{method:"POST",body:JSON.stringify({id:b.dataset.system,enabled:b.dataset.enabled!=="1"})});else if(b.dataset.password){var pw=prompt("Set a unique lock password (10–128 characters):");if(pw===null){b.disabled=false;return;}await api("/api/system/lock-password",{method:"POST",body:JSON.stringify({id:b.dataset.password,password:pw})});}else if(b.dataset.lock){var pass="";if(b.dataset.locked==="1"){pass=prompt("Enter this system's lock password to unlock:");if(pass===null){b.disabled=false;return;}await api("/api/system/unlock",{method:"POST",body:JSON.stringify({id:b.dataset.lock,password:pass})});}else await api("/api/system/lock",{method:"POST",body:JSON.stringify({id:b.dataset.lock})});}await load();}catch(err){$("dashError").textContent=err.message;b.disabled=false;}return;}
 var cb=e.target.closest("input[data-logging]");if(cb){try{await api("/api/systems/logging",{method:"POST",body:JSON.stringify({id:cb.dataset.logging,enabled:cb.checked})});await load();}catch(err){$("dashError").textContent=err.message;}}
});
$("eventSearch").addEventListener("input",renderEvents);
$("familyConnectionsBtn").addEventListener("click",showFamilyModule);$("familyBackBtn").addEventListener("click",showHomeOverview);
$("familyAuthBtn").addEventListener("click",async function(){try{$("familyAuthBtn").disabled=true;$("familyGateError").textContent="Opening HorizenMessages…";var d=await api("/api/family/auth/start",{method:"POST"});location.assign(d.url)}catch(e){$("familyGateError").textContent=e.message;$("familyAuthBtn").disabled=false}});
$("familyRefreshBtn").addEventListener("click",loadFamily);$("familySignOutBtn").addEventListener("click",async function(){try{await api("/api/family/logout",{method:"POST"})}catch(e){}familyData=null;$("familyWorkspace").classList.add("hidden");$("familyGate").classList.remove("hidden");$("familyGateError").textContent="You have signed out of Family."});
$("familyCreateBtn").addEventListener("click",async function(){try{await api("/api/family/create",{method:"POST"});await loadFamily()}catch(e){$("familyError").textContent=e.message}});
$("familySearchBtn").addEventListener("click",familySearch);$("familySaveControls").addEventListener("click",saveFamilyControls);$("familyControlChild").addEventListener("change",loadFamilyControls);$("familyActivityChild").addEventListener("change",loadFamilyActivity);$("familyLocationChild").addEventListener("change",loadFamilyLocation);
document.querySelectorAll("[data-family-tab]").forEach(function(b){b.addEventListener("click",function(){familyTab(b.dataset.familyTab);if(b.dataset.familyTab==="activity")loadFamilyActivity();if(b.dataset.familyTab==="location")loadFamilyLocation()})});
document.addEventListener("click",async function(e){
 var inv=e.target.closest("[data-family-invite]");if(inv){try{inv.disabled=true;await api("/api/family/invite",{method:"POST",body:JSON.stringify({accountId:inv.dataset.familyInvite,role:$("familyInviteRole").value})});inv.textContent="Invited ✓";await loadFamily()}catch(err){$("familyError").textContent=err.message;inv.disabled=false}return}
 var rsp=e.target.closest("[data-family-respond]");if(rsp){try{await api("/api/family/invite/respond",{method:"POST",body:JSON.stringify({id:rsp.dataset.familyRespond,status:rsp.dataset.status})});await loadFamily()}catch(err){$("familyError").textContent=err.message}return}
 var rem=e.target.closest("[data-family-remove]");if(rem){if(!confirm("Remove this child from your family?"))return;try{await api("/api/family/member/remove",{method:"POST",body:JSON.stringify({accountId:rem.dataset.familyRemove})});await loadFamily()}catch(err){$("familyError").textContent=err.message}return}
});

$("loginBtn").addEventListener("click",login);
$("refreshBtn").addEventListener("click",function(){load(false);});
$("signOut").addEventListener("click",async function(){try{await api("/api/logout",{method:"POST"})}catch(e){}localStorage.removeItem(KEY);token="";showLogin("You have signed out.");});
var params=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.replace(/^#/,""));
var familyParams=new URLSearchParams(location.search);
var incoming=hash.get("hz_home_token");if(incoming){token=incoming;localStorage.setItem(KEY,token);history.replaceState(null,"",location.pathname);}
if(params.has("home_error"))showLogin("Messages sign-in did not complete. Please try again.");else if(token){showDashboard();$("refreshBtn").classList.remove("hidden");load(false);setInterval(function(){if(!document.hidden&&token)load(true);},2000);if(familyParams.has("family_auth")||familyParams.has("family_error"))showFamilyModule();}else showLogin("");
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