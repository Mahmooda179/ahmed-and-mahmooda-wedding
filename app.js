/* ============================================================
   CONFIG — paste your Google Apps Script Web App URL below.
   See README.md, step "Deploy the backend".
   ============================================================ */
var API_URL = "https://script.google.com/macros/s/AKfycbyC641nui9fh-r90hOOGjs10_Pzx9IWQLv-EE6iVddSE96XcGITGbUmCXj5v8-cWLfH/exec";

/**
 * Calls the Apps Script backend. Uses text/plain as the content type
 * on purpose — this avoids a CORS preflight request, which Apps
 * Script web apps don't handle. Do not change to application/json.
 *
 * Retries automatically on genuinely ambiguous failures — a dropped
 * connection, a bad HTTP status, or a response that isn't valid JSON
 * (Apps Script can return an HTML error page under load, e.g. from
 * its ~30-simultaneous-execution ceiling). These are cases where we
 * don't actually know whether the server processed the request, so
 * retrying is the right move.
 *
 * It does NOT retry once a well-formed {ok: true|false, ...} answer
 * comes back — that's a definitive response from the server's own
 * logic, not a transient hiccup, so retrying it would accomplish
 * nothing (or, for something like "create a new guest", could create
 * a duplicate if the first attempt actually succeeded and only the
 * reply got lost). Save actions on the admin side send a client-
 * generated id specifically so a retried create is a safe no-op
 * rather than a duplicate.
 */
async function api(action, payload) {
  payload = payload || {};
  payload.action = action;

  const maxAttempts = 3;
  const baseDelayMs = 400;
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error("Network error (" + res.status + ").");
      }
      try {
        return await res.json();
      } catch (parseErr) {
        throw new Error("Unexpected response from the server.");
      }
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw new Error(
    "Couldn't reach the server after " + maxAttempts + " tries — it may be busy. " +
    "Please try again in a moment. (" + (lastErr && lastErr.message ? lastErr.message : "unknown error") + ")"
  );
}

/* ---------- small shared UI helpers ---------- */

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  attrs = attrs || {};
  Object.keys(attrs).forEach((k) => {
    if (k === "class") node.className = attrs[k];
    else if (k === "html") node.innerHTML = attrs[k];
    else node.setAttribute(k, attrs[k]);
  });
  (children || []).forEach((c) => {
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  });
  return node;
}

function formatTime12h(t) {
  if (!t) return "";
  const parts = t.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return h + ":" + m + " " + suffix;
}

function formatEventWhen(ev) {
  let out = "";
  if (ev.date) {
    const d = new Date(ev.date + "T00:00:00");
    if (!isNaN(d)) {
      out += d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    } else {
      out += ev.date;
    }
  }
  let timeStr = "";
  if (ev.startTime && ev.endTime) timeStr = formatTime12h(ev.startTime) + " – " + formatTime12h(ev.endTime);
  else if (ev.startTime) timeStr = formatTime12h(ev.startTime);
  else if (ev.endTime) timeStr = "Until " + formatTime12h(ev.endTime);
  if (timeStr) out += (out ? " · " : "") + timeStr;
  return out;
}

function showError(container, message) {
  container.innerHTML = "";
  container.appendChild(el("div", { class: "notice notice-error" }, [message]));
}

function showNotice(container, message, type) {
  container.innerHTML = "";
  container.appendChild(el("div", { class: "notice notice-" + (type || "info") }, [message]));
}

/** Generates an id on the client for a brand-new record, so the same id
 *  is reused across any automatic retries of the save request — making
 *  "create" safely idempotent instead of risking a duplicate row if a
 *  retried request actually succeeds twice. */
function newClientId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

/** A vertical timeline of {time, label} items for one event, or null if
 *  the event has none. */
function renderTimeline(ev) {
  const items = Array.isArray(ev.timeline) ? ev.timeline : [];
  if (items.length === 0) return null;
  const wrap = el("div", { class: "event-timeline" });
  items.forEach((item) => {
    wrap.appendChild(el("div", { class: "timeline-row" }, [
      el("span", { class: "timeline-time" }, [formatTime12h(item.time) || item.time || ""]),
      el("span", { class: "timeline-label" }, [item.label || ""])
    ]));
  });
  return wrap;
}

/** An embedded map (no API key required) plus a link to open it in Google
 *  Maps directly, for one event's venue address — or null if the event
 *  has no address set. */
function renderMap(ev) {
  if (!ev.address) return null;
  const query = encodeURIComponent(ev.address);
  const iframe = el("iframe", {
    src: "https://www.google.com/maps?q=" + query + "&output=embed",
    class: "event-map",
    loading: "lazy",
    referrerpolicy: "no-referrer-when-downgrade"
  });
  const link = el("a", {
    href: "https://www.google.com/maps/search/?api=1&query=" + query,
    target: "_blank",
    rel: "noopener",
    class: "event-map-link"
  }, ["Open in Google Maps"]);
  return el("div", { class: "event-map-wrap" }, [iframe, link]);
}
