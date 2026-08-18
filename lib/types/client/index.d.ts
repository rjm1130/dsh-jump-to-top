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
export declare const name = 'dsh-jump-to-top';
export declare const inject: string[];
export declare function apply(ctx: unknown): void;
