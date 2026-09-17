# Ahmed & Mahmooda's Wedding Site

A free, fully working wedding website: a photo welcome page, an RSVP flow that
walks each guest through only the events they're invited to, an agenda page,
a gifts page, and a passcode-protected admin panel. Nothing here requires a
paid host, database, or domain (though you can add a custom domain later if
you want).

## How it's built

- **Frontend** (the site people see): plain HTML/CSS/JS — `index.html`,
  `rsvp.html`, `agenda.html`, `gifts.html`, `admin.html`, `style.css`,
  `app.js`. Host it free on GitHub Pages, Netlify, Cloudflare Pages, or
  Vercel.
- **Backend** (where guest/RSVP data actually lives): a Google Sheet plus a
  small Google Apps Script "Web App" (`Code.gs`). This is free, has no
  server to maintain, and doubles as a way for you to peek at the raw data
  in spreadsheet form any time, in addition to the admin panel.

The admin panel and the Sheet **both** show you the full guest list and RSVP
status — the admin panel is just a nicer interface for editing the same data
that's sitting in the Sheet.

## 1. Deploy the backend (Google Apps Script) — do this first

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like "Wedding RSVPs".
2. In the sheet, go to **Extensions > Apps Script**.
3. Delete any starter code in the editor, then paste in the entire contents
   of `Code.gs` from this folder.
4. Near the top of the pasted code, find this line:
   ```js
   var ADMIN_PASSCODE = "CHANGE-ME-1234";
   ```
   Replace `CHANGE-ME-1234` with your own real passcode. This is the only
   password protecting your admin panel, so pick something only you (and
   whoever else needs admin access) knows.
5. Click **Deploy > New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Description: anything, e.g. "wedding site backend".
   - Execute as: **Me**.
   - Who has access: **Anyone**. (This has to be "Anyone" so guests who
     aren't signed into Google can RSVP — this does *not* expose your Sheet
     itself, only the specific actions this script allows.)
   - Click **Deploy**. Google will ask you to authorize the script — approve
     it (it's your own script, running in your own account).
6. Copy the **Web app URL** you're given. It looks like:
   `https://script.google.com/macros/s/AKfycb..../exec`

That's your entire backend, live.

## 2. Point the site at your backend

Open `app.js` and replace this line:
```js
var API_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```
with the URL you copied, e.g.:
```js
var API_URL = "https://script.google.com/macros/s/AKfycb..../exec";
```

## 3. Add your welcome photo

Put your photo in this same folder, named exactly `welcome.jpg` (or edit the
`src="welcome.jpg"` in `index.html` if your file has a different name/extension,
like `.png`). If the file is missing, the homepage still works — it just shows
a plain placeholder panel instead of breaking.

If you'd like guests to be able to contribute toward your Hajj/honeymoon
fund online (Venmo, Zelle, PayPal, etc.), open `gifts.html` and fill in the
commented-out section with your details — it's left blank by default, so
the page only mentions the card box at the wedding until you add one.

## 4. Host the site for free

Any of these work well; pick whichever feels easiest:

**Netlify (easiest, drag-and-drop):**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag this whole folder (minus `Code.gs` and this README — they don't need
   to be uploaded, but it's harmless if they are) onto the page.
3. You'll get a live `https://your-site-name.netlify.app` URL instantly.

**GitHub Pages:**
1. Create a new GitHub repository and upload these files to it.
2. Go to the repo's **Settings > Pages**, set "Source" to your main branch,
   root folder.
3. GitHub gives you a `https://yourname.github.io/reponame/` URL.

**Cloudflare Pages / Vercel** work the same way (connect a repo or drag a
folder) if you prefer either of those.

## 5. Add your guests and events

Visit `admin.html` on your live site and enter your passcode.

- **Events tab**: add each event (Mehndi/Dholki/Haldi, Nikkah/Shaadi,
  Walimah, etc.) with its date, start time (and optionally an end time),
  location, and an **Order** number — guests invited to multiple events
  RSVP through them in this order, one at a time, ending with a
  thank-you page.
- **Guests tab**: add each guest with their first/last name, an optional
  phone number, how many additional people they're allowed to
  bring (plus-ones), and which events they're invited to. Guests only ever
  see the events you've checked for them.

### About the same-name failsafe

If two guests share the exact same first and last name, the site won't let
either of them just click through — it asks for the phone number you
entered for that guest in the admin panel before showing anyone's
RSVP. If you leave that blank for guests who might collide with someone
else's name, that check can't distinguish them, so it's worth filling in
contact info for anyone who shares a name with another guest on your list.

## Getting an email when someone RSVPs

If you'd like to know right away whenever a guest submits or changes an
RSVP — who it was, what they answered, and the event's updated totals —
open `Code.gs` and fill in the `NOTIFY_EMAILS` list near the top:

```js
var NOTIFY_EMAILS = ["you@example.com", "partner@example.com"];
```

Leave it as `[]` (the default) to turn this off entirely. It sends from
your own Google account via Apps Script's built-in mail service — no
extra setup, no cost — and a failed email can never block or break a
guest's actual RSVP; if the email doesn't go out for some reason, the
RSVP itself still saves normally.

One limit worth knowing: free Gmail accounts get **100 email recipients
per day** total from Apps Script (a Workspace/paid Google account gets
1,500/day). Each address in `NOTIFY_EMAILS` counts per email sent, so
with 2 addresses configured, ~50 RSVPs in a single day would use up the
day's quota — past that, notification emails silently stop until the
quota resets the next day. This is very unlikely to matter for guests
trickling in over weeks, but could come up right after you first send
invitations and everyone RSVPs at once. Either way, nothing is lost —
it only affects the notification emails, never the RSVPs themselves,
which you can always see in full in the admin panel or the Sheet.

**About text messages**: there's no free, reliable way to do this as of
2026 — the old "email a phone number to text it" trick that used to work
for free is dead or dying for the major US carriers (AT&T shut theirs
down in 2025, T-Mobile stopped in 2024, Verizon is mid-shutdown), so it's
not something this site relies on. A real SMS provider (like Twilio) can
send actual texts for about a cent each, but needs its own paid account
and a bit of setup — ask if you'd like that added.

## Notes & limits worth knowing

- The admin passcode lives in the Apps Script code (server-side), not just
  in the browser, so it's checked on every admin action — but it's still a
  single shared password, not per-admin accounts. Don't share the passcode
  publicly.
- Plus-one limits are enforced on the server: even if someone tampers with
  the page in their browser, the backend caps their headcount at what
  you've allotted them, and rejects (rather than silently trims) an RSVP
  that asks for more than they're allotted.
- A guest has to look themselves up again each time they open the RSVP or
  Agenda page — nothing is remembered across page visits or devices, by
  design, so a "logged in" guest can't be left signed in on a shared or
  public computer. Their previous answers are always there either way,
  since those are saved on the server the moment they're submitted.
- Google Sheets comfortably handles guest lists into the many hundreds; if
  you ever have thousands of guests, you'd want a different backend, but
  that's unlikely for a wedding.

## Customizing further

- Colors, fonts, and spacing are all in `style.css` under the `:root`
  variables near the top.
- Couple names and headline copy are plain text in `index.html`,
  `rsvp.html`, and `agenda.html` — edit them directly.
- Want a countdown, a gift registry link, or driving directions on the
  homepage? Those are easy additions to `index.html` — just ask and I can
  add them.
