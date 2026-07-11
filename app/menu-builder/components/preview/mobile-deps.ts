import type { Dispatch, SetStateAction } from "react";

import type { MenuItem } from "../../types";
import type { PreviewBlockDeps } from "./blocks/deps";

export type MobilePanelDeps = PreviewBlockDeps & {
  dropdownItems: MenuItem[];
  horizontalDropdownItems: MenuItem[];
  dropdownContentAlign:
    | "left"
    | "right"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  dropdownAlignJustify: string;
  shouldInlineMobileDropdownPanel: boolean;
  shouldInlineMobileHorizontalDropdownPanel: boolean;
  activeDropdownItemId: string | null;
  setActiveDropdownItemId: Dispatch<SetStateAction<string | null>>;
  activeDropdownChildId: string | null;
  setActiveDropdownChildId: Dispatch<SetStateAction<string | null>>;
  activeDropdownGrandchildId: string | null;
  setActiveDropdownGrandchildId: Dispatch<SetStateAction<string | null>>;
  activeHorizontalItemId: string | null;
  setActiveHorizontalItemId: Dispatch<SetStateAction<string | null>>;
  activeHorizontalChildId: string | null;
  setActiveHorizontalChildId: Dispatch<SetStateAction<string | null>>;
  activeHorizontalGrandchildId: string | null;
  setActiveHorizontalGrandchildId: Dispatch<SetStateAction<string | null>>;
};
