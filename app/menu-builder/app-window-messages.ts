import type { LegacyRef } from "react";
import type { SAppWindowAttributes } from "@shopify/app-bridge-types";

// @shopify/app-bridge-types augments JSX.IntrinsicElements for 's-app-window' with
// SAppWindowAttributes only (id, src) — unlike 'ui-modal', which app-bridge-react's
// own Modal.d.ts additionally patches with a `ref` prop. We need an element ref to
// call .show()/.hide() imperatively, so this fills in the same gap for our own use.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "s-app-window": SAppWindowAttributes & {
        ref?: LegacyRef<SAppWindowElement | null>;
      };
    }
  }
}

// Cross-frame postMessage protocol between the Mega Menus list page (which renders
// the <s-app-window> hosting the builder) and the Menu Builder page (loaded inside
// that app window's nested iframe via its `src`). App Bridge's `s-app-window` has no
// documented API for content loaded inside it to close itself or report state to its
// host — only the hosting page can call `.show()`/`.hide()` on its own element
// reference — so the builder talks to its host via window.parent.postMessage, and the
// host talks back via the iframe's `contentWindow`.
export const BUILDER_DIRTY_STATE_MESSAGE = "menucraft:builderDirtyState" as const;
export const CLOSE_BUILDER_MESSAGE = "menucraft:closeBuilder" as const;
export const REQUEST_CLOSE_CONFIRMATION_MESSAGE = "menucraft:requestCloseConfirmation" as const;
export const NAVIGATE_TO_PRICING_MESSAGE = "menucraft:navigateToPricing" as const;

export type BuilderDirtyStateMessage = {
  type: typeof BUILDER_DIRTY_STATE_MESSAGE;
  isDirty: boolean;
  requiresExplicitSave: boolean;
};

export type CloseBuilderMessage = {
  type: typeof CLOSE_BUILDER_MESSAGE;
};

export type RequestCloseConfirmationMessage = {
  type: typeof REQUEST_CLOSE_CONFIRMATION_MESSAGE;
};

export type NavigateToPricingMessage = {
  type: typeof NAVIGATE_TO_PRICING_MESSAGE;
};

export type AppWindowMessage =
  | BuilderDirtyStateMessage
  | CloseBuilderMessage
  | RequestCloseConfirmationMessage
  | NavigateToPricingMessage;

export const isAppWindowMessage = (data: unknown): data is AppWindowMessage =>
  typeof data === "object" &&
  data !== null &&
  "type" in data &&
  (data.type === BUILDER_DIRTY_STATE_MESSAGE ||
    data.type === CLOSE_BUILDER_MESSAGE ||
    data.type === REQUEST_CLOSE_CONFIRMATION_MESSAGE ||
    data.type === NAVIGATE_TO_PRICING_MESSAGE);
