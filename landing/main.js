/* Open Studio · landing motion
 *
 * GSAP core + ScrollTrigger + SplitText via CDN.
 * Follows the gsap-core / gsap-plugins / gsap-scrolltrigger skills:
 *   - transform aliases (x/y/scale), autoAlpha for fade
 *   - gsap.matchMedia for prefers-reduced-motion (a11y)
 *   - SplitText for the hero headline (per-char reveal)
 *   - ScrollTrigger.batch for grid-level coordinated entrances
 *   - Pinned + scrub timeline for the big italic closer
 *   - registerPlugin once, before any plugin usage
 */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Theme toggle (persisted) ---------- */
  const THEME_KEY = "openstudio-theme";
  const html = document.documentElement;
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") html.dataset.theme = stored;

  const toggle = $("#theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = html.dataset.theme === "light" ? "dark" : "light";
      html.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }

  /* ---------- Sticky nav border on scroll ---------- */
  const nav = $("#nav");
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Smooth anchor scrolling ---------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- Year ---------- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Motion (GSAP) ---------- */
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const SplitText = window.SplitText;
  if (!gsap) return;

  // Register plugins once, before first use (per gsap-plugins / gsap-scrolltrigger skills)
  const plugins = [];
  if (ScrollTrigger) plugins.push(ScrollTrigger);
  if (SplitText) plugins.push(SplitText);
  if (plugins.length) gsap.registerPlugin(...plugins);

  gsap.defaults({ ease: "power2.out", duration: 0.7 });

  const mm = gsap.matchMedia();

  // Mark the document so CSS knows JS-driven motion is taking over
  // (lets the .split-target stay hidden only when we're really animating it).
  html.setAttribute("data-motion-ready", "");

  // Safety: even if anything below throws, never leave revealable elements
  // permanently hidden. We hide them again in the motion branch where needed.
  const safetyReveal = () => {
    gsap.set(
      ".reveal, .reveal-batch > *, [data-hero-fade], [data-hero-preview], .split-target, [data-annotation], [data-clip], [data-stage], [data-empty]",
      { autoAlpha: 1, y: 0, scale: 1, visibility: "visible", clearProps: "transform" }
    );
  };

  mm.add(
    {
      isMotion: "(prefers-reduced-motion: no-preference)",
      isReduced: "(prefers-reduced-motion: reduce)",
    },
    (ctx) => {
      const { isReduced } = ctx.conditions;

      if (isReduced) {
        safetyReveal();
        gsap.set("[data-cursor], [data-ghost]", { autoAlpha: 0 });
        return;
      }

      // Last-resort timer: if a tween is broken or never reaches the target,
      // force everything visible after 4s so users never see a blank section.
      const safetyTimer = setTimeout(safetyReveal, 4000);

      /* Hero entrance ----------------------------------------------------- */
      const heroTL = gsap.timeline();

      // 1) Headline: SplitText by chars (per gsap-plugins skill).
      const titleEl = $("[data-split='hero-title']");
      let titleSplit = null;
      if (titleEl) {
        // Always make the title visible first so a SplitText failure can never
        // leave it hidden behind .split-target's CSS visibility:hidden.
        gsap.set(titleEl, { autoAlpha: 1 });
      }
      if (SplitText && titleEl) {
        try {
          titleSplit = SplitText.create(titleEl, {
            type: "words, chars",
            charsClass: "char",
            wordsClass: "word",
            aria: "auto",
          });
          heroTL.from(
            titleSplit.chars,
            {
              autoAlpha: 0,
              yPercent: 110,
              rotateZ: 4,
              duration: 0.85,
              stagger: { each: 0.018, from: "start" },
              ease: "power3.out",
            },
            0
          );
        } catch (err) {
          titleSplit = null;
          heroTL.from(titleEl, { autoAlpha: 0, y: 24, duration: 0.7 }, 0);
        }
      } else if (titleEl) {
        heroTL.from(titleEl, { autoAlpha: 0, y: 24, duration: 0.7 }, 0);
      }

      // 2) Badge + sub + CTAs
      heroTL.from("[data-hero-fade]", {
        autoAlpha: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.12,
        ease: "power2.out",
      }, 0.15);

      // 3) Editor preview
      heroTL.from("[data-hero-preview]", {
        autoAlpha: 0,
        y: 48,
        scale: 0.985,
        duration: 0.95,
        ease: "power3.out",
      }, 0.35);

      /* Editor PRO demo: looping "drag clip in -> playhead plays" ------- */
      const proRoot = $(".preview--hero .editor-pro");
      if (proRoot) {
        const empty = proRoot.querySelector("[data-empty]");
        const stage = proRoot.querySelector("[data-stage]");
        const cursor = proRoot.querySelector("[data-cursor]");
        const ghost = proRoot.querySelector("[data-ghost]");
        const clips = proRoot.querySelectorAll("[data-clip]");
        const playhead = proRoot.querySelector("[data-playhead]");
        const tcMain = proRoot.querySelector("[data-tc]");
        const tcCanvas = proRoot.querySelector("[data-tc-canvas]");
        const playBtn = proRoot.querySelector("[data-play]");
        const tabs = Array.from(proRoot.querySelectorAll("[data-tab]"));
        const lane = proRoot.querySelector("[data-lane]");
        const recDot = proRoot.querySelector("[data-rec] svg circle:first-child");

        // Initial state: empty visible, clips hidden, playhead at start.
        gsap.set(clips, { autoAlpha: 0, scale: 0.85, transformOrigin: "left center" });
        gsap.set(stage, { autoAlpha: 0 });
        if (playhead) gsap.set(playhead, { left: "6%" });

        // Compute target absolute coords for the cursor based on lane bounds.
        const computeCursorTargets = () => {
          if (!cursor || !lane) return null;
          const rootBox = proRoot.getBoundingClientRect();
          const laneBox = lane.getBoundingClientRect();
          return {
            // start: top-right area (over the "Mas" pill)
            startX: rootBox.width - 60,
            startY: 22,
            // mid: hovering above the lane center
            laneX: laneBox.left - rootBox.left + laneBox.width * 0.18,
            laneY: laneBox.top - rootBox.top - 24,
            // drop: into lane
            dropX: laneBox.left - rootBox.left + laneBox.width * 0.18,
            dropY: laneBox.top - rootBox.top + 14,
          };
        };

        const formatTC = (sec) => {
          const s = Math.max(0, Math.floor(sec));
          const hh = String(Math.floor(s / 3600)).padStart(2, "0");
          const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
          const ss = String(s % 60).padStart(2, "0");
          return `${hh}:${mm}:${ss}`;
        };

        const buildLoop = () => {
          const t = computeCursorTargets();
          const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });

          // 0) Reset
          tl.set([clips], { autoAlpha: 0, scale: 0.85 })
            .set(stage, { autoAlpha: 0 })
            .set(empty, { autoAlpha: 1, y: 0 })
            .set(playhead, { left: "6%" })
            .set(ghost, { autoAlpha: 0, scale: 1 })
            .set(cursor, { autoAlpha: 0, x: t ? t.startX : 0, y: t ? t.startY : 0 })
            .call(() => {
              if (tcMain) tcMain.textContent = "00:00:00";
            });

          // 1) Cursor appears, swoops in
          tl.to(cursor, { autoAlpha: 1, duration: 0.4 }, 0.4)
            .to(cursor, { x: t ? t.laneX : 200, y: t ? t.laneY : 200, duration: 0.9, ease: "power2.inOut" }, "+=0.1");

          // 2) Ghost clip materializes near cursor and "drops" into the lane
          tl.set(ghost, {
            x: (t ? t.laneX : 200) - 24,
            y: (t ? t.laneY : 200) - 8,
            scale: 0.9,
          })
            .to(ghost, { autoAlpha: 1, scale: 1, duration: 0.25 })
            .to(cursor, { x: t ? t.dropX : 200, y: t ? t.dropY : 220, duration: 0.5, ease: "power2.in" })
            .to(ghost, { x: (t ? t.dropX : 200) - 24, y: (t ? t.dropY : 220) - 6, duration: 0.5, ease: "power2.in" }, "<")
            .to(ghost, { autoAlpha: 0, scale: 0.92, duration: 0.2 });

          // 3) Empty state hides; real clips and stage appear
          tl.to(empty, { autoAlpha: 0, y: -8, duration: 0.4 }, "<")
            .to(stage, { autoAlpha: 1, duration: 0.5 }, "<")
            .to(clips, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "power3.out" }, "<");

          // 4) Cursor flies away
          tl.to(cursor, { autoAlpha: 0, x: "+=80", y: "-=40", duration: 0.5 }, "+=0.1");

          // 5) Playback: playhead glides + timecode counter ticks
          const counter = { v: 0 };
          tl.to(playhead, { left: "94%", duration: 5.5, ease: "none" }, "-=0.2")
            .to(
              counter,
              {
                v: 24,
                duration: 5.5,
                ease: "none",
                onUpdate: () => {
                  if (tcMain) tcMain.textContent = formatTC(counter.v);
                  if (tcCanvas) tcCanvas.textContent = `${formatTC(counter.v)} / 00:24:00`;
                },
              },
              "<"
            );

          return tl;
        };

        let demoTL = buildLoop();

        // Rebuild on resize so the cursor coords stay accurate.
        let rAF;
        window.addEventListener("resize", () => {
          cancelAnimationFrame(rAF);
          rAF = requestAnimationFrame(() => {
            demoTL.kill();
            demoTL = buildLoop();
          });
        }, { passive: true });

        // Tab highlight cycles across PISTAS.
        const trackTabs = tabs.filter((el) => /Video|Audio|Texto|Fondo/.test(el.textContent || ""));
        if (trackTabs.length) {
          let i = 0;
          gsap.to({}, {
            duration: 1.6,
            repeat: -1,
            onRepeat: () => {
              trackTabs.forEach((el) => el.classList.remove("is-active"));
              i = (i + 1) % trackTabs.length;
              trackTabs[i].classList.add("is-active");
            },
          });
        }

        // Subtle pulse on the play button.
        if (playBtn) {
          gsap.to(playBtn, { scale: 1.06, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true, transformOrigin: "50% 50%" });
        }
        // Slow pulse on the REC indicator dot.
        if (recDot) {
          gsap.to(recDot, { opacity: 0.35, duration: 0.9, ease: "sine.inOut", repeat: -1, yoyo: true });
        }
      }

      if (!ScrollTrigger) return;

      /* Hero parallax on the editor preview ------------------------------ */
      gsap.to("[data-hero-preview]", {
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      /* Generic .reveal: fade + lift on enter ---------------------------- *
       * Use fromTo (not from) because gsap.from reads current style as the
       * target; if any CSS or earlier set leaves opacity at 0, the tween
       * goes 0 -> 0 and the element never appears. fromTo is explicit.
       */
      $$(".reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          }
        );
      });

      /* Section titles (non-hero): subtle in-view fade ------------------- */
      $$(".section-title").forEach((el) => {
        if (el.matches(".hero__title, .closer__word, [data-split]")) return;
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          }
        );
      });

      /* Reveal grids using ScrollTrigger.batch (per gsap-scrolltrigger) -- */
      $$(".reveal-batch").forEach((parent) => {
        const items = Array.from(parent.children);
        if (!items.length) return;
        // Hide items first so batched callbacks animate them in.
        gsap.set(items, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(items, {
          start: "top 88%",
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              stagger: { each: 0.08, from: "start" },
              ease: "power3.out",
              overwrite: true,
            });
          },
        });
      });

      /* Editor screenshot: figure entrance + annotations stagger --------- */
      const screenshot = $("[data-screenshot]");
      if (screenshot) {
        const annotations = $$("[data-annotation]", screenshot);
        gsap.set(annotations, { autoAlpha: 0, scale: 0.85, transformOrigin: "left center" });
        gsap.fromTo(
          screenshot,
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: screenshot, start: "top 90%", once: true },
          }
        );
        ScrollTrigger.create({
          trigger: screenshot,
          start: "top 70%",
          once: true,
          onEnter: () => {
            gsap.to(annotations, {
              autoAlpha: 1,
              scale: 1,
              duration: 0.55,
              stagger: { each: 0.12, from: "start" },
              ease: "back.out(1.6)",
            });
          },
        });
      }

      /* Phone mockup parallax -------------------------------------------- */
      const phone = $(".phone");
      if (phone) {
        gsap.from(phone, {
          y: 60,
          rotateZ: -2,
          autoAlpha: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: phone, start: "top 90%", once: true },
        });
        gsap.to(phone, {
          y: -30,
          ease: "none",
          scrollTrigger: {
            trigger: phone,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7,
          },
        });
      }

      /* Closer: pinned scrub timeline that scales the big italic word ---- */
      const closer = $("#closer");
      const closerWord = $("#closer-word");
      if (closer && closerWord) {
        gsap.set(closerWord, { autoAlpha: 1, transformOrigin: "50% 50%" });
        const closerTL = gsap.timeline({
          scrollTrigger: {
            trigger: closer,
            start: "top top",
            end: "+=120%",
            scrub: 0.8,
            pin: true,
          },
        });
        closerTL
          .fromTo(
            closerWord,
            { scale: 0.85, yPercent: 8, letterSpacing: "-0.02em" },
            { scale: 1.04, yPercent: 0, letterSpacing: "-0.05em", ease: "none" },
            0
          )
          .fromTo(
            ".closer__sub, .closer__cta",
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, ease: "none", stagger: 0.05 },
            0.4
          );
      }

      /* Cleanup if matchMedia tears down (theme rebuild on resize, etc.) */
      return () => {
        clearTimeout(safetyTimer);
        if (titleSplit && titleSplit.revert) titleSplit.revert();
      };
    }
  );

  /* Refresh ScrollTrigger after fonts load to avoid layout shift miscalcs */
  if (document.fonts && document.fonts.ready && ScrollTrigger) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
