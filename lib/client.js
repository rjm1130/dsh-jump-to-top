/**
 * dsh-jump-to-top — client half.
 *
 * Adds two floating buttons to the left of the official "back to bottom"
 * button in the web chat view (all inside the official sticky slot):
 *
 *   [回到上次发消息] [回到最顶部] [官方: 回到底部]
 *
 * - Back-to-top: scrolls to the very top (oldest message).
 * - Back-to-last-message: scrolls to the closest user message ABOVE the
 *   current viewport — wherever you are in a long assistant reply, it takes
 *   you back to the user message that preceded that part of the reply.
 *
 * Buttons are inserted as leading children of `.Md3f7G_toBottomSlot`, so they
 * inherit the official sticky positioning (composer-aware, right-aligned).
 * Visibility: buttons appear once the scrollport is scrolled away from the
 * bottom (like the official toBottom button's trigger area) and the user has
 * scrolled up far enough to make them useful.
 */
window.__ModuleLoader__.load({
	id: "dsh-jump-to-top",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// ── identity ─────────────────────────────────────────────────────────
		const PLUGIN_ID = "dsh-jump-to-top";
		const BTN_TOP_CLASS = "dsh-jump-to-top-button";
		const BTN_MSG_CLASS = "dsh-jump-to-msg-button";
		const STYLE_ID = "dsh-jump-to-top-style";
		// Show the buttons once the user has scrolled up this far from the bottom.
		const SHOW_AFTER_PX = 200;

		// ── styles ───────────────────────────────────────────────────────────
		// Mirrors the official .Md3f7G_toBottom button look; buttons sit left of
		// the official one with an 8px gap between them.
		const CSS = `
.${BTN_TOP_CLASS}, .${BTN_MSG_CLASS} {
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
.${BTN_TOP_CLASS}.dsh-jump-to-top-visible,
.${BTN_MSG_CLASS}.dsh-jump-to-top-visible {
  opacity: 1;
  transform: none;
}
.${BTN_TOP_CLASS}:hover, .${BTN_MSG_CLASS}:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));
}
.${BTN_TOP_CLASS} svg, .${BTN_MSG_CLASS} svg {
  width: 18px;
  height: 18px;
  display: block;
}
@media (prefers-reduced-motion: reduce) {
  .${BTN_TOP_CLASS}, .${BTN_MSG_CLASS} {
    transition: none;
  }
}
`;

		const ICON_TOP_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13.5v-11M3.5 7 8 2.5 12.5 7"/></svg>';
		// "回到上次发消息": a message-bubble glyph with an up arrow.
		const ICON_MSG_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12.5V7.5A2.5 2.5 0 0 1 5 5h6"/><path d="M8.5 2.5 11.5 5l-3 2.5"/><path d="M11 2.5V5"/></svg>';

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
		 */
		function findScrollport() {
			const own = document.querySelector(".Md3f7G_scroll");
			if (own !== null) {
				const style = window.getComputedStyle(own);
				if (style.overflowY === "auto" || style.overflowY === "scroll") return own;
			}
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

		/** The official sticky slot hosting the toBottom button. */
		function findSlot() {
			return document.querySelector(".Md3f7G_toBottomSlot");
		}

		/**
		 * The user message row that is the closest one ABOVE the current
		 * viewport — i.e. "my last sent message" relative to where the reader
		 * is right now. Rows appear in transcript order, so we walk them and
		 * keep the last row whose top edge is above the viewport's reference
		 * line. When the reader is inside a long assistant reply, this lands
		 * on the user message that preceded that part of the reply.
		 *
		 * Reference line: a bit below the viewport top (15% of its height), so
		 * a user row that is currently visible counts as "the one I'm at".
		 */
		function findLastUserMessage(scrollport) {
			const rows = document.querySelectorAll(".gdEzaW_userRow");
			if (rows.length === 0) return null;
			const spRect = scrollport.getBoundingClientRect();
			const referenceY = spRect.top + scrollport.clientHeight * 0.15;
			let best = rows[0];
			for (const row of rows) {
				const rect = row.getBoundingClientRect();
				if (rect.top <= referenceY + 1) {
					best = row;
				} else {
					break; // rows are in document order; all later ones are further down
				}
			}
			return best;
		}

		/**
		 * Compute the scrollTop value that brings `target` into view within the
		 * scrollport. Uses bounding rects so it works for both layouts.
		 * Clamped to [0, maxScroll] so the scrollport never overshoots.
		 */
		function scrollTopForTarget(scrollport, target) {
			const spRect = scrollport.getBoundingClientRect();
			const tRect = target.getBoundingClientRect();
			const raw = scrollport.scrollTop + (tRect.top - spRect.top) - 24; // small breathing room
			const max = Math.max(0, scrollport.scrollHeight - scrollport.clientHeight);
			return Math.min(Math.max(0, raw), max);
		}

		function install() {
			ensureStyle();

			const btnTop = document.createElement("button");
			btnTop.type = "button";
			btnTop.className = BTN_TOP_CLASS;
			btnTop.title = "回到聊天最顶部 / Back to top";
			btnTop.setAttribute("aria-label", "回到聊天最顶部");
			btnTop.innerHTML = ICON_TOP_SVG;
			btnTop.style.visibility = "hidden";

			const btnMsg = document.createElement("button");
			btnMsg.type = "button";
			btnMsg.className = BTN_MSG_CLASS;
			btnMsg.title = "回到我最近发的那条消息 / Back to my last message";
			btnMsg.setAttribute("aria-label", "回到上次发消息的地方");
			btnMsg.innerHTML = ICON_MSG_SVG;
			btnMsg.style.visibility = "hidden";

			let scrollport = null;

			function updateVisibility() {
				const show = scrollport !== null && scrollport.scrollTop > SHOW_AFTER_PX;
				btnTop.classList.toggle("dsh-jump-to-top-visible", show);
				btnMsg.classList.toggle("dsh-jump-to-top-visible", show);
			}

			function onScroll() {
				updateVisibility();
			}

			function onClickTop() {
				if (scrollport === null) return;
				scrollport.scrollTo({ top: 0, behavior: "smooth" });
			}

			// "Back to my last message" click-state: remembers the last row we
			// jumped to and the scroll position we left it at, so repeated clicks
			// without scrolling walk UP one user message at a time (3 -> 2 -> 1).
			// Any manual scrolling resets the walk to the viewport-relative target.
			let lastJumpRow = null;
			let lastJumpScrollTop = null;

			function onClickMsg() {
				if (scrollport === null) return;
				const rows = Array.from(document.querySelectorAll(".gdEzaW_userRow"));
				if (rows.length === 0) return;
				const current = findLastUserMessage(scrollport);
				if (current === null) return;

				let target = current;
				// If the user hasn't scrolled since our last jump, step one
				// message further up (the row before the one we last landed on).
				const still = lastJumpRow !== null && lastJumpScrollTop !== null
					&& Math.abs(scrollport.scrollTop - lastJumpScrollTop) < 60;
				if (still) {
					const idx = rows.indexOf(lastJumpRow);
					if (idx > 0) target = rows[idx - 1];
				}

				const dest = scrollTopForTarget(scrollport, target);
				lastJumpRow = target;
				lastJumpScrollTop = dest;
				scrollport.scrollTo({ top: dest, behavior: "smooth" });
			}

			btnTop.addEventListener("click", onClickTop);
			btnMsg.addEventListener("click", onClickMsg);

			/**
			 * Keep both buttons in the slot as leading children, guarded against
			 * React re-renders (the slot's children get replaced when atBottom
			 * flips): re-insert whichever is missing. Order: msg, top, official.
			 *
			 * CRITICAL: this must be idempotent — when the buttons are already
			 * in place, do NOT touch the DOM. Every insertBefore mutates the
			 * tree, which re-triggers this module's own MutationObserver and
			 * would loop forever (the observed freeze).
			 */
			function placeButtons() {
				const slot = findSlot();
				if (slot === null) return false;

				// Already correctly placed: [btnMsg, btnTop, ...official] —
				// do nothing.
				if (btnMsg.parentElement === slot
					&& btnTop.parentElement === slot
					&& slot.firstChild === btnMsg
					&& btnMsg.nextSibling === btnTop) {
					return true;
				}

				// Move any stray button into this slot first.
				for (const btn of [btnMsg, btnTop]) {
					if (btn.parentElement !== null && btn.parentElement !== slot) {
						btn.parentElement.removeChild(btn);
					}
				}
				// Order: [btnMsg, btnTop, ...official]. Insert at the very front
				// in reverse order so the final order is msg, top, official.
				slot.insertBefore(btnTop, slot.firstChild);
				slot.insertBefore(btnMsg, slot.firstChild);
				btnMsg.style.visibility = "";
				btnTop.style.visibility = "";
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
				placeButtons();
				updateVisibility();
			}

			const observer = new MutationObserver(() => refresh());
			observer.observe(document.body, { childList: true, subtree: true });

			refresh();

			return () => {
				observer.disconnect();
				btnTop.removeEventListener("click", onClickTop);
				btnMsg.removeEventListener("click", onClickMsg);
				if (scrollport !== null) {
					scrollport.removeEventListener("scroll", onScroll);
				}
				btnTop.remove();
				btnMsg.remove();
				document.getElementById(STYLE_ID)?.remove();
			};
		}

		const name = PLUGIN_ID;
		const inject = [];

		function apply(ctx) {
			ctx.effect(() => install(), "dsh-jump-to-top: chat scroll buttons");
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
