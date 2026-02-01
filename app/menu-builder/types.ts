export type MenuItem = {
  id: string;
  label: string;
  url: string;
  role: "menu" | "group" | "item";
  expanded?: boolean;
  children?: MenuItem[];
  description?: string;
  icon?: string;
  iconWidthMode?: "auto" | "custom";
  iconWidthValue?: number;
  iconWidthUnit?: "%" | "px";
  openInNewTab?: boolean;
  hideOnDesktop?: boolean;
  hideOnMobile?: boolean;
  hideWhenLoggedIn?: boolean;
  showWhenLoggedOut?: boolean;
  schedulePublish?: boolean;
  extraClassName?: string;
  badgeEnabled?: boolean;
  badgeText?: string;
  badgeType?: "sale" | "sold_out";
  customTextColor?: string;
  customBackgroundColor?: string;
  customTextHoverColor?: string;
  customBackgroundHoverColor?: string;
  blockTemplate?: BlockTemplateId;
  submenuTemplate?: SubmenuTemplateId;
  submenuType?: "mega" | "dropdown" | "horizontal-dropdown";
  submenuWidth?: "full" | "content";
  submenuContentAlign?: "left" | "center" | "right" | "space-between" | "space-around" | "space-evenly";
  submenuBackgroundColor?: string;
  submenuBackgroundImage?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageNoFill?: boolean;
  imageTextAlign?: "left" | "center" | "right";
  contactTitle?: string;
  contactDescription?: string;
  contactNameLabel?: string;
  contactEmailLabel?: string;
  contactPhoneLabel?: string;
  contactMessageLabel?: string;
  contactSubmitLabel?: string;
  contactSuccessMessage?: string;
  htmlContent?: string;
  productIds?: string[];
  collectionIds?: string[];
  blogIds?: string[];
  productLayout?: "image-top" | "image-left";
  collectionLayout?: "image-top" | "image-left";
  productWidth?: number;
  productListCount?: number;
  linkColumns?: number;
  linkWidth?: number;
  linkTextAlign?: "left" | "center" | "right";
  isHeading?: boolean;
  multiLayout?:
  | "multi-links"
  | "multi-3-photo"
  | "multi-2-photos"
  | "multi-1-3-photos"
  | "multi-4-images"
  | "multi-4-products"
  | "multi-map-contact-address"
  | "multi-4-product-list"
  | "multi-1-column-3-product-list"
  | "multi-product-carousel"
  | "multi-link-list-product-carousel"
  | "multi-image-product-carousel"
  | "multi-element-group-masonry";
};

export type SubmenuTemplateId =
  | "custom"
  | "tabs"
  | "simple-left-tabs"
  | "simple-right-tabs"
  | "two-nested-tabs-right"
  | "three-nested-tabs-right"
  | "custom-normal-dropdown"
  | "simple-top-tabs"
  | "two-top-tabs"
  | "three-top-tabs"
  | "two-level-tabs"
  | "three-level-tabs"
  | "mega"
  | "dropdown"
  | "horizontal-dropdown";

export type BlockTemplateId =
  | "space"
  | "multi"
  | "multi-3-photo"
  | "multi-2-photos"
  | "multi-1-3-photos"
  | "multi-4-images"
  | "multi-4-products"
  | "multi-map-contact-address"
  | "multi-4-product-list"
  | "multi-1-column-3-product-list"
  | "multi-product-carousel"
  | "multi-link-list-product-carousel"
  | "multi-image-product-carousel"
  | "multi-element-group-masonry"
  | "multi-4-product-list"
  | "tabs"
  | "image"
  | "image2"
  | "links"
  | "links-easy"
  | "links-3"
  | "links-icons"
  | "product"
  | "product-horizontal"
  | "product-grid"
  | "product-carousel"
  | "product-list"
  | "product-grid-horizontal"
  | "collection"
  | "collection-horizontal"
  | "blogs"
  | "blogs-latest"
  | "html-special"
  | "contact"
  | "html";

export type ProductSummary = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange?: {
    minVariantPrice: { amount: string; currencyCode: string };
  } | null;
};

export type BlogSummary = {
  id: string;
  title: string;
  handle: string;
  articles?: {
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      image?: { url: string; altText?: string | null } | null;
    }>;
  } | null;
};

export type LatestArticleSummary = {
  id: string;
  title: string;
  handle: string;
  image?: { url: string; altText?: string | null } | null;
  blog?: { handle: string } | null;
};

export type PageSummary = {
  id: string;
  title: string;
  handle: string;
};

export type AddableItem = {
  id: string;
  label: string;
  url: string;
};

export type CustomAddItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  icon?: string;
};

export type IconPickerState = {
  itemId: string;
  mode: "library" | "upload";
  target: "custom" | "edit" | "settings";
};

