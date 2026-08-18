/**
 * dsh-jump-to-top — host half.
 *
 * Pure client-side UX: the host has nothing to do beyond existing so the
 * bundle is a valid profile layer. All behavior lives in lib/client.js.
 */
export const name = 'dsh-jump-to-top';

/** This bundle needs no host services. */
export const inject = [];

export function apply() {
  // No host behavior: the browser half injects the floating button.
}
