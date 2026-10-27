// ==UserScript==
// @name         Enhanced Amazon Storefront
// @namespace    https://github.com/uvw/enhanced-amazon-storefront
// @version      0.1.1
// @description  Fixes small annoyances on the Amazon storefront. Add to cart no longer leaves the product page.
// @author       Max Kostovetski
// @license      MIT OR Apache-2.0
// @homepageURL  https://github.com/uvw/enhanced-amazon-storefront
// @supportURL   https://github.com/uvw/enhanced-amazon-storefront/issues
// @updateURL    https://raw.githubusercontent.com/uvw/enhanced-amazon-storefront/main/enhanced-amazon-storefront.user.js
// @downloadURL  https://raw.githubusercontent.com/uvw/enhanced-amazon-storefront/main/enhanced-amazon-storefront.user.js
// @match        https://www.amazon.com/*
// @match        https://www.amazon.ca/*
// @match        https://www.amazon.com.mx/*
// @match        https://www.amazon.co.uk/*
// @match        https://www.amazon.de/*
// @match        https://www.amazon.fr/*
// @match        https://www.amazon.it/*
// @match        https://www.amazon.es/*
// @match        https://www.amazon.nl/*
// @match        https://www.amazon.com.au/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  // Stay on page after Add to cart

  // Product page add-to-cart buttons, including the one-time and subscribe
  // variants. Buy Now is `submit.buy-now` and never matches.
  const ATC_SELECTOR =
    'input[name^="submit.add-to-cart"], button[name^="submit.add-to-cart"]';
  const SUCCESS_SELECTOR = [
    "#NATC_SMART_WAGON_CONF_MSG_SUCCESS",
    "#sw-atc-confirmation",
    "#huc-v2-order-row-confirm-text",
    "#attachDisplayAddBaseAlert",
  ].join(", ");
  // The sidebar caches its HTML here. A stale copy would come back on
  // back/forward navigation.
  const EWC_CACHE_KEYS = [
    "EWCBrowserCacheValue",
    "EWCBrowserCacheKey",
    "EWCBrowserCacheExpiry",
  ];
  const TOAST_MS = 6000;

  const pending = new WeakSet();
  const passThrough = new WeakSet();

  // Capture on window runs before any of Amazon's handlers, which would
  // otherwise submit the form.
  window.addEventListener("click", onClick, true);

  function onClick(event) {
    const button =
      event.target instanceof Element && event.target.closest(ATC_SELECTOR);
    if (!button || !button.form || button.disabled) return;
    if (passThrough.has(button)) {
      passThrough.delete(button);
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    if (!pending.has(button.form)) addToCart(button);
  }

  async function addToCart(button) {
    const form = button.form;
    const action = new URL(
      button.getAttribute("formaction") || form.getAttribute("action"),
      location.href,
    );
    const asin = form.querySelector('input[name="ASIN"]')?.value;
    const quantity =
      parseInt(new FormData(form, button).get("quantity"), 10) || 1;

    pending.add(form);
    setBusy(button, true);
    try {
      const response = await fetch(action, {
        method: "POST",
        body: new URLSearchParams(new FormData(form, button)),
        credentials: "include",
      });
      const doc = new DOMParser().parseFromString(
        await response.text(),
        "text/html",
      );
      const confirmation = doc.querySelector(SUCCESS_SELECTOR);
      if (!response.ok || !confirmation)
        throw new Error(
          `Unexpected add-to-cart response (HTTP ${response.status})`,
        );

      refreshCart(
        parseInt(doc.querySelector("#nav-cart-count")?.textContent, 10),
        asin,
      );
      showToast({
        kind: "success",
        heading:
          (
            confirmation.querySelector("h1, h4") || confirmation
          ).textContent.trim() || "Added to cart",
        title: document.querySelector("#productTitle")?.textContent.trim(),
        image: document.querySelector(
          "#landingImage, #imgBlkFront, #main-image",
        )?.currentSrc,
        quantity,
        subtotal: readSubtotal(doc),
        cartUrl:
          doc.querySelector("#sw-gtc a")?.getAttribute("href") || "/cart",
      });
    } catch (error) {
      console.warn("[Enhanced Amazon Storefront]", error);
      showToast({
        kind: "error",
        heading: "Couldn't add to cart",
        title:
          "Amazon returned something unexpected. You can retry the standard way.",
        retry: () => {
          passThrough.add(button);
          button.click();
        },
      });
    } finally {
      pending.delete(form);
      setBusy(button, false);
    }
  }

  function readSubtotal(doc) {
    const label = doc
      .querySelector("#sw-subtotal-item-count")
      ?.textContent.trim();
    const amount = doc
      .querySelector("#sw-subtotal .a-offscreen")
      ?.textContent.trim();
    return label && amount ? `${label} ${amount}` : null;
  }

  // `api.setCartCount` updates the badge and, when the sidebar is rendered,
  // re-fetches its content.
  function refreshCart(count, asin) {
    EWC_CACHE_KEYS.forEach((key) => sessionStorage.removeItem(key));

    if (Number.isFinite(count) && window.$Nav?.when) {
      window.$Nav
        .when("api.setCartCount")
        .run((setCartCount) => setCartCount(count));
    } else {
      window.P?.when("EWC").execute((ewc) => ewc.refresh());
    }

    pulse(document.querySelector("#nav-cart-count"));
    highlightSidebarItem(asin);
  }

  function highlightSidebarItem(asin) {
    const sidebar = document.querySelector("#nav-flyout-ewc .nav-ewc-content");
    if (!asin || !sidebar) return;

    const observer = new MutationObserver(() => {
      const item = sidebar.querySelector(
        `.ewc-item[data-asin="${CSS.escape(asin)}"]`,
      );
      if (!item) return;
      observer.disconnect();
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      item.animate(
        [
          { boxShadow: "inset 0 0 0 2px #067D62", backgroundColor: "#E6F4EA" },
          {
            boxShadow: "inset 0 0 0 2px transparent",
            backgroundColor: "transparent",
          },
        ],
        { duration: 2200, easing: "ease-out" },
      );
    });
    observer.observe(sidebar, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  }

  function pulse(element) {
    element?.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.45)" },
        { transform: "scale(1)" },
      ],
      { duration: 450, easing: "cubic-bezier(.3,1.6,.6,1)" },
    );
  }

  function setBusy(button, busy) {
    const shell = button.closest(".a-button") || button;
    shell.style.opacity = busy ? "0.6" : "";
    shell.style.cursor = busy ? "progress" : "";
    button.setAttribute("aria-busy", String(busy));
  }

  // Toasts

  let stack;

  function toastStack() {
    if (stack?.isConnected) return stack;

    const host = document.createElement("div");
    host.id = "eas-toast-host";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${TOAST_CSS}</style><div class="stack" role="region" aria-label="Cart notifications"></div>`;
    document.documentElement.append(host);
    stack = root.querySelector(".stack");
    return stack;
  }

  // Keeps toasts clear of the persistent cart sidebar on wide screens.
  function sidebarOffset() {
    const sidebar = document.querySelector("#nav-flyout-ewc");
    const rect = sidebar?.getBoundingClientRect();
    return rect && rect.width > 0 && rect.left > innerWidth / 2
      ? innerWidth - rect.left
      : 0;
  }

  function showToast({
    kind,
    heading,
    title,
    image,
    quantity,
    subtotal,
    cartUrl,
    retry,
  }) {
    const container = toastStack();
    container.style.right = `${sidebarOffset() + 16}px`;

    const toast = document.createElement("div");
    toast.className = `toast ${kind}`;
    toast.setAttribute("role", kind === "error" ? "alert" : "status");
    toast.innerHTML = `
      <div class="media">${image ? '<img alt="">' : ""}<span class="badge" aria-hidden="true"></span></div>
      <div class="body">
        <div class="heading"></div>
        <div class="title"></div>
        <div class="meta"></div>
        <div class="actions"></div>
      </div>
      <button class="close" type="button" aria-label="Dismiss">&times;</button>
      <div class="timer"></div>`;

    if (image) toast.querySelector("img").src = image;
    toast.querySelector(".badge").textContent = kind === "error" ? "!" : "✓";
    toast.querySelector(".heading").textContent = heading;
    toast.querySelector(".title").textContent = title || "";
    toast.querySelector(".meta").textContent = [
      quantity > 1 && `Qty ${quantity}`,
      subtotal,
    ]
      .filter(Boolean)
      .join(" · ");

    const actions = toast.querySelector(".actions");
    if (cartUrl) actions.append(actionLink("View cart", cartUrl));
    if (retry)
      actions.append(
        actionButton("Retry the standard way", () => (dismiss(), retry())),
      );

    container.prepend(toast);
    requestAnimationFrame(() => toast.classList.add("shown"));

    const timer = toast.querySelector(".timer");
    const countdown = timer.animate(
      [{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
      {
        duration: kind === "error" ? TOAST_MS * 2 : TOAST_MS,
        easing: "linear",
        fill: "forwards",
      },
    );
    countdown.onfinish = dismiss;
    toast.addEventListener("mouseenter", () => countdown.pause());
    toast.addEventListener("mouseleave", () => countdown.play());
    toast.querySelector(".close").addEventListener("click", dismiss);

    function dismiss() {
      countdown.onfinish = null;
      toast.classList.remove("shown");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
      setTimeout(() => toast.remove(), 400);
    }
  }

  function actionLink(label, href) {
    const link = document.createElement("a");
    link.className = "action primary";
    link.href = href;
    link.textContent = label;
    return link;
  }

  function actionButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action primary";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  const TOAST_CSS = `
    .stack {
      position: fixed; top: 16px; right: 16px; z-index: 2147483000;
      display: flex; flex-direction: column; gap: 10px; width: 360px; max-width: calc(100vw - 32px);
      font: 14px/1.4 "Amazon Ember", Arial, sans-serif; color: #0F1111;
    }
    .toast {
      position: relative; display: flex; gap: 12px; padding: 14px 36px 16px 14px; overflow: hidden;
      background: #fff; border-radius: 12px; border-left: 4px solid #067D62;
      box-shadow: 0 10px 30px rgba(15,17,17,.18), 0 2px 6px rgba(15,17,17,.12);
      opacity: 0; transform: translateX(24px) scale(.98);
      transition: opacity .25s ease, transform .3s cubic-bezier(.2,.9,.3,1.2);
    }
    .toast.shown { opacity: 1; transform: none; }
    .toast.error { border-left-color: #CC0C39; }
    .media { position: relative; flex: none; width: 64px; height: 64px; display: grid; place-items: center; }
    .media img { max-width: 64px; max-height: 64px; object-fit: contain; border-radius: 6px; }
    .badge {
      position: absolute; right: -6px; bottom: -6px; width: 22px; height: 22px; border-radius: 50%;
      display: grid; place-items: center; font-weight: 700; font-size: 13px; color: #fff;
      background: #067D62; box-shadow: 0 0 0 2px #fff;
    }
    .error .badge { position: static; width: 40px; height: 40px; font-size: 20px; background: #CC0C39; }
    .body { min-width: 0; flex: 1; }
    .heading { font-weight: 700; font-size: 15px; color: #067D62; }
    .error .heading { color: #CC0C39; }
    .title { margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { margin-top: 4px; color: #565959; font-size: 13px; }
    .meta:empty { display: none; }
    .actions { display: flex; gap: 8px; margin-top: 10px; }
    .actions:empty { display: none; }
    .action {
      font: inherit; font-size: 13px; padding: 6px 14px; border-radius: 100px; cursor: pointer;
      text-decoration: none; color: #0F1111; border: 1px solid #FCD200; background: #FFD814;
    }
    .action:hover { background: #F7CA00; }
    .action:focus-visible, .close:focus-visible { outline: 2px solid #007185; outline-offset: 2px; }
    .close {
      position: absolute; top: 6px; right: 8px; width: 26px; height: 26px; border: 0; border-radius: 50%;
      background: transparent; color: #565959; font-size: 20px; line-height: 1; cursor: pointer;
    }
    .close:hover { background: #F0F2F2; color: #0F1111; }
    .timer {
      position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
      background: #067D62; opacity: .35; transform-origin: left;
    }
    .error .timer { background: #CC0C39; }
    @media (prefers-reduced-motion: reduce) {
      .toast { transition: opacity .2s ease; transform: none; }
    }
  `;
})();
