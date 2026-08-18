/**
 * dsh-jump-to-top — client half.
 *
 * Adds a "back to top" button next to the official "back to bottom" button in
 * the web chat view. The button is inserted as the FIRST child of the official
 * sticky slot (`.Md3f7G_toBottomSlot`), so it sits immediately to the LEFT of
 * the built-in toBottom button and inherits the official positioning (sticky,
 * composer-aware, right-aligned) instead of using a fragile fixed overlay.
 *
 * Visibility: the button appears whenever the chat scrollport is scrolled away
 * from the top (scrollTop > threshold) — i.e. as soon as the user scrolls UP
 * into history — and hides again at the very top. Clicking scrolls back to the
 * top (the oldest message), smooth when the OS allows it.
 */
window.__ModuleLoader__.load({
	id: "dsh-jump-to-top",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// ── identity ─────────────────────────────────────────────────────────
		const PLUGIN_ID = "dsh-jump-to-top";
		const BUTTON_CLASS = "dsh-jump-to-top-button";
		const STYLE_ID = "dsh-jump-to-top-style";
		const SHOW_AFTER_PX = 200;

		// ── styles ───────────────────────────────────────────────────────────
		// Mirrors the official .Md3f7G_toBottom button look, plus a left-side
		// gap inside the flex slot so the two buttons don't touch.
		const CSS = `
.${BUTTON_CLASS} {
  border: 1px solid var(--dsw-alias-border-l2);
  width: 34px;
  height: 34px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-button-floating-fill);
  box-shadow: var(--dsw-shadow-lv2);
  cursor: pointer;
  pointer-events: auto;
  border-radius: 100px;
  justify-content: center;
  align-items: center;
  margin-top: -34px;
  margin-right: 8px;
  padding: 0;
  display: flex;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 120ms ease, transform 120ms ease;
}
.${BUTTON_CLASS}.dsh-jump-to-top-visible {
  opacity: 1;
  transform: none;
}
.${BUTTON_CLASS}:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));
}
.${BUTTON_CLASS} svg {
  width: 18px;
  height: 18px;
  display: block;
}
@media (prefers-reduced-motion: reduce) {
  .${BUTTON_CLASS} {
    transition: none;
  }
}
`;

		const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13.5v-11M3.5 7 8 2.5 12.5 7"/></svg>';

		function ensureStyle() {
			if (document.getElementById(STYLE_ID) !== null) return;
			const tag = document.createElement("style");
			tag.id = STYLE_ID;
			tag.dataset.plugin = PLUGIN_ID;
			tag.dataset.pluginCss = `${PLUGIN_ID}/style`;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		/**
		 * Find the element that actually scrolls the chat transcript.
		 * Returns null when the conversation view is not mounted yet.
		 *
		 * Two layouts exist in dsh web:
		 *  - standalone chat: `.Md3f7G_scroll` owns the scrollport
		 *    (overflow-y: auto);
		 *  - shell-integrated chat: an outer `[data-conversation-scroll]`
		 *    element (`.wSkVaW_scrollBody` in the shell layout) is the real
		 *    scrollport and `.Md3f7G_scroll` is overflow:visible inside it.
		 */
		function findScrollport() {
			// Preferred: the conversation view's own scroll container.
			const own = document.querySelector(".Md3f7G_scroll");
			if (own !== null) {
				const style = window.getComputedStyle(own);
				if (style.overflowY === "auto" || style.overflowY === "scroll") return own;
			}
			// Shell layout: the [data-conversation-scroll] element itself is
			// the scrollport (checked first), else climb to a scrollable ancestor.
			const flag = document.querySelector("[data-conversation-scroll]");
			if (flag !== null) {
				let node = flag;
				while (node !== null) {
					const style = window.getComputedStyle(node);
					if ((style.overflowY === "auto" || style.overflowY === "scroll")
						&& node.scrollHeight > node.clientHeight + 1) {
						return node;
					}
					node = node.parentElement;
				}
			}
			return null;
		}

		/**
		 * The official sticky slot that hosts the toBottom button. Our button
		 * lives inside it as the first child (left of the official button).
		 */
		function findSlot() {
			return document.querySelector(".Md3f7G_toBottomSlot");
		}

		function install() {
			ensureStyle();

			const button = document.createElement("button");
			button.type = "button";
			button.className = BUTTON_CLASS;
			button.title = "回到聊天最顶部 / Back to top";
			button.setAttribute("aria-label", "回到聊天最顶部");
			button.innerHTML = ICON_SVG;
			button.style.visibility = "hidden"; // avoid a stray clickable before first placement

			let scrollport = null;

			function updateVisibility() {
				const show = scrollport !== null && scrollport.scrollTop > SHOW_AFTER_PX;
				button.classList.toggle("dsh-jump-to-top-visible", show);
			}

			function onScroll() {
				updateVisibility();
			}

			function onClick() {
				if (scrollport === null) return;
				scrollport.scrollTo({ top: 0, behavior: "smooth" });
			}

			button.addEventListener("click", onClick);

			/**
			 * Place the button as the first child of the official slot, guarded
			 * against React re-renders (the slot's children get replaced when
			 * atBottom flips): if our button is no longer inside the slot,
			 * re-insert it.
			 */
			function placeButton() {
				const slot = findSlot();
				if (slot === null) return false;
				if (button.parentElement === slot && slot.firstChild === button) {
					return true;
				}
				// If the button is currently elsewhere (e.g. a previous slot
				// instance), move it — don't duplicate.
				if (button.parentElement !== null && button.parentElement !== slot) {
					button.parentElement.removeChild(button);
				}
				slot.insertBefore(button, slot.firstChild);
				button.style.visibility = "";
				return true;
			}

			function refresh() {
				const next = findScrollport();
				if (next !== scrollport) {
					if (scrollport !== null) {
						scrollport.removeEventListener("scroll", onScroll);
					}
					scrollport = next;
					if (scrollport !== null) {
						scrollport.addEventListener("scroll", onScroll, { passive: true });
					}
				}
				placeButton();
				updateVisibility();
			}

			// The chat view mounts lazily (session open / navigation) and React
			// re-creates the slot when atBottom flips — watch for both.
			const observer = new MutationObserver(() => refresh());
			observer.observe(document.body, { childList: true, subtree: true });

			refresh();

			return () => {
				observer.disconnect();
				button.removeEventListener("click", onClick);
				if (scrollport !== null) {
					scrollport.removeEventListener("scroll", onScroll);
				}
				button.remove();
				document.getElementById(STYLE_ID)?.remove();
			};
		}

		const name = PLUGIN_ID;
		const inject = [];

		function apply(ctx) {
			ctx.effect(() => install(), "dsh-jump-to-top: chat scroll-to-top button");
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
