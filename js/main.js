(function () {
  "use strict";

  function initCloudinaryAssets() {
    var root = document.documentElement;
    if (!root) return;

    var cloudName = root.getAttribute("data-cloudinary-cloud") || "";
    if (!cloudName) return;

    var prefix = root.getAttribute("data-cloudinary-prefix") || "nlc-site";
    var CLOUDINARY_HOST = "https://res.cloudinary.com/" + cloudName + "/image/upload/";

    function encodePublicId(publicId) {
      // Cloudinary expects path segments URL-encoded but keeps slashes.
      return publicId
        .split("/")
        .map(function (seg) {
          return encodeURIComponent(seg);
        })
        .join("/");
    }

    function stripExtension(path) {
      // Remove the last file extension: "a/b/c.jpg" -> "a/b/c"
      return path.replace(/\.[a-zA-Z0-9]+$/, "");
    }

    function localAssetPathFromUrl(url) {
      if (!url) return null;

      // Handle absolute URLs (including file://), and plain relative ones.
      try {
        var resolved = new URL(url, window.location.href);
        var pathname = resolved.pathname || "";
        var idx = pathname.lastIndexOf("/assets/");
        if (idx === -1) return null;
        return pathname.slice(idx + "/assets/".length);
      } catch (e) {
        // Relative like "../assets/Gallery1/1.jpg"
        var marker = "assets/";
        var pos = url.indexOf(marker);
        if (pos === -1) return null;
        return url.slice(pos + marker.length);
      }
    }

    function cloudinaryUrlFromLocalAssetUrl(url, opts) {
      var rel = localAssetPathFromUrl(url);
      if (!rel) return null;

      // Convert encoded paths and normalise gallery folders to match Cloudinary:
      //   assets/Gallery1/..., Gallery2/..., Gallery3/...  ->  home/Gallery/...
      //   assets/Logo/...                                ->  home/Logo/...
      var decoded = rel;
      try {
        decoded = decodeURIComponent(rel);
      } catch (e) {
        decoded = rel;
      }

      // Normalise gallery folders into a single "Gallery" folder under the prefix.
      if (decoded.indexOf("Gallery1/") === 0) {
        decoded = "Gallery/" + decoded.slice("Gallery1/".length);
      } else if (decoded.indexOf("Gallery2/") === 0) {
        decoded = "Gallery/" + decoded.slice("Gallery2/".length);
      } else if (decoded.indexOf("Gallery3/") === 0) {
        decoded = "Gallery/" + decoded.slice("Gallery3/".length);
      }

      var publicId = prefix + "/" + stripExtension(decoded);
      var encodedPublicId = encodePublicId(publicId);

      var transforms = ["f_auto", "q_auto"];
      if (opts && opts.w) transforms.push("w_" + String(opts.w));
      if (opts && opts.h) transforms.push("h_" + String(opts.h));
      if (opts && (opts.w || opts.h)) transforms.push("c_fill");

      return (
        CLOUDINARY_HOST + transforms.join(",") + "/" + encodedPublicId
      );
    }

    function attachCloudinaryFallback(img) {
      if (!img) return;
      // Avoid clobbering other handlers.
      if (img.__nlcCloudFallbackAttached) return;
      img.__nlcCloudFallbackAttached = true;

      img.addEventListener(
        "error",
        function () {
          var local = img.getAttribute("data-local-src") || img.dataset.localSrc || "";
          if (!local) return;

          // Only fall back if we're currently pointing at Cloudinary.
          var current = img.currentSrc || img.src || "";
          if (current.indexOf(CLOUDINARY_HOST) === -1) return;

          // Prevent loops if local is missing too.
          img.__nlcCloudFallbackAttached = false;
          img.src = local;
        },
        { once: false }
      );
    }

    function rewriteImg(el) {
      if (!el) return;
      var src = el.getAttribute("src") || "";
      if (!src) return;

      var wAttr = el.getAttribute("width");
      var hAttr = el.getAttribute("height");
      var w = wAttr ? parseInt(wAttr, 10) : null;
      var h = hAttr ? parseInt(hAttr, 10) : null;

      var cld = cloudinaryUrlFromLocalAssetUrl(src, { w: w, h: h });
      if (!cld) return;

      // Keep the local URL as a fallback in case Cloudinary image is missing.
      el.setAttribute("data-local-src", src);
      attachCloudinaryFallback(el);
      el.src = cld;
    }

    function rewriteLightboxTrigger(btn) {
      if (!btn) return;
      var full = btn.getAttribute("data-full");
      if (!full) return;
      var cld = cloudinaryUrlFromLocalAssetUrl(full, null);
      if (!cld) return;
      btn.setAttribute("data-local-full", full);
      btn.setAttribute("data-full", cld);
    }

    // Always rewrite to Cloudinary – repo may not ship the assets folder.
    document.querySelectorAll("img").forEach(function (img) {
      rewriteImg(img);
    });

    document.querySelectorAll("[data-lightbox][data-full]").forEach(function (btn) {
      rewriteLightboxTrigger(btn);
    });
  }

  function initSitePreloader() {
    var el = document.getElementById("site-preloader");
    if (!el) return;

    // Only show on homepage: first visit (per session) or a homepage refresh.
    var path = window.location.pathname || "";
    var isHome = path === "/" || path === "" || /\/index\.html$/.test(path);
    if (!isHome) {
      if (el.parentNode) el.parentNode.removeChild(el);
      return;
    }

    var nav = (performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || null;
    var isReload = nav && nav.type === "reload";
    var seenKey = "nlc_preloader_seen";
    var hasSeen = false;
    try {
      hasSeen = window.sessionStorage.getItem(seenKey) === "1";
    } catch (e) {
      hasSeen = false;
    }

    if (!isReload && hasSeen) {
      if (el.parentNode) el.parentNode.removeChild(el);
      return;
    }

    try {
      window.sessionStorage.setItem(seenKey, "1");
    } catch (e) {
      // ignore
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (el.parentNode) el.parentNode.removeChild(el);
      document.documentElement.classList.remove("preloader-active");
      document.body.style.overflow = "";
      return;
    }

    var root = document.documentElement;
    root.classList.add("preloader-active");
    document.body.style.overflow = "hidden";

    var lines = Array.prototype.slice.call(el.querySelectorAll(".site-preloader__line"));
    var words = ["Faith", "Hope", "Love", "New Beginnings", "Welcome Home"];
    var label = document.getElementById("site-preloader-label");

    // Ensure we always have exactly one visible line at a time.
    lines.forEach(function (line, i) {
      line.textContent = words[i] || "";
      line.classList.toggle("is-active", false);
    });

    function cleanup() {
      if (el.parentNode) el.parentNode.removeChild(el);
      root.classList.remove("preloader-active");
      document.body.style.overflow = "";
    }

    function beginExit() {
      el.classList.add("site-preloader--exit");
      window.setTimeout(cleanup, 580);
    }

    // Logo fades in first.
    requestAnimationFrame(function () {
      el.classList.add("site-preloader--ready");
    });

    // Calm pacing, still short (adds a few seconds).
    var startWordsAt = 650;
    var staggerMs = 520;
    var holdAfterLastMs = 750;

    window.setTimeout(function () {
      function show(i) {
        lines.forEach(function (line, j) {
          line.classList.toggle("is-active", j === i);
        });
        if (label && words[i] !== undefined) label.textContent = words[i];

        if (i < Math.min(words.length, lines.length) - 1) {
          window.setTimeout(function () {
            show(i + 1);
          }, staggerMs);
        } else {
          window.setTimeout(beginExit, holdAfterLastMs);
        }
      }

      show(0);
    }, startWordsAt);
  }

  function getCurrentPage() {
    var path = window.location.pathname || "";
    if (path === "/" || path === "") return "index.html";
    var segments = path.split("/").filter(function (s) {
      return s.length > 0;
    });
    var last = segments[segments.length - 1] || "";
    if (!last || last.indexOf(".") === -1) return "index.html";
    return last;
  }

  function hrefBasename(href) {
    if (!href || href.charAt(0) === "#") return null;
    var clean = href.split("#")[0];
    var parts = clean.split("/");
    var name = parts[parts.length - 1];
    return name || null;
  }

  function initActiveNav() {
    var current = getCurrentPage();
    document.querySelectorAll(".nav__link").forEach(function (link) {
      var page = hrefBasename(link.getAttribute("href"));
      if (!page) return;
      link.classList.toggle("is-active", page === current);
    });
  }

  function initFooterYear() {
    document.querySelectorAll("[data-footer-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var hero = document.querySelector(".hero") || document.querySelector(".page-hero");
    if (hero) header.classList.add("site-header--hero");

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (y > 24) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initNavToggle() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    var header = document.querySelector(".site-header");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (header) header.classList.toggle("nav-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });

    nav.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        if (header) header.classList.remove("nav-open");
        document.body.style.overflow = "";
      });
    });
  }

  function initReveal() {
    if (!window.IntersectionObserver) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    document.querySelectorAll(".reveal").forEach(function (el) {
      observer.observe(el);
    });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        var id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initGalleryLightbox() {
    var lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    var img = lightbox.querySelector(".lightbox__img");
    var closeBtn = lightbox.querySelector(".lightbox__close");
    var prevBtn = lightbox.querySelector(".lightbox__prev");
    var nextBtn = lightbox.querySelector(".lightbox__next");
    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
    var currentIndex = 0;

    function itemSrc(btn) {
      var full = btn.getAttribute("data-full");
      if (full) return full;
      var im = btn.querySelector("img");
      return im ? im.src : "";
    }

    function itemLocalSrc(btn) {
      var full = btn.getAttribute("data-local-full");
      if (full) return full;
      var im = btn.querySelector("img");
      if (!im) return "";
      return im.getAttribute("data-local-src") || im.getAttribute("src") || "";
    }

    function itemAlt(btn) {
      var im = btn.querySelector("img");
      return im ? im.getAttribute("alt") || "" : "";
    }

    function showIndex(index) {
      if (!triggers.length) return;
      currentIndex = (index + triggers.length) % triggers.length;
      var btn = triggers[currentIndex];
      img.dataset.localSrc = itemLocalSrc(btn) || "";
      img.src = itemSrc(btn);
      img.alt = itemAlt(btn);
    }

    function openAt(index) {
      currentIndex = index;
      showIndex(currentIndex);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        img.focus();
      });
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      img.removeAttribute("src");
    }

    // If Cloudinary 404s, fall back to the local asset URL.
    if (img) {
      img.addEventListener("error", function () {
        var local = img.dataset.localSrc || "";
        if (!local) return;
        var current = img.currentSrc || img.src || "";
        // Only fall back when Cloudinary is the failing src.
        if (current.indexOf("https://res.cloudinary.com/") !== 0) return;
        img.src = local;
      });
    }

    triggers.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        openAt(i);
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn)
      prevBtn.addEventListener("click", function () {
        showIndex(currentIndex - 1);
      });
    if (nextBtn)
      nextBtn.addEventListener("click", function () {
        showIndex(currentIndex + 1);
      });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        showIndex(currentIndex + 1);
      }
    });
  }

  function initContactForm() {
    var form = document.querySelector(".contact-form");
    if (!form) return;

    var success = document.querySelector(".form-success");
    var endpoint = form.getAttribute("action") || "";
    var isFormspree = endpoint.indexOf("formspree.io") !== -1;
    if (!isFormspree) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var subjectInput = form.querySelector('input[name="_subject"]');
      var prayerField = form.querySelector('textarea[name="prayer_request"]');
      if (subjectInput && prayerField) {
        var hasPrayer = prayerField.value.replace(/\s/g, "").length > 0;
        subjectInput.value = hasPrayer
          ? "Prayer request — New Life City Church website"
          : "New message — New Life City Church website";
      }

      var data = new FormData(form);

      fetch(endpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (!res || !res.ok) throw new Error("Form submission failed");
          if (success) {
            success.classList.add("is-visible");
            success.focus();
            var smoothScroll = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            success.scrollIntoView({ block: "nearest", behavior: smoothScroll ? "smooth" : "auto" });
          }
          form.reset();
        })
        .catch(function () {
          // If Formspree is blocked or offline, fall back to normal submit.
          form.submit();
        });
    });
  }

  function initBackToTop() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML =
      '<span aria-hidden="true" style="display:block;margin-top:-2px">↑</span>';
    document.body.appendChild(btn);

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      btn.classList.toggle("is-visible", y > 480);
    }

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  initSitePreloader();
  initCloudinaryAssets();
  initFooterYear();
  initActiveNav();
  initHeader();
  initNavToggle();
  initReveal();
  initSmoothAnchors();
  initGalleryLightbox();
  initContactForm();
  initBackToTop();
})();
