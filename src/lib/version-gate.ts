/**
 * Self-healing stale-cache guard.
 *
 * GitHub Pages serves index.html with `cache-control: max-age=600` and we have
 * no way to change that header. Asset filenames are content-hashed, so the only
 * thing that can go stale is the HTML — but a stale HTML pins the browser to an
 * old JS bundle, so a visitor can keep seeing a version we replaced.
 *
 * On load we fetch a tiny version file with `cache: 'no-store'`. If the build id
 * baked into this bundle doesn't match the deployed one, we reload once against
 * a cache-busting URL, which forces a fresh HTML fetch.
 *
 * The sessionStorage guard is what stops this from becoming a reload loop: we
 * record the build we already reloaded for, so a failed attempt is never retried
 * in the same tab.
 */
const KEY = 'zs_reloaded_for_build'

export function checkForNewBuild() {
  if (typeof window === 'undefined') return
  fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then((data: { build?: string } | null) => {
      const deployed = data?.build
      if (!deployed || deployed === __BUILD_ID__) return
      if (sessionStorage.getItem(KEY) === deployed) return // already tried — don't loop
      sessionStorage.setItem(KEY, deployed)
      const url = new URL(window.location.href)
      url.searchParams.set('v', deployed)
      window.location.replace(url.toString())
    })
    .catch(() => { /* offline or blocked — never break the page over this */ })
}