export type RailPanel = "menu" | "settings" | "typography" | "colors" | "code";

export type ThemeSettings = {
  fontFamily: string;
  menuBackground: string;
  menuText: string;
  menuActive: string;
  dropdownBackground: string;
  dropdownText: string;
  dropdownHeading: string;
  canvasBackground: string;
  menuItemSpacing: number;
};

export type BuilderSettings = {
  animationDesktopTrigger: "hover" | "click";
  animationMobileTrigger: "toggle" | "tap";
  animationEffect: "fade" | "slide" | "scale";
  animationDuration: number;
  animationDelay: number;
  spacingMainPadding: number;
  spacingMainRowHeight: number;
  spacingDropdownRowHeight: number;
  spacingTabRowHeight: number;
  spacingLinkListRowHeight: number;
  carouselAutoPlay: boolean;
  carouselLoop: boolean;
  advancedMobileBreakpoint: number;
  advancedHideLinkListSubmenu: boolean;
  advancedShowAddToCart: boolean;
  advancedEnableLazyLoading: boolean;
  elementsShowSearch: boolean;
  elementsShowDesktopDivider: boolean;
  elementsShowMobileDivider: boolean;
  elementsShowIndicators: boolean;
  layoutLocation: "auto" | "replaceNavigation" | "cssSelector";
  layoutOrientation: "horizontal" | "vertical";
  layoutAlignment: "left" | "right" | "center";
  layoutMaxWidth: string;
  layoutReplaceDesktopMenuId: string;
  layoutReplaceMobileMenuId: string;
  layoutCssSelectorDesktop: string;
  layoutCssSelectorMobile: string;
  accountShowLogin: boolean;
  accountShowRegister: boolean;
  accountShowAccount: boolean;
  accountShowLogout: boolean;
  accountLoginIcon: string;
  accountLoginLabel: string;
  accountLoginIconWidthMode: "auto" | "custom";
  accountLoginIconWidthValue: number;
  accountLoginIconWidthUnit: "%" | "px";
  accountRegisterIcon: string;
  accountRegisterLabel: string;
  accountRegisterIconWidthMode: "auto" | "custom";
  accountRegisterIconWidthValue: number;
  accountRegisterIconWidthUnit: "%" | "px";
  accountAccountIcon: string;
  accountAccountLabel: string;
  accountAccountIconWidthMode: "auto" | "custom";
  accountAccountIconWidthValue: number;
  accountAccountIconWidthUnit: "%" | "px";
  accountLogoutIcon: string;
  accountLogoutLabel: string;
  accountLogoutIconWidthMode: "auto" | "custom";
  accountLogoutIconWidthValue: number;
  accountLogoutIconWidthUnit: "%" | "px";
  submenuShowBorder: boolean;
  submenuEnableDesktopScroll: boolean;
  submenuEnableMobileScroll: boolean;
  submenuMaxWidth: string;
  submenuMobileStyle: "collapse" | "drawer";
  typographyMainUseCustom: boolean;
  typographyMainFont: string;
  typographyMainWeight: number;
  typographyMainSize: number;
  typographySubheadingUseCustom: boolean;
  typographySubheadingFont: string;
  typographySubheadingWeight: number;
  typographySubheadingSize: number;
  typographySubtextUseCustom: boolean;
  typographySubtextFont: string;
  typographySubtextWeight: number;
  typographySubtextSize: number;
  typographyTabUseCustom: boolean;
  typographyTabFont: string;
  typographyTabWeight: number;
  typographyTabSize: number;
  colorMainBackground: string;
  colorMainBackgroundHover: string;
  colorMainDivider: string;
  colorMainText: string;
  colorMainTextHover: string;
  colorTabHeading: string;
  colorTabHeadingActive: string;
  colorTabBackgroundActive: string;
  colorSubmenuBackground: string;
  colorSubmenuBorder: string;
  colorSubmenuHeading: string;
  colorSubmenuText: string;
  colorSubmenuTextHover: string;
  colorSubmenuDescription: string;
  colorSubmenuDescriptionHover: string;
  colorBadgeSaleText: string;
  colorBadgeSaleBackground: string;
  colorBadgeSoldOutText: string;
  colorBadgeSoldOutBackground: string;
  colorButtonText: string;
  colorButtonBackground: string;
  colorButtonBackgroundHover: string;
  colorButtonTextHover: string;
  customCss: string;
  imageLibrary: string[];
};

export type FontPickerState = {
  id: string;
  fontKey: keyof BuilderSettings;
  weightKey: keyof BuilderSettings;
};

export type RgbColor = {
  red: number;
  green: number;
  blue: number;
};

export type HsbColor = {
  hue: number;
  saturation: number;
  brightness: number;
  alpha?: number;
};
