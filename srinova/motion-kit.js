/*
 * motion-kit.js: drop-in premium motion for static HTML, built on Motion v13 (window.Motion).
 *
 * <head>:
 *   <style>.mk [data-reveal],.mk [data-split],.mk [data-stagger]>*{opacity:0}</style>
 *   <script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('mk');setTimeout(function(){if(!window.MotionKit)document.documentElement.classList.remove('mk')},2500)}</script>
 * end of <body>:
 *   <script src="https://cdn.jsdelivr.net/npm/motion@13.4.6/dist/motion.js"></script>
 *   <script src="motion-kit.js"></script>
 *
 * Attributes:
 *   data-reveal="up|down|left|right|fade|scale|clip"  data-delay="0.2"
 *   data-stagger (on a parent)                          children reveal in sequence
 *   data-split                                          headline reveals word by word
 *   data-parallax="0.15"                                scroll-linked drift (desktop only)
 *   data-count="1250" data-prefix="₹" data-suffix="+"   counts up once, en-IN grouping
 *   data-progress                                       scaleX 0 to 1 with page scroll
 *   data-magnetic                                       button leans toward the cursor
 *   data-tilt                                           card tilts in 3D under the cursor
 *   data-marquee="30"                                   infinite loop, seconds per cycle, pauses on hover
 */
(function () {
    var M = window.Motion
    var root = document.documentElement
    if (!M) return root.classList.remove("mk")

    var ease = [0.22, 1, 0.36, 1]
    var spring = { type: "spring", visualDuration: 0.5, bounce: 0.15 }
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    var desktop = matchMedia("(hover: hover) and (min-width: 768px)").matches
    var $ = function (s) { return document.querySelectorAll(s) }

    var from = {
        up: { opacity: [0, 1], y: [32, 0] },
        down: { opacity: [0, 1], y: [-32, 0] },
        left: { opacity: [0, 1], x: [-40, 0] },
        right: { opacity: [0, 1], x: [40, 0] },
        fade: { opacity: [0, 1] },
        scale: { opacity: [0, 1], scale: [0.94, 1] },
        clip: { opacity: [1, 1], clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] },
    }

    // Fire fn once when el enters the viewport.
    function once(el, fn, amount) {
        var stop = M.inView(el, function () { fn(); stop() }, { amount: amount || 0.25 })
    }

    function formatCount(el, v) {
        var dp = +(el.dataset.decimals || 0)
        return (el.dataset.prefix || "") +
            v.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp }) +
            (el.dataset.suffix || "")
    }

    function init() {
        root.classList.remove("mk")
        if (reduce) {
            $("[data-count]").forEach(function (el) { el.textContent = formatCount(el, +el.dataset.count) })
            return
        }
        root.classList.add("mk")

        $("[data-split]").forEach(function (el) {
            var words = el.textContent.trim().split(/\s+/)
            el.setAttribute("aria-label", el.textContent.trim())
            el.innerHTML = words.map(function (w) {
                return '<span aria-hidden="true" style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:0.08em"><span style="display:inline-block">' + w + "</span></span>"
            }).join(" ")
            el.style.opacity = 1
            var inner = el.querySelectorAll("span > span")
            M.animate(inner, { y: ["110%", "0%"] }, { duration: 0 })
            once(el, function () {
                M.animate(inner, { y: ["110%", "0%"] }, { duration: 0.9, ease: ease, delay: M.stagger(0.06, { startDelay: +(el.dataset.delay || 0) }) })
            })
        })

        $("[data-reveal]").forEach(function (el) {
            var kf = from[el.dataset.reveal] || from.up
            once(el, function () {
                M.animate(el, kf, { duration: 0.8, ease: ease, delay: +(el.dataset.delay || 0) })
            })
        })

        $("[data-stagger]").forEach(function (el) {
            once(el, function () {
                M.animate(Array.prototype.slice.call(el.children), from.up, { duration: 0.7, ease: ease, delay: M.stagger(+(el.dataset.stagger || 0.08)) })
            }, 0.15)
        })

        $("[data-count]").forEach(function (el) {
            el.textContent = formatCount(el, 0)
            once(el, function () {
                M.animate(0, +el.dataset.count, {
                    duration: +(el.dataset.duration || 1.8),
                    ease: ease,
                    onUpdate: function (v) { el.textContent = formatCount(el, v) },
                })
            }, 0.6)
        })

        $("[data-progress]").forEach(function (el) {
            el.style.transformOrigin = "0 50%"
            M.scroll(M.animate(el, { scaleX: [0, 1] }, { ease: "linear" }))
        })

        $("[data-marquee]").forEach(function (el) {
            el.style.overflow = "hidden"
            var track = document.createElement("div")
            track.style.cssText = "display:flex;width:max-content;gap:inherit"
            track.innerHTML = el.innerHTML + el.innerHTML
            Array.prototype.slice.call(track.children, track.children.length / 2)
                .forEach(function (c) { c.setAttribute("aria-hidden", "true") })
            el.innerHTML = ""
            el.appendChild(track)
            var loop = M.animate(track, { x: ["0%", "-50%"] }, { duration: +(el.dataset.marquee || 30), ease: "linear", repeat: Infinity })
            M.hover(el, function () { loop.pause(); return function () { loop.play() } })
        })

        if (!desktop) return

        $("[data-parallax]").forEach(function (el) {
            var d = (+el.dataset.parallax || 0.15) * 200
            M.scroll(M.animate(el, { y: [-d, d] }, { ease: "linear" }), { target: el, offset: ["start end", "end start"] })
        })

        $("[data-magnetic]").forEach(function (el) {
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect()
                M.animate(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3 }, spring)
            })
            el.addEventListener("pointerleave", function () { M.animate(el, { x: 0, y: 0 }, spring) })
        })

        $("[data-tilt]").forEach(function (el) {
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect()
                var px = (e.clientX - r.left) / r.width - 0.5
                var py = (e.clientY - r.top) / r.height - 0.5
                M.animate(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, scale: 1.02 }, spring)
            })
            el.addEventListener("pointerleave", function () { M.animate(el, { rotateX: 0, rotateY: 0, scale: 1 }, spring) })
        })
    }

    window.MotionKit = { ease: ease, spring: spring, init: init }
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init()
})()
