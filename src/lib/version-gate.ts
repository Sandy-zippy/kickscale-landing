/**
 * Self-healing stale-cache guard.
 *
 * GitHub Pages serves index.html with `cache-control: max-age=600` and we have
 * no way to change that header. Asset filenames are content-hashed, so the only
 * thing that can go stale is the HTML — but a stale HTML pins the browser to an
 * old JS bundle, so a visitor can keep seeing a version we replaced.
 *
 * We fetch a tiny version file with `cache: 'no-store'`; if the build baked into
 * this bundle doesn't match the deployed one, we force a fresh HTML fetch.
 *
 * ── Why the reload targets "/" and not the current path ──────────────────────
 * The first version of this file reloaded to `<current path>?v=<build>`. That
 * silently failed on every route except "/": GitHub Pages has no file at
 * /growth, so it serves 404.html, which redirects to "/" — *dropping the query
 * string*. The browser then served "/" from cache again, the guard saw the same
 * mismatch, and the loop protection ("already tried this build") pinned the tab
 * to the stale bundle for the rest of the session. Refreshing could not fix it.
 *
 * So: always bust "/" (a real file, and the only document GitHub Pages serves),
 * and stash the current path in the same sessionStorage key 404.html uses, so
 * main.tsx restores the route after the reload.
 *
 * ── Why attempts are counted, not latched ────────────────────────────────────
 * A single boolean latch turns any failed attempt into a permanent stale pin.
 * We allow a couple of tries per build instead, which still cannot loop.
 */
const KEY = 'zs_build_reload_attempts'
const SPA_PATH_KEY = 'zippy_spa_path'
const MAX_ATTEMPTS = 2

function readAttempts(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function bumpAttempts(build: string) {
  try {
    const map = readAttempts()
    map[build] = (map[build] ?? 0) + 1
    sessionStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* storage blocked — the fetch below still helps, we just can't rate-limit */
  }
}

async function runCheck() {
  let deployed: string | undefined
  try {
    const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return
    deployed = ((await res.json()) as { build?: string })?.build
  } catch {
    return // offline or blocked — never break the page over this
  }

  if (!deployed || deployed === __BUILD_ID__) return
  if ((readAttempts()[deployed] ?? 0) >= MAX_ATTEMPTS) return
  bumpAttempts(deployed)

  // Remember where the visitor actually is; 404.html uses this same key and
  // main.tsx restores it on the next load.
  try {
    const here = window.location.pathname + window.location.search + window.location.hash
    if (here !== '/') sessionStorage.setItem(SPA_PATH_KEY, here)
  } catch {
    /* ignore */
  }

  // Refresh the cached copy of the root document before navigating to it, so
  // even the redirect path lands on fresh HTML.
  try {
    await fetch('/index.html', { cache: 'reload' })
  } catch {
    /* best effort */
  }

  window.location.replace(`${window.location.origin}/?v=${deployed}`)
}

export function checkForNewBuild() {
  if (typeof window === 'undefined') return
  void runCheck()

  // An already-open tab never re-runs boot code, so a visitor sitting on the
  // page through a deploy would keep the old build indefinitely. Re-check when
  // they come back to the tab.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void runCheck()
  })
}
