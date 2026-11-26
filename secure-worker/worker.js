const HOME = "https://home.horizensearch.com";
const encoder = new TextEncoder();

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function page(system, error = "") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Horizen Secure</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 15% 10%,#063d2c 0,transparent 38%),radial-gradient(ellipse at 90% 85%,#10294b 0,transparent 42%),#050708;color:#f4fff9}
.card{width:min(100%,430px);padding:34px;border:1px solid #234a3b;border-radius:25px;background:linear-gradient(145deg,#101d19ed,#0a1115f2);box-shadow:0 28px 90px #0009,0 0 55px #00eb8420}
.logo{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#00eb841a;border:1px solid #00eb8466;color:#00eb84;font-size:24px}
.eyebrow{margin:25px 0 8px;color:#00eb84;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase}
h1{font-size:28px;margin:0 0 9px;letter-spacing:-.8px}
p{color:#a7b9b0;line-height:1.6;font-size:14px;margin:0 0 23px}
label{display:block;font-size:12px;font-weight:700;color:#c8d8d0;margin:0 0 9px}
input{width:100%;padding:15px 16px;border-radius:12px;border:1px solid #345449;background:#070e0c;color:white;font-size:16px;outline:none}
input:focus{border-color:#00eb84;box-shadow:0 0 0 3px #00eb8420}
button{width:100%;margin-top:15px;padding:15px;border:0;border-radius:12px;background:#00eb84;color:#04130c;font-size:14px;font-weight:850;cursor:pointer}
.error{padding:11px 13px;border:1px solid #793f46;background:#3a171d;color:#ffc4c9;border-radius:10px;font-size:13px;margin:0 0 16px}
.foot{margin:22px 0 0;text-align:center;color:#62786d;font-size:11px}
</style>
</head>
<body>
<main class="card">
<div class="logo">H</div>
<div class="eyebrow">Horizen Security</div>
<h1>System locked</h1>
<p><strong>${escapeHtml(system)}</strong> is protected by a password. Enter its lock password to continue.</p>
${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
<form method="post" action="/unlock">
<input type="hidden" name="system" value="${escapeHtml(system)}">
<input type="hidden" name="return" value="${escapeHtml(arguments[1] && arguments[1].returnUrl || "")}">
<label for="password">System password</label>
<input id="password" name="password" type="password" minlength="1" maxlength="128" autocomplete="current-password" required autofocus>
<button type="submit">Unlock system <span aria-hidden="true">→</span></button>
</form>
<div class="foot">Protected by HorizenHome · Your password is verified securely</div>
</main>
</body>
</html>`;
}

async function homeRequest(path, secret, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("X-Horizen-Lock-Service", secret);
  headers.set("Content-Type", "application/json");
  const response = await fetch(HOME + path, { ...init, headers, redirect: "manual" });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function safeReturn(raw, origin) {
  try {
    const u = new URL(raw || origin);
    if (u.origin !== origin || u.protocol !== "https:" || u.username || u.password) return origin;
    return u.toString();
  } catch { return origin; }
}

function headers() {
  return {
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store"
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.LOCK_SERVICE_SECRET || env.LOCK_SERVICE_SECRET.length < 32) {
      return new Response("Horizen Secure is not configured yet.", { status: 503, headers: headers() });
    }

    if (request.method === "GET" && url.pathname === "/") {
      const systemOrigin = url.searchParams.get("system") || "";
      const { response, data } = await homeRequest("/api/lock/service/inspect?origin=" + encodeURIComponent(systemOrigin), env.LOCK_SERVICE_SECRET);
      if (response.status === 404) return new Response("This Horizen system is not registered with HorizenHome.", { status: 404, headers: headers() });
      if (!response.ok || !data.found) return new Response("Could not verify this system. Please try again later.", { status: 502, headers: headers() });
      const returnTo = safeReturn(url.searchParams.get("return"), data.origin);
      if (!data.locked) return Response.redirect(returnTo, 302);
      return new Response(page(data.system, { returnUrl: returnTo }), { status: 200, headers: { ...headers(), "Content-Type": "text/html; charset=utf-8" } });
    }

    if (request.method === "POST" && url.pathname === "/unlock") {
      const form = await request.formData();
      const systemOrigin = String(form.get("system") || "");
      const password = String(form.get("password") || "");
      const returnRaw = String(form.get("return") || "");
      const { response, data } = await homeRequest("/api/lock/service/verify", env.LOCK_SERVICE_SECRET, {
        method: "POST",
        body: JSON.stringify({ origin: systemOrigin, password, clientIp: request.headers.get("CF-Connecting-IP") || "unknown" })
      });
      if (response.ok && data.ok && data.redirect) {
        return Response.redirect(safeReturn(returnRaw, data.redirect), 303);
      }
      const inspected = await homeRequest("/api/lock/service/inspect?origin=" + encodeURIComponent(systemOrigin), env.LOCK_SERVICE_SECRET);
      if (inspected.response.ok && inspected.data.found && !inspected.data.locked) {
        return Response.redirect(safeReturn(returnRaw, inspected.data.origin), 303);
      }
      const message = data.error || "Unable to unlock this system. Try again.";
      return new Response(page(inspected.data.system || "Horizen system", { returnUrl: safeReturn(returnRaw, inspected.data.origin || systemOrigin) }).replace("</div>\n</main>", "</div>\n</main>"), {
        status: response.status === 429 ? 429 : 200,
        headers: { ...headers(), "Content-Type": "text/html; charset=utf-8" }
      }).then(async res => {
        const body = await res.text();
        return new Response(body.replace('<div class="eyebrow">', '<div class="error">' + escapeHtml(message) + '</div><div class="eyebrow">'), { status: res.status, headers: res.headers });
      });
    }

    return new Response("Not found.", { status: 404, headers: headers() });
  }
};
