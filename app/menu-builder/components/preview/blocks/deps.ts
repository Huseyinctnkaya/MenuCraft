import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { FetcherWithComponents } from "@remix-run/react";

import type {
  BlogSummary,
  BuilderSettings,
  LatestArticleSummary,
  MenuItem,
  ProductSummary,
  ThemeSettings,
} from "../../../types";

export type PreviewColors = {
  mainBackground: string;
  mainBackgroundHover: string;
  mainDivider: string;
  mainText: string;
  mainTextHover: string;
  tabHeading: string;
  tabHeadingActive: string;
  tabBackgroundActive: string;
  submenuBackground: string;
  submenuBorder: string;
  submenuHeading: string;
  submenuText: string;
  submenuTextHover: string;
  submenuDescription: string;
  submenuDescriptionHover: string;
  buttonText: string;
  buttonBackground: string;
  buttonBackgroundHover: string;
  buttonTextHover: string;
};

export type TypographyStyle = {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
};

export type PreviewBlockDeps = {
  menuItems: MenuItem[];
  setMenuItems: Dispatch<SetStateAction<MenuItem[]>>;
  selectedItemId: string | null;
  draggedItemId: string | null;
  draggedParentId: string | null;
  setDraggedItemId: Dispatch<SetStateAction<string | null>>;
  setDraggedParentId: Dispatch<SetStateAction<string | null>>;
  lastDragOverIdRef: MutableRefObject<string | null>;
  findParentId: (
    items: MenuItem[],
    id: string,
    parentId?: string | null
  ) => string | null | undefined;
  moveItem: (items: MenuItem[], draggedId: string, targetId: string) => MenuItem[];
  handleSelectItem: (id: string, openEdit?: boolean, options?: { keepPanel?: boolean }) => void;
  handleDuplicateItem: (id: string) => void;
  openDeleteItemDialog: (id: string) => void;
  handleOpenBlockTemplatePicker: (menuId: string) => void;
  registerPreviewRow: (id: string) => (node: HTMLDivElement | null) => void;
  builderSettings: BuilderSettings;
  themeSettings: ThemeSettings;
  previewColors: PreviewColors;
  subheadingTypography: TypographyStyle;
  descriptionTypography: TypographyStyle;
  isMobilePreview: boolean;
  useImageSpaceLayout: boolean;
  useBlockFlexLayout: boolean;
  hoveredImageBlockId: string | null;
  setHoveredImageBlockId: Dispatch<SetStateAction<string | null>>;
  productCarouselPageById: Record<string, number>;
  setProductCarouselPageById: Dispatch<SetStateAction<Record<string, number>>>;
  previewMenu: MenuItem | null;
  menu: { id: number; name: string; status: string };
  products: ProductSummary[];
  collections: Array<{
    id: string;
    title: string;
    handle: string;
    image?: { url: string; altText?: string | null } | null;
  }>;
  blogs: BlogSummary[];
  latestArticles: LatestArticleSummary[];
  contactFetcher: FetcherWithComponents<any>;
};
