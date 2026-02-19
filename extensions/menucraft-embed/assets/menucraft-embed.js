(() => {
  if (window.__menucraftEmbedLoaded) return;
  window.__menucraftEmbedLoaded = true;

  /* ═══════════════════════════════════════════════════════════════════
     Section 1 — Init & Configuration
     ═══════════════════════════════════════════════════════════════════ */
  const ROOT_IDS = ["menucraft-block-root", "menucraft-embed-root"];
  const PROXY_URL = "/apps/menucraft/menu";

  const getRoot = () => {
    for (const id of ROOT_IDS) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  };

  const root = getRoot();
  if (!root) return;

  const DEFAULT_SETTINGS = {
    animationDesktopTrigger: "hover",
    animationMobileTrigger: "toggle",
    animationEffect: "fade",
    animationDuration: 300,
    animationDelay: 150,
    spacingMainPadding: 20,
    spacingMainRowHeight: 50,
    spacingDropdownRowHeight: 50,
    spacingTabRowHeight: 50,
    spacingLinkListRowHeight: 30,
    carouselAutoPlay: true,
    carouselLoop: true,
    advancedMobileBreakpoint: 768,
    advancedHideLinkListSubmenu: false,
    advancedShowAddToCart: false,
    advancedEnableLazyLoading: true,
    elementsShowSearch: true,
    elementsShowDesktopDivider: true,
    elementsShowMobileDivider: true,
    elementsShowIndicators: true,
    layoutLocation: "auto",
    layoutOrientation: "horizontal",
    layoutAlignment: "left",
    layoutMaxWidth: "1200px",
    layoutReplaceDesktopMenuId: "",
    layoutReplaceMobileMenuId: "",
    layoutCssSelectorDesktop: "#SiteNav",
    layoutCssSelectorMobile: "#AccessibleNav",
    accountShowLogin: true,
    accountShowRegister: true,
    accountShowAccount: true,
    accountShowLogout: true,
    accountLoginIcon: "",
    accountLoginLabel: "",
    accountLoginIconWidthMode: "auto",
    accountLoginIconWidthValue: 50,
    accountLoginIconWidthUnit: "%",
    accountRegisterIcon: "",
    accountRegisterLabel: "",
    accountRegisterIconWidthMode: "auto",
    accountRegisterIconWidthValue: 50,
    accountRegisterIconWidthUnit: "%",
    accountAccountIcon: "",
    accountAccountLabel: "",
    accountAccountIconWidthMode: "auto",
    accountAccountIconWidthValue: 50,
    accountAccountIconWidthUnit: "%",
    accountLogoutIcon: "",
    accountLogoutLabel: "",
    accountLogoutIconWidthMode: "auto",
    accountLogoutIconWidthValue: 50,
    accountLogoutIconWidthUnit: "%",
    submenuShowBorder: true,
    submenuEnableDesktopScroll: true,
    submenuEnableMobileScroll: true,
    submenuMaxWidth: "1200px",
    submenuMobileStyle: "drawer",
    typographyMainUseCustom: false,
    typographyMainFont: "Shopify Sans, Inter, system-ui, sans-serif",
    typographyMainWeight: 500,
    typographyMainSize: 15,
    typographySubheadingUseCustom: false,
    typographySubheadingFont: "Shopify Sans, Inter, system-ui, sans-serif",
    typographySubheadingWeight: 600,
    typographySubheadingSize: 15,
    typographySubtextUseCustom: false,
    typographySubtextFont: "Shopify Sans, Inter, system-ui, sans-serif",
    typographySubtextWeight: 400,
    typographySubtextSize: 13,
    typographyTabUseCustom: false,
    typographyTabFont: "Shopify Sans, Inter, system-ui, sans-serif",
    typographyTabWeight: 500,
    typographyTabSize: 14,
    colorMainBackground: "#0b0b0b",
    colorMainBackgroundHover: "#111111",
    colorMainDivider: "#1f1f1f",
    colorMainText: "#f5f5f5",
    colorMainTextHover: "#ffffff",
    colorTabHeading: "#111111",
    colorTabHeadingActive: "#111111",
    colorTabBackgroundActive: "#f5f5f5",
    colorSubmenuBackground: "#ffffff",
    colorSubmenuBorder: "#e5e7eb",
    colorSubmenuHeading: "#b91c1c",
    colorSubmenuText: "#111827",
    colorSubmenuTextHover: "#4D5BCD",
    colorSubmenuDescription: "#969696",
    colorSubmenuDescriptionHover: "#4D5BCD",
    colorBadgeSaleText: "#FFFFFF",
    colorBadgeSaleBackground: "#EC523E",
    colorBadgeSoldOutText: "#757575",
    colorBadgeSoldOutBackground: "#D5D5D5",
    colorBadgeDefaultText: "#FFFFFF",
    colorBadgeDefaultBackground: "#4D5BCD",
    colorButtonText: "#FFFFFF",
    colorButtonBackground: "#1F1F1F",
    colorButtonBackgroundHover: "#000000",
    colorButtonTextHover: "#FFFFFF",
    customCss: "",
    imageLibrary: [],
  };

  const hexToLuminance = (hex) => {
    if (!hex || typeof hex !== "string") return -1;
    let c = hex.trim().toLowerCase();
    if (c === "white" || c === "transparent") return 1;
    // Expand 3-digit hex
    const m3 = c.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
    if (m3) c = `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}`;
    const m6 = c.match(/^#([0-9a-f]{6})$/);
    if (!m6) return -1;
    const r = parseInt(m6[1].substring(0, 2), 16);
    const g = parseInt(m6[1].substring(2, 4), 16);
    const b = parseInt(m6[1].substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const normalizeSettings = (raw) => {
    const safeRaw = raw && typeof raw === "object" ? raw : {};
    const merged = { ...DEFAULT_SETTINGS, ...safeRaw };
    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      if (key.startsWith("color")) {
        const val = merged[key];
        if (!val || val === "#" || (typeof val === "string" && val.trim() === "")) {
          merged[key] = DEFAULT_SETTINGS[key];
        }
      }
    });

    // Ensure submenu text colors are readable on light submenu backgrounds
    const bgLum = hexToLuminance(merged.colorSubmenuBackground);
    const textLum = hexToLuminance(merged.colorSubmenuText);
    const descLum = hexToLuminance(merged.colorSubmenuDescription);
    // If background is light (lum > 0.7) and text is also light (lum > 0.7), fix the text
    if (bgLum > 0.7) {
      if (textLum > 0.7) merged.colorSubmenuText = DEFAULT_SETTINGS.colorSubmenuText;
      if (descLum > 0.7) merged.colorSubmenuDescription = DEFAULT_SETTINGS.colorSubmenuDescription;
    }
    // If we can't determine bg, but text is very light, still fix it
    if (bgLum < 0 && textLum > 0.85) merged.colorSubmenuText = DEFAULT_SETTINGS.colorSubmenuText;
    if (bgLum < 0 && descLum > 0.85) merged.colorSubmenuDescription = DEFAULT_SETTINGS.colorSubmenuDescription;

    return merged;
  };

  /* ═══════════════════════════════════════════════════════════════════
     Section 2 — Utility Functions
     ═══════════════════════════════════════════════════════════════════ */
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  };

  const getResource = (type, id) => {
    if (!window.MenuCraftData || !window.MenuCraftData.resources) return null;
    const key = type === "product" ? "products" : type === "collection" ? "collections" : type === "blog" ? "blogs" : type;
    return window.MenuCraftData.resources[key]?.[id] || null;
  };

  const formatPrice = (priceObj) => {
    if (!priceObj || !priceObj.amount) return "";
    const amount = parseFloat(priceObj.amount);
    const currency = priceObj.currencyCode || "USD";
    let normalized = amount;
    const raw = String(priceObj.amount);
    if (!raw.includes(".") && !raw.includes(",") && raw.length > 4) {
      normalized = amount / 100;
    } else if (raw.endsWith("00") && !raw.includes(".") && !raw.includes(",")) {
      normalized = amount / 100;
    }
    try {
      if (currency === "USD" || currency === "TRY") {
        const formatted = normalized.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return currency === "USD" ? `$ ${formatted}` : `₺ ${formatted}`;
      }
      return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(normalized);
    } catch (e) {
      return `${currency} ${normalized.toFixed(2)}`;
    }
  };

  const getBlockSpan = (item) => {
    const bt = item.blockTemplate;
    if (bt === "links" || bt === "links-easy" || bt === "links-3" || bt === "links-icons") return item.linkWidth || 3;
    if (bt && bt.startsWith("image")) return item.imageWidth || 3;
    if (bt && bt.startsWith("product")) return item.productWidth || 3;
    if (bt && bt.startsWith("collection")) return item.imageWidth || 3;
    if (bt && bt.startsWith("blog")) return item.imageWidth || 4;
    if (bt === "contact") return 6;
    if (bt === "html" || bt === "html-special") return 6;
    if (bt === "space") return item.linkWidth || 1;
    if (bt && bt.startsWith("multi")) return 12;
    return 3;
  };

  const TAB_TEMPLATES = [
    "tabs", "simple-left-tabs", "simple-right-tabs", "simple-top-tabs",
    "two-level-tabs", "three-level-tabs", "two-top-tabs", "three-top-tabs",
    "two-nested-tabs-right", "three-nested-tabs-right",
  ];

  const isTabTemplate = (tmpl) => TAB_TEMPLATES.includes(tmpl);

  const isMegaMenu = (item) => {
    if (item.submenuType === "mega" || item.submenuTemplate === "mega") return true;
    if (item.submenuType === "dropdown" || item.submenuTemplate === "dropdown") return false;
    if (item.submenuType === "horizontal-dropdown" || item.submenuTemplate === "horizontal-dropdown") return false;
    if (item.submenuTemplate === "custom-normal-dropdown") return false;
    if (isTabTemplate(item.submenuTemplate)) return true;
    return Array.isArray(item.children) && item.children.length > 0 &&
      item.children.some((c) => c.blockTemplate && c.blockTemplate !== "none");
  };

  const checkMobile = (settings) => window.matchMedia(`(max-width: ${settings.advancedMobileBreakpoint || 768}px)`).matches;

  const resolveIcon = (icon) => {
    if (!icon) return null;
    if (icon.startsWith("data:")) return icon;
    if (icon.trim().startsWith("<svg")) return icon;
    const resolved = getResource("icons", icon);
    if (resolved) return resolved;
    if (icon.startsWith("lucide:")) {
      const id = icon.split(":")[1];
      return `https://unpkg.com/lucide-static@latest/icons/${id}.svg`;
    }
    return icon;
  };

  const parseCssSize = (val) => {
    if (!val) return "";
    if (/^\d+$/.test(String(val))) return `${val}px`;
    return val;
  };

  /* ═══════════════════════════════════════════════════════════════════
     Section 3 — Icon & Badge Rendering
     ═══════════════════════════════════════════════════════════════════ */
  const buildIcon = (icon, settings, item) => {
    const src = resolveIcon(icon);
    if (!src) return null;

    const container = el("div", "mc-icon");
    let w = "20px";
    let h = "20px";
    if (item && item.iconWidthMode === "custom" && item.iconWidthValue) {
      const unit = item.iconWidthUnit || "px";
      w = `${item.iconWidthValue}${unit}`;
      h = `${item.iconWidthValue}${unit}`;
    }
    container.style.cssText = `width:${w};height:${h};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;

    if (src.trim().startsWith("<svg")) {
      container.innerHTML = src;
      const svg = container.querySelector("svg");
      if (svg) {
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.fill = "currentColor";
      }
    } else {
      const img = el("img");
      img.src = src;
      img.alt = "";
      img.style.cssText = "width:100%;height:100%;object-fit:contain;";
      img.onerror = () => { img.style.display = "none"; };
      if (settings.advancedEnableLazyLoading) img.loading = "lazy";
      container.appendChild(img);
    }
    return container;
  };

  const buildBadge = (item, settings) => {
    if (!item.badgeEnabled || !item.badgeText) return null;
    const badge = el("span", "mc-badge", item.badgeText);
    const t = item.badgeType || "none";
    let bg, color;
    if (t === "sale") {
      bg = settings.colorBadgeSaleBackground;
      color = settings.colorBadgeSaleText;
    } else if (t === "sold_out") {
      bg = settings.colorBadgeSoldOutBackground;
      color = settings.colorBadgeSoldOutText;
    } else {
      bg = settings.colorBadgeDefaultBackground;
      color = settings.colorBadgeDefaultText;
    }
    badge.style.cssText = `background:${bg};color:${color};border-radius:9999px;padding:2px 8px;font-size:10px;font-weight:600;letter-spacing:0.2px;white-space:nowrap;line-height:1.4;`;
    return badge;
  };

  /* ═══════════════════════════════════════════════════════════════════
     Section 4 — Link / Item Rendering
     ═══════════════════════════════════════════════════════════════════ */
  const buildLink = (item, settings, depth) => {
    if (item.isHeading) {
      const wrapper = el("div", "mc-heading-wrapper");
      wrapper.style.cssText = `display:flex;align-items:center;gap:6px;padding:12px 0 4px 0;width:100%;`;

      const span = el("span", "mc-heading");
      span.textContent = item.label || "";
      span.style.cssText = `font-family:${settings.typographySubheadingFont};font-weight:${settings.typographySubheadingWeight};font-size:${settings.typographySubheadingSize}px;color:${settings.colorSubmenuHeading};display:block;letter-spacing:0.02em;`;
      wrapper.appendChild(span);

      const iconEl = buildIcon(item.icon, settings, item);
      if (iconEl) {
        iconEl.style.marginRight = "2px";
        wrapper.insertBefore(iconEl, span);
      }

      const badge = buildBadge(item, settings);
      if (badge) wrapper.appendChild(badge);

      return wrapper;
    }

    const wrapper = el("div", "mc-link-wrapper");
    wrapper.style.cssText = "display:flex;align-items:center;gap:6px;width:100%;";
    if (item.extraClassName) wrapper.classList.add(item.extraClassName);

    const iconEl = buildIcon(item.icon, settings, item);
    if (iconEl) wrapper.appendChild(iconEl);

    const textContent = el("div", "mc-link-text");
    textContent.style.cssText = "display:flex;flex-direction:column;flex:1;min-width:0;";

    const link = el("a", "mc-link");
    link.href = item.url || "#";
    let label = (item.label || "").trim();
    if (!label && item.productIds && item.productIds.length) {
      const p = getResource("product", item.productIds[0]);
      if (p) label = p.title;
    } else if (!label && item.collectionIds && item.collectionIds.length) {
      const c = getResource("collection", item.collectionIds[0]);
      if (c) label = c.title;
    }
    link.textContent = label;

    if (depth === 0) {
      link.style.cssText = `font-family:${settings.typographyMainFont};font-weight:${settings.typographyMainWeight};font-size:${settings.typographyMainSize}px;text-decoration:none;display:inline-flex;align-items:center;height:100%;white-space:nowrap;background:transparent;`;
      link.style.setProperty("color", item.customTextColor || settings.colorMainText, "important");
    } else {
      link.style.cssText = `font-family:${settings.typographySubtextFont};font-weight:${settings.typographySubtextWeight};font-size:${settings.typographySubtextSize}px;text-decoration:none;display:inline-flex;align-items:center;white-space:normal;overflow-wrap:anywhere;background:transparent;line-height:1.2;`;
      link.style.setProperty("color", item.customTextColor || settings.colorSubmenuText, "important");
    }

    if (item.openInNewTab) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    textContent.appendChild(link);

    const descText = (item.description || "").trim();
    const isRedundantDesc = descText.toLowerCase() === "description" || descText === label;
    if (descText && !isRedundantDesc) {
      const desc = el("div", "mc-link-desc", descText);
      desc.style.cssText = `font-size:${depth > 0 ? "11px" : "12px"};margin-top:1px;line-height:1.2;overflow-wrap:break-word;opacity:0.8;`;
      desc.style.setProperty("color", settings.colorSubmenuDescription, "important");
      textContent.appendChild(desc);
    }

    wrapper.appendChild(textContent);

    const badge = buildBadge(item, settings);
    if (badge) {
      const bWrap = el("div", "mc-badge-wrap");
      bWrap.style.cssText = "margin-left:auto;padding-left:4px;flex-shrink:0;";
      bWrap.appendChild(badge);
      wrapper.appendChild(bWrap);
    }

    // Per-item hover colors
    if (item.customBackgroundColor || item.customTextColor) {
      wrapper.style.background = item.customBackgroundColor || "transparent";
    }
    if (item.customTextHoverColor || item.customBackgroundHoverColor) {
      wrapper.addEventListener("mouseenter", () => {
        if (item.customBackgroundHoverColor) wrapper.style.background = item.customBackgroundHoverColor;
        if (item.customTextHoverColor) {
          const lnk = wrapper.querySelector(".mc-link");
          if (lnk) lnk.style.color = item.customTextHoverColor;
          const dsc = wrapper.querySelector(".mc-link-desc");
          if (dsc) dsc.style.color = settings.colorSubmenuDescriptionHover || item.customTextHoverColor;
        }
      });
      wrapper.addEventListener("mouseleave", () => {
        wrapper.style.background = item.customBackgroundColor || "transparent";
        const lnk = wrapper.querySelector(".mc-link");
        if (lnk) lnk.style.color = item.customTextColor || (depth === 0 ? settings.colorMainText : settings.colorSubmenuText);
        const dsc = wrapper.querySelector(".mc-link-desc");
        if (dsc) dsc.style.color = settings.colorSubmenuDescription;
      });
    }

    return wrapper;
  };

  /* ═══════════════════════════════════════════════════════════════════
     Section 5 — Block Renderers
     ═══════════════════════════════════════════════════════════════════ */

  // ── 5.1 Link List Block ───────────────────────────────────────────
  const buildLinkListBlock = (group, settings) => {
    const container = el("div", "mc-block-links");
    container.style.cssText = "padding:12px 8px;display:flex;flex-direction:column;gap:8px;width:100%;box-sizing:border-box;";

    const columnCount = Math.max(1, group.linkColumns || 1);
    const children = group.children || [];
    const textAlign = group.linkTextAlign || "left";
    const mobile = checkMobile(settings);

    const grid = el("div", "mc-links-grid");
    grid.style.cssText = `display:flex;flex-direction:${mobile ? "column" : "row"};gap:0;flex-wrap:wrap;width:100%;`;

    const itemsPerCol = Math.ceil(children.length / columnCount);
    for (let i = 0; i < columnCount; i++) {
      const col = el("div", "mc-link-col");
      const alignItems = textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start";
      col.style.cssText = `flex:1 1 0;display:flex;flex-direction:column;gap:2px;align-items:${alignItems};min-width:0;padding:0 12px;`;
      // Divider between columns (not on last one)
      if (i < columnCount - 1 && !mobile) {
        col.style.borderRight = `1px solid ${settings.colorSubmenuBorder || "#e5e7eb"}`;
      }

      const start = i * itemsPerCol;
      const end = Math.min(start + itemsPerCol, children.length);
      children.slice(start, end).forEach((child) => {
        if (checkMobile(settings) && child.hideOnMobile) return;
        if (!checkMobile(settings) && child.hideOnDesktop) return;

        const itemEl = buildLink(child, settings, 1);
        if (!child.isHeading) {
          itemEl.style.padding = "8px 12px";
          itemEl.style.borderRadius = "6px";
          itemEl.style.width = textAlign === "center" ? "auto" : "100%";
          itemEl.style.transition = "all 150ms ease";
          itemEl.onmouseenter = () => {
            itemEl.style.background = "rgba(0,0,0,0.04)";
            itemEl.style.transform = "translateX(3px)";
          };
          itemEl.onmouseleave = () => {
            itemEl.style.background = "transparent";
            itemEl.style.transform = "translateX(0)";
          };
        } else {
          // Heading with bottom line
          itemEl.style.paddingBottom = "8px";
          itemEl.style.marginBottom = "4px";
          itemEl.style.borderBottom = `2px solid ${settings.colorSubmenuHeading || "#b91c1c"}`;
          itemEl.style.width = "100%";
        }
        col.appendChild(itemEl);
      });
      grid.appendChild(col);
    }
    container.appendChild(grid);
    return container;
  };

  // ── 5.2 Image Block ───────────────────────────────────────────────
  const buildImageBlock = (item, settings) => {
    const container = el("div", "mc-block-image");
    container.style.cssText = "padding:12px;display:flex;flex-direction:column;gap:10px;width:100%;box-sizing:border-box;";

    const isOverlay = item.blockTemplate === "image2";
    const align = item.imageTextAlign || "left";
    const alignItems = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
    const justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

    const imgWrap = el("div", "mc-img-wrap");
    imgWrap.style.cssText = "position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:12px;transition:transform 300ms ease,box-shadow 300ms ease;";

    if (item.imageUrl) {
      const img = el("img");
      img.src = item.imageUrl;
      img.alt = item.label || "";
      img.style.cssText = "width:100%;height:100%;display:block;object-fit:cover;transition:transform 300ms ease;";
      if (!item.imageNoFill) {
        imgWrap.style.background = "#f9fafb";
        imgWrap.style.border = "1px solid #e5e7eb";
        imgWrap.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      }
      if (settings.advancedEnableLazyLoading) img.loading = "lazy";
      img.onerror = () => { img.style.display = "none"; };
      imgWrap.appendChild(img);

      // Add hover effect for images with links
      if (item.url && item.url !== "#") {
        container.style.cursor = "pointer";
        container.addEventListener("mouseenter", () => {
          img.style.transform = "scale(1.05)";
          if (!item.imageNoFill) {
            imgWrap.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
          }
        });
        container.addEventListener("mouseleave", () => {
          img.style.transform = "scale(1)";
          if (!item.imageNoFill) {
            imgWrap.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
          }
        });
      }
    } else {
      imgWrap.style.background = "linear-gradient(135deg, rgba(133,133,133,0.08) 0%, rgba(133,133,133,0.15) 100%)";
      imgWrap.style.minHeight = "180px";
      imgWrap.style.border = "1px dashed #d1d5db";
      imgWrap.innerHTML = `<svg viewBox="0 0 525.5 525.5" style="width:50%;height:50%;fill:rgba(133,133,133,0.25);"><path d="M324.5 212.7H203c-1.6 0-2.8 1.3-2.8 2.8V308c0 1.6 1.3 2.8 2.8 2.8h121.6c1.6 0 2.8-1.3 2.8-2.8v-92.5c0-1.6-1.3-2.8-2.9-2.8zm1.1 95.3c0 .6-.5 1.1-1.1 1.1H203c-.6 0-1.1-.5-1.1-1.1v-92.5c0-.6.5-1.1 1.1-1.1h121.6c.6 0 1.1.5 1.1 1.1V308z"/></svg>`;
    }
    container.appendChild(imgWrap);

    // Info section
    const hasInfo = item.label || item.description;
    if (hasInfo) {
      const info = el("div", "mc-img-info");
      info.style.cssText = `display:flex;flex-direction:column;gap:8px;text-align:${align};align-items:${alignItems};justify-content:${justifyContent};width:100%;`;

      if (isOverlay) {
        info.style.cssText += "position:absolute;left:20px;right:20px;bottom:20px;background:linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.85) 100%);backdrop-filter:blur(8px);color:#fff;padding:16px 18px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.2);";
      } else {
        info.style.marginTop = "12px";
        info.style.padding = "0 4px";
      }

      if (item.label) {
        const lbl = el("div", "mc-img-label", item.label);
        lbl.style.cssText = `font-weight:700;font-family:${settings.typographySubheadingFont};font-size:17px;line-height:1.3;letter-spacing:-0.02em;`;
        lbl.style.setProperty("color", isOverlay ? "#fff" : settings.colorSubmenuText, "important");
        info.appendChild(lbl);
      }
      if (item.description) {
        const desc = el("div", "mc-img-desc", item.description);
        desc.style.cssText = `font-size:13px;font-family:${settings.typographySubtextFont};line-height:1.4;overflow-wrap:break-word;opacity:${isOverlay ? "0.95" : "0.85"};`;
        desc.style.setProperty("color", isOverlay ? "rgba(255,255,255,0.95)" : settings.colorSubmenuDescription, "important");
        info.appendChild(desc);
      }

      if (isOverlay) {
        imgWrap.appendChild(info);
      } else {
        container.appendChild(info);
      }
    }

    // Wrap in link if URL (only add click if not already added in hover section)
    if (item.url && item.url !== "#" && !item.imageUrl) {
      container.style.cursor = "pointer";
      container.addEventListener("click", () => {
        if (item.openInNewTab) {
          window.open(item.url, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = item.url;
        }
      });
    } else if (item.url && item.url !== "#" && item.imageUrl) {
      // Click handler already added in hover section above
      container.addEventListener("click", () => {
        if (item.openInNewTab) {
          window.open(item.url, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = item.url;
        }
      });
    }

    return container;
  };

  // ── 5.3 Product Card ──────────────────────────────────────────────
  const buildProductCard = (productId, settings, layout) => {
    const product = getResource("product", productId);
    const isLeft = layout === "image-left";
    const card = el("a", "mc-product-card");
    card.style.cssText = `display:flex;flex-direction:${isLeft ? "row" : "column"};gap:${isLeft ? "12px" : "10px"};padding:0;background:transparent;text-decoration:none;color:inherit;transition:all 200ms ease;border-radius:10px;`;
    if (product && product.handle) card.href = `/products/${product.handle}`;

    const imgSize = isLeft ? 80 : "100%";
    const imgWrap = el("div", "mc-product-img-wrap");
    imgWrap.style.cssText = `width:${isLeft ? imgSize + "px" : "100%"};height:${isLeft ? imgSize + "px" : "auto"};${isLeft ? `flex:0 0 ${imgSize}px;` : "aspect-ratio:1/1;max-height:280px;"}background:#f9fafb;border:1px solid #e5e7eb;overflow:hidden;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:transform 200ms ease,box-shadow 200ms ease;`;

    const imgUrl = product?.featuredImage?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png";
    const img = el("img");
    img.src = imgUrl;
    img.alt = product?.title || "";
    img.style.cssText = "width:100%;height:100%;object-fit:contain;transition:transform 200ms ease;";
    img.onerror = () => { img.style.display = "none"; };
    if (settings.advancedEnableLazyLoading) img.loading = "lazy";
    imgWrap.appendChild(img);
    card.appendChild(imgWrap);

    const info = el("div", "mc-product-info");
    info.style.cssText = "display:flex;flex-direction:column;gap:6px;justify-content:center;flex:1;";

    const title = el("div", "mc-product-title", product?.title || "Product");
    title.style.cssText = `font-weight:600;font-size:${isLeft ? "14px" : "15px"};font-family:${settings.typographySubheadingFont};line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;transition:color 150ms ease;`;
    title.style.setProperty("color", settings.colorSubmenuText, "important");
    info.appendChild(title);

    if (product?.priceRange?.minVariantPrice) {
      const price = el("div", "mc-product-price", formatPrice(product.priceRange.minVariantPrice));
      price.style.cssText = `font-size:${isLeft ? "13px" : "14px"};font-weight:600;margin-top:2px;`;
      price.style.setProperty("color", settings.colorSubmenuHeading || "#111827", "important");
      info.appendChild(price);
    }

    if (settings.advancedShowAddToCart && product) {
      const btn = el("button", "mc-add-to-cart", "Add to Cart");
      btn.style.cssText = `margin-top:8px;padding:8px 16px;border:none;border-radius:8px;background:${settings.colorButtonBackground};color:${settings.colorButtonText};font-size:13px;font-weight:600;cursor:pointer;transition:all 200ms ease;box-shadow:0 1px 3px rgba(0,0,0,0.1);`;
      btn.onmouseenter = () => {
        btn.style.background = settings.colorButtonBackgroundHover;
        btn.style.color = settings.colorButtonTextHover;
        btn.style.transform = "translateY(-1px)";
        btn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
      };
      btn.onmouseleave = () => {
        btn.style.background = settings.colorButtonBackground;
        btn.style.color = settings.colorButtonText;
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      };
      info.appendChild(btn);
    }

    card.appendChild(info);

    card.onmouseenter = () => {
      card.style.background = "rgba(0,0,0,0.02)";
      imgWrap.style.transform = "scale(1.03)";
      imgWrap.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      title.style.color = settings.colorSubmenuTextHover || settings.colorSubmenuHeading;
    };
    card.onmouseleave = () => {
      card.style.background = "transparent";
      imgWrap.style.transform = "scale(1)";
      imgWrap.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      title.style.color = settings.colorSubmenuText;
    };

    return card;
  };

  // ── 5.4 Product Block ─────────────────────────────────────────────
  const buildProductBlock = (item, settings) => {
    const container = el("div", "mc-block-product");
    container.style.cssText = "padding:12px;display:flex;flex-direction:column;gap:12px;width:100%;box-sizing:border-box;";

    const bt = item.blockTemplate || "product";
    const isCarousel = bt === "product-carousel";
    const isHorizontal = bt === "product-horizontal" || bt === "product-grid-horizontal";
    const isGrid = bt === "product-grid" || bt === "product-grid-horizontal";
    const isList = bt === "product-list";
    const layout = item.productLayout || (isHorizontal ? "image-left" : "image-top");
    const ids = Array.isArray(item.productIds) ? item.productIds : [];

    // Heading
    const heading = (item.label || "").trim();
    if (heading) {
      const h = el("div", "mc-block-heading", heading);
      h.style.cssText = `color:${settings.colorSubmenuHeading};font-weight:700;font-family:${settings.typographySubheadingFont};font-size:18px;line-height:1.2;letter-spacing:-0.02em;margin-bottom:4px;`;
      container.appendChild(h);
      const hr = el("div");
      hr.style.cssText = `border-top:2px solid ${settings.colorSubmenuHeading};opacity:0.2;margin-bottom:8px;border-radius:2px;`;
      container.appendChild(hr);
    }

    if (isCarousel) {
      // Carousel container
      const carouselWrap = el("div", "mc-carousel-wrap");
      carouselWrap.style.cssText = "position:relative;overflow:hidden;";

      const track = el("div", "mc-carousel-track");
      track.style.cssText = "display:flex;gap:16px;transition:transform 300ms ease;";

      const pw = item.productWidth || getBlockSpan(item);
      const pageSize = pw < 10 ? 3 : 4;
      const totalPages = Math.ceil(ids.length / pageSize);
      let currentPage = 0;

      ids.forEach((id) => {
        const card = buildProductCard(id, settings, layout);
        card.style.flex = `0 0 calc(${100 / pageSize}% - ${(16 * (pageSize - 1)) / pageSize}px)`;
        track.appendChild(card);
      });

      carouselWrap.appendChild(track);

      // Navigation
      if (totalPages > 1) {
        const prevBtn = el("button", "mc-carousel-prev");
        prevBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0Z" clip-rule="evenodd"/></svg>`;
        prevBtn.style.cssText = "position:absolute;top:50%;left:4px;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;";

        const nextBtn = el("button", "mc-carousel-next");
        nextBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0Z" clip-rule="evenodd"/></svg>`;
        nextBtn.style.cssText = "position:absolute;top:50%;right:4px;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;";

        // Dots
        const dots = el("div", "mc-carousel-dots");
        dots.style.cssText = "display:flex;justify-content:center;gap:6px;margin-top:10px;";
        for (let i = 0; i < totalPages; i++) {
          const dot = el("button", "mc-dot");
          dot.style.cssText = `width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;background:${i === 0 ? "#111827" : "#cbd5e1"};padding:0;`;
          dot.addEventListener("click", () => goToPage(i));
          dots.appendChild(dot);
        }

        const updateState = () => {
          prevBtn.style.opacity = currentPage === 0 ? "0.4" : "1";
          prevBtn.style.cursor = currentPage === 0 ? "not-allowed" : "pointer";
          nextBtn.style.opacity = currentPage >= totalPages - 1 ? "0.4" : "1";
          nextBtn.style.cursor = currentPage >= totalPages - 1 ? "not-allowed" : "pointer";
          track.style.transform = `translateX(-${currentPage * 100}%)`;
          dots.querySelectorAll(".mc-dot").forEach((d, i) => {
            d.style.background = i === currentPage ? "#111827" : "#cbd5e1";
          });
        };

        const goToPage = (page) => {
          if (page < 0 || page >= totalPages) return;
          currentPage = page;
          updateState();
        };

        prevBtn.addEventListener("click", (e) => { e.stopPropagation(); goToPage(currentPage - 1); });
        nextBtn.addEventListener("click", (e) => { e.stopPropagation(); goToPage(currentPage + 1); });

        carouselWrap.appendChild(prevBtn);
        carouselWrap.appendChild(nextBtn);
        container.appendChild(carouselWrap);
        container.appendChild(dots);

        // Auto play
        if (settings.carouselAutoPlay) {
          let interval = setInterval(() => {
            const next = settings.carouselLoop ? (currentPage + 1) % totalPages : currentPage + 1;
            if (next < totalPages) goToPage(next);
            else if (!settings.carouselLoop) clearInterval(interval);
          }, 4000);
          carouselWrap.addEventListener("mouseenter", () => clearInterval(interval));
          carouselWrap.addEventListener("mouseleave", () => {
            interval = setInterval(() => {
              const next = settings.carouselLoop ? (currentPage + 1) % totalPages : currentPage + 1;
              if (next < totalPages) goToPage(next);
              else if (!settings.carouselLoop) clearInterval(interval);
            }, 4000);
          });
        }
      } else {
        container.appendChild(carouselWrap);
      }
    } else {
      // Grid / List / Standard
      const grid = el("div", "mc-product-grid");
      if (isGrid) {
        const cols = Math.min(ids.length, 2);
        grid.style.cssText = `display:grid;gap:16px;grid-template-columns:repeat(${cols}, 1fr);`;
      } else if (isList) {
        grid.style.cssText = "display:grid;gap:16px;grid-template-columns:1fr;max-width:360px;";
      } else if (isHorizontal) {
        grid.style.cssText = "display:grid;gap:16px;grid-template-columns:1fr;max-width:360px;";
      } else if (ids.length === 1) {
        grid.style.cssText = "display:grid;gap:16px;grid-template-columns:1fr;max-width:280px;";
      } else {
        grid.style.cssText = "display:grid;gap:16px;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));";
      }

      ids.forEach((id) => {
        grid.appendChild(buildProductCard(id, settings, isHorizontal || isList ? "image-left" : layout));
      });
      container.appendChild(grid);
    }

    return container;
  };

  // ── 5.5 Collection Block ──────────────────────────────────────────
  const buildCollectionBlock = (item, settings) => {
    const container = el("div", "mc-block-collection");
    container.style.cssText = "padding:12px;display:flex;flex-direction:column;gap:12px;width:100%;box-sizing:border-box;";

    const isHorizontal = item.blockTemplate === "collection-horizontal";
    const ids = Array.isArray(item.collectionIds) ? item.collectionIds : [];

    // Heading
    const heading = (item.label || "").trim();
    if (heading) {
      const h = el("div", "mc-block-heading", heading);
      h.style.cssText = `color:${settings.colorSubmenuHeading};font-weight:700;font-family:${settings.typographySubheadingFont};font-size:18px;line-height:1.2;letter-spacing:-0.02em;margin-bottom:4px;`;
      container.appendChild(h);
      const hr = el("div");
      hr.style.cssText = `border-top:2px solid ${settings.colorSubmenuHeading};opacity:0.2;margin-bottom:8px;border-radius:2px;`;
      container.appendChild(hr);
    }

    const grid = el("div", "mc-collection-grid");
    if (isHorizontal) {
      grid.style.cssText = "display:flex;flex-direction:column;gap:12px;";
    } else {
      grid.style.cssText = "display:grid;gap:16px;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));";
    }

    ids.forEach((id) => {
      const collection = getResource("collection", id);

      if (isHorizontal) {
        // Horizontal layout: image left
        const row = el("a", "mc-collection-row");
        row.style.cssText = `display:flex;align-items:center;gap:14px;text-decoration:none;color:inherit;padding:10px 12px;border-radius:10px;transition:all 200ms ease;background:transparent;`;
        if (collection?.handle) row.href = `/collections/${collection.handle}`;

        const thumb = el("div", "mc-collection-thumb");
        thumb.style.cssText = "width:70px;height:70px;flex:0 0 70px;border-radius:10px;overflow:hidden;background:#f9fafb;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:all 200ms ease;";
        const img = el("img");
        img.src = collection?.image?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png";
        img.alt = collection?.title || "";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;transition:transform 200ms ease;";
        img.onerror = () => { img.style.display = "none"; };
        if (settings.advancedEnableLazyLoading) img.loading = "lazy";
        thumb.appendChild(img);
        row.appendChild(thumb);

        const lbl = el("div", "mc-collection-label", collection?.title || "Collection");
        lbl.style.cssText = `font-weight:600;font-size:15px;font-family:${settings.typographySubheadingFont};line-height:1.3;transition:color 150ms ease;`;
        lbl.style.setProperty("color", settings.colorSubmenuText, "important");
        row.appendChild(lbl);

        row.onmouseenter = () => {
          row.style.background = "rgba(0,0,0,0.03)";
          thumb.style.transform = "scale(1.05)";
          thumb.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
          lbl.style.color = settings.colorSubmenuTextHover || settings.colorSubmenuHeading;
        };
        row.onmouseleave = () => {
          row.style.background = "transparent";
          thumb.style.transform = "scale(1)";
          thumb.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
          lbl.style.color = settings.colorSubmenuText;
        };

        grid.appendChild(row);
      } else {
        // Card layout with overlay
        const card = el("a", "mc-collection-card");
        card.style.cssText = "display:block;position:relative;border-radius:14px;overflow:hidden;text-decoration:none;background:#f9fafb;border:1px solid #e5e7eb;aspect-ratio:16/9;box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:all 250ms ease;";
        if (collection?.handle) card.href = `/collections/${collection.handle}`;

        const imgUrl = collection?.image?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png";
        const img = el("img");
        img.src = imgUrl;
        img.alt = collection?.title || "";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;transition:transform 400ms ease;";
        img.onerror = () => { img.style.display = "none"; };
        if (settings.advancedEnableLazyLoading) img.loading = "lazy";
        card.appendChild(img);

        const overlay = el("div", "mc-collection-overlay");
        overlay.style.cssText = "position:absolute;bottom:0;left:0;right:0;padding:18px 20px;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.5) 50%,transparent 100%);color:#fff;display:flex;flex-direction:column;justify-content:flex-end;height:65%;transition:padding 200ms ease;";

        const lbl = el("div", "mc-collection-label", collection?.title || "Collection");
        lbl.style.cssText = `font-weight:700;font-size:17px;font-family:${settings.typographySubheadingFont};letter-spacing:-0.01em;line-height:1.2;text-shadow:0 2px 8px rgba(0,0,0,0.3);`;
        overlay.appendChild(lbl);
        card.appendChild(overlay);

        card.onmouseenter = () => {
          img.style.transform = "scale(1.08)";
          card.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
          card.style.transform = "translateY(-2px)";
          overlay.style.paddingBottom = "24px";
        };
        card.onmouseleave = () => {
          img.style.transform = "scale(1)";
          card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
          card.style.transform = "translateY(0)";
          overlay.style.paddingBottom = "18px";
        };

        grid.appendChild(card);
      }
    });

    container.appendChild(grid);
    return container;
  };

  // ── 5.6 Blog Block ────────────────────────────────────────────────
  const buildBlogBlock = (item, settings) => {
    const container = el("div", "mc-block-blog");
    container.style.cssText = "padding:12px;display:flex;flex-direction:column;gap:12px;width:100%;box-sizing:border-box;";

    const blogId = Array.isArray(item.blogIds) ? item.blogIds[0] : null;
    const blog = getResource("blog", blogId);
    const articles = blog?.articles?.nodes || blog?.articles || [];
    const limit = item.productListCount || 3;
    const displayArticles = articles.slice(0, limit);

    // Heading
    const blogTitle = (item.label || blog?.title || "Blog").trim();
    if (blogTitle) {
      const h = el("div", "mc-block-heading", blogTitle);
      h.style.cssText = `color:${settings.colorSubmenuHeading};font-weight:700;font-family:${settings.typographySubheadingFont};font-size:18px;line-height:1.2;letter-spacing:-0.02em;margin-bottom:4px;`;
      container.appendChild(h);
      const hr = el("div");
      hr.style.cssText = `border-top:2px solid ${settings.colorSubmenuHeading};opacity:0.2;margin-bottom:8px;border-radius:2px;`;
      container.appendChild(hr);
    }

    const list = el("div", "mc-blog-list");
    list.style.cssText = "display:flex;flex-direction:column;gap:8px;";

    displayArticles.forEach((article) => {
      const row = el("a", "mc-blog-row");
      row.href = blog ? `/blogs/${blog.handle}/${article.handle}` : "#";
      row.style.cssText = `display:flex;align-items:center;gap:14px;padding:10px 12px;border-radius:10px;text-decoration:none;color:inherit;transition:all 200ms ease;background:transparent;`;

      const thumbWrap = el("div", "mc-blog-thumb");
      thumbWrap.style.cssText = "width:60px;height:60px;flex:0 0 60px;border-radius:8px;overflow:hidden;background:#f9fafb;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:all 200ms ease;";
      const img = el("img");
      img.src = article.image?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-lifestyle-2_large.png";
      img.alt = article.title || "";
      img.style.cssText = "width:100%;height:100%;object-fit:cover;transition:transform 200ms ease;";
      img.onerror = () => { img.style.display = "none"; };
      if (settings.advancedEnableLazyLoading) img.loading = "lazy";
      thumbWrap.appendChild(img);
      row.appendChild(thumbWrap);

      const textWrap = el("div", "mc-blog-text");
      textWrap.style.cssText = "flex:1;display:flex;flex-direction:column;gap:2px;min-width:0;";

      const title = el("div", "mc-blog-title", article.title);
      title.style.cssText = `font-size:14px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;transition:color 150ms ease;`;
      title.style.setProperty("color", settings.colorSubmenuText, "important");
      textWrap.appendChild(title);

      row.appendChild(textWrap);

      row.onmouseenter = () => {
        row.style.background = "rgba(0,0,0,0.03)";
        thumbWrap.style.transform = "scale(1.05)";
        thumbWrap.style.boxShadow = "0 4px 10px rgba(0,0,0,0.12)";
        title.style.color = settings.colorSubmenuTextHover || settings.colorSubmenuHeading;
      };
      row.onmouseleave = () => {
        row.style.background = "transparent";
        thumbWrap.style.transform = "scale(1)";
        thumbWrap.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        title.style.color = settings.colorSubmenuText;
      };

      list.appendChild(row);
    });

    container.appendChild(list);
    return container;
  };

  // ── 5.7 Contact Block ─────────────────────────────────────────────
  const buildContactBlock = (item, settings) => {
    const container = el("div", "mc-block-contact");
    container.style.cssText = "padding:20px;display:flex;flex-direction:column;gap:16px;width:100%;box-sizing:border-box;background:rgba(0,0,0,0.01);border-radius:12px;border:1px solid rgba(0,0,0,0.06);";

    if (item.contactTitle) {
      const title = el("h3", "mc-contact-title", item.contactTitle);
      title.style.cssText = `color:${settings.colorSubmenuHeading};font-family:${settings.typographySubheadingFont};font-weight:700;font-size:18px;margin:0;letter-spacing:-0.01em;line-height:1.2;`;
      container.appendChild(title);
    }
    if (item.contactDescription) {
      const desc = el("p", "mc-contact-desc", item.contactDescription);
      desc.style.cssText = `color:${settings.colorSubmenuDescription};font-size:14px;margin:0;line-height:1.5;opacity:0.9;`;
      container.appendChild(desc);
    }

    const form = el("form", "mc-contact-form");
    form.style.cssText = "display:flex;flex-direction:column;gap:12px;";

    const inputStyle = "width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box;outline:none;transition:all 200ms ease;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.04);";

    const row1 = el("div", "mc-contact-row");
    row1.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";

    const nameInput = el("input");
    nameInput.type = "text";
    nameInput.name = "name";
    nameInput.placeholder = item.contactNameLabel || "Name";
    nameInput.style.cssText = inputStyle;
    nameInput.onfocus = () => {
      nameInput.style.borderColor = settings.colorSubmenuHeading;
      nameInput.style.boxShadow = `0 0 0 3px ${settings.colorSubmenuHeading}15`;
      nameInput.style.transform = "translateY(-1px)";
    };
    nameInput.onblur = () => {
      nameInput.style.borderColor = "#e5e7eb";
      nameInput.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
      nameInput.style.transform = "translateY(0)";
    };
    row1.appendChild(nameInput);

    const emailInput = el("input");
    emailInput.type = "email";
    emailInput.name = "email";
    emailInput.placeholder = item.contactEmailLabel || "Email";
    emailInput.required = true;
    emailInput.style.cssText = inputStyle;
    emailInput.onfocus = () => {
      emailInput.style.borderColor = settings.colorSubmenuHeading;
      emailInput.style.boxShadow = `0 0 0 3px ${settings.colorSubmenuHeading}15`;
      emailInput.style.transform = "translateY(-1px)";
    };
    emailInput.onblur = () => {
      emailInput.style.borderColor = "#e5e7eb";
      emailInput.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
      emailInput.style.transform = "translateY(0)";
    };
    row1.appendChild(emailInput);
    form.appendChild(row1);

    if (item.contactPhoneLabel !== undefined) {
      const phoneInput = el("input");
      phoneInput.type = "tel";
      phoneInput.name = "phone";
      phoneInput.placeholder = item.contactPhoneLabel || "Phone";
      phoneInput.style.cssText = inputStyle;
      phoneInput.onfocus = () => {
        phoneInput.style.borderColor = settings.colorSubmenuHeading;
        phoneInput.style.boxShadow = `0 0 0 3px ${settings.colorSubmenuHeading}15`;
        phoneInput.style.transform = "translateY(-1px)";
      };
      phoneInput.onblur = () => {
        phoneInput.style.borderColor = "#e5e7eb";
        phoneInput.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
        phoneInput.style.transform = "translateY(0)";
      };
      form.appendChild(phoneInput);
    }

    const msgInput = el("textarea");
    msgInput.name = "message";
    msgInput.placeholder = item.contactMessageLabel || "Message";
    msgInput.style.cssText = inputStyle + "height:100px;resize:vertical;min-height:80px;max-height:200px;";
    msgInput.onfocus = () => {
      msgInput.style.borderColor = settings.colorSubmenuHeading;
      msgInput.style.boxShadow = `0 0 0 3px ${settings.colorSubmenuHeading}15`;
      msgInput.style.transform = "translateY(-1px)";
    };
    msgInput.onblur = () => {
      msgInput.style.borderColor = "#e5e7eb";
      msgInput.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
      msgInput.style.transform = "translateY(0)";
    };
    form.appendChild(msgInput);

    const submitBtn = el("button", "mc-contact-submit", item.contactSubmitLabel || "Send Message");
    submitBtn.type = "submit";
    submitBtn.style.cssText = `background:${settings.colorButtonBackground};color:${settings.colorButtonText};border:none;padding:14px 28px;border-radius:10px;cursor:pointer;font-weight:700;font-size:15px;width:100%;transition:all 200ms ease;box-shadow:0 2px 8px rgba(0,0,0,0.12);letter-spacing:0.01em;`;
    submitBtn.onmouseenter = () => {
      submitBtn.style.background = settings.colorButtonBackgroundHover;
      submitBtn.style.color = settings.colorButtonTextHover;
      submitBtn.style.transform = "translateY(-2px)";
      submitBtn.style.boxShadow = "0 6px 16px rgba(0,0,0,0.18)";
    };
    submitBtn.onmouseleave = () => {
      submitBtn.style.background = settings.colorButtonBackground;
      submitBtn.style.color = settings.colorButtonText;
      submitBtn.style.transform = "translateY(0)";
      submitBtn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
    };
    form.appendChild(submitBtn);

    const successMsg = el("div", "mc-contact-success");
    successMsg.textContent = item.contactSuccessMessage || "✓ Thank you! Your message has been sent successfully.";
    successMsg.style.cssText = "display:none;color:#16a34a;font-size:14px;padding:14px 18px;text-align:center;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-weight:500;";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
      try {
        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());
        const res = await fetch("/apps/menucraft/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        if (res.ok) {
          form.style.display = "none";
          successMsg.style.display = "block";
        } else {
          submitBtn.textContent = item.contactSubmitLabel || "Send";
          submitBtn.disabled = false;
        }
      } catch (err) {
        submitBtn.textContent = item.contactSubmitLabel || "Send";
        submitBtn.disabled = false;
      }
    });

    container.appendChild(form);
    container.appendChild(successMsg);
    return container;
  };

  // ── 5.8 HTML Block ────────────────────────────────────────────────
  const buildHtmlBlock = (item, settings) => {
    const container = el("div", "mc-block-html");
    container.style.cssText = "padding:10px;width:100%;box-sizing:border-box;";

    if (item.label && item.label.toLowerCase() !== "custom html") {
      const title = el("div", "mc-html-title", item.label);
      title.style.cssText = `color:${settings.colorSubmenuHeading};font-family:${settings.typographySubheadingFont};font-weight:600;font-size:16px;margin-bottom:10px;`;
      container.appendChild(title);
    }

    const content = el("div", "mc-html-content");
    content.style.cssText = `font-family:${settings.typographySubtextFont};font-size:${settings.typographySubtextSize}px;line-height:1.5;`;
    content.style.setProperty("color", settings.colorSubmenuText, "important");
    content.innerHTML = item.htmlContent || "";
    container.appendChild(content);
    return container;
  };

  // ── 5.9 Space Block ───────────────────────────────────────────────
  const buildSpaceBlock = (item) => {
    const div = el("div", "mc-block-space");
    div.style.cssText = "height:20px;width:100%;";
    return div;
  };

  /* ═══════════════════════════════════════════════════════════════════
     Section 6 — Submenu Renderers
     ═══════════════════════════════════════════════════════════════════ */

  const buildBlockByType = (child, settings) => {
    const bt = child.blockTemplate;
    if (!bt || bt === "none") {
      // Default: render as link list if has children, else single link
      if (child.children && child.children.length > 0) {
        return buildLinkListBlock(child, settings);
      }
      const wrapper = el("div", "mc-block-default");
      wrapper.appendChild(buildLink(child, settings, 1));
      return wrapper;
    }
    if (bt === "links" || bt === "links-easy" || bt === "links-3" || bt === "links-icons") return buildLinkListBlock(child, settings);
    if (bt === "image" || bt === "image2") return buildImageBlock(child, settings);
    if (bt === "product" || bt === "product-horizontal" || bt === "product-grid" || bt === "product-carousel" || bt === "product-list" || bt === "product-grid-horizontal") return buildProductBlock(child, settings);
    if (bt === "collection" || bt === "collection-horizontal") return buildCollectionBlock(child, settings);
    if (bt === "blogs" || bt === "blogs-latest") return buildBlogBlock(child, settings);
    if (bt === "contact") return buildContactBlock(child, settings);
    if (bt === "html" || bt === "html-special") return buildHtmlBlock(child, settings);
    if (bt === "space") return buildSpaceBlock(child);
    if (bt === "tabs") return buildTabsContent(child, settings);
    if (bt && bt.startsWith("multi")) return buildMultiBlock(child, settings);

    // Fallback
    const wrapper = el("div", "mc-block-default");
    if (child.children && child.children.length) {
      wrapper.appendChild(buildSimpleList(child.children, settings, 1));
    } else {
      wrapper.appendChild(buildLink(child, settings, 1));
    }
    return wrapper;
  };

  // ── Multi-layout blocks ───────────────────────────────────────────
  const buildMultiBlock = (item, settings) => {
    const container = el("div", "mc-block-multi");
    container.style.cssText = "display:flex;flex-wrap:wrap;gap:16px;width:100%;box-sizing:border-box;";

    const children = item.children || [];
    children.forEach((child) => {
      const block = buildBlockByType(child, settings);
      const span = getBlockSpan(child);
      const pct = (span / 12) * 100;
      block.style.flex = `0 1 calc(${pct}% - 16px)`;
      block.style.minWidth = "120px";
      container.appendChild(block);
    });
    return container;
  };

  // ── Simple list (for dropdown items) ──────────────────────────────
  const buildSimpleList = (items, settings, depth) => {
    const list = el("ul", "mc-submenu-list");
    list.style.cssText = "list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;";
    const safe = Array.isArray(items) ? items : [];
    const mobile = checkMobile(settings);

    safe.forEach((item) => {
      if (!item) return;
      if (mobile && item.hideOnMobile) return;
      if (!mobile && item.hideOnDesktop) return;

      const li = el("li", "mc-submenu-item");
      li.style.cssText = "position:relative;display:block;padding:2px 0;";

      const link = buildLink(item, settings, depth);
      link.style.padding = "8px 12px";
      link.style.borderRadius = "8px";
      link.style.transition = "all 150ms ease";
      link.onmouseenter = () => {
        link.style.background = "rgba(0,0,0,0.04)";
        link.style.transform = "translateX(4px)";
      };
      link.onmouseleave = () => {
        link.style.background = "transparent";
        link.style.transform = "translateX(0)";
      };
      li.appendChild(link);

      // Nested children in dropdown
      if (item.children && item.children.length > 0) {
        const nested = buildSimpleList(item.children, settings, depth + 1);
        nested.style.paddingLeft = "16px";
        nested.style.marginTop = "4px";
        li.appendChild(nested);
      }

      list.appendChild(li);
    });
    return list;
  };

  // ── 6.1 Mega content ──────────────────────────────────────────────
  const buildMegaContent = (parentItem, settings) => {
    const container = el("div", "mc-mega-container");
    const maxW = parseCssSize(parentItem.submenuMaxWidth || settings.submenuMaxWidth || settings.layoutMaxWidth || "1200px");

    // CSS Grid: 12-column grid — each item spans its columns naturally
    container.style.cssText = `display:grid;grid-template-columns:repeat(12, 1fr);gap:0;width:100%;max-width:${maxW};margin:0 auto;padding:16px 0;box-sizing:border-box;`;

    const items = Array.isArray(parentItem.children) ? parentItem.children : [];

    items.forEach((child) => {
      const block = buildBlockByType(child, settings);
      const span = getBlockSpan(child);

      block.style.gridColumn = `span ${span}`;
      block.style.minWidth = "0";
      block.style.boxSizing = "border-box";
      block.style.overflow = "hidden";

      container.appendChild(block);
    });
    return container;
  };

  // ── 6.2 Dropdown content ──────────────────────────────────────────
  const buildDropdownContent = (parentItem, settings) => {
    const container = el("div", "mc-dropdown-content");
    container.style.cssText = "display:flex;flex-direction:column;gap:2px;padding:10px 6px;min-width:200px;max-width:300px;width:auto;";

    // Submenu width
    if (parentItem.submenuWidth === "full") {
      container.style.width = "100%";
      container.style.maxWidth = "none";
    } else if (parentItem.submenuCustomWidth) {
      container.style.width = `${parentItem.submenuCustomWidth}px`;
      container.style.minWidth = "auto";
      container.style.maxWidth = "none";
    }

    const items = Array.isArray(parentItem.children) ? parentItem.children : [];
    items.forEach((child) => {
      if (child.blockTemplate && child.blockTemplate !== "none") {
        container.appendChild(buildBlockByType(child, settings));
      } else {
        const itemEl = el("div", "mc-dropdown-item");
        itemEl.style.cssText = `padding:12px 18px;min-height:${settings.spacingLinkListRowHeight}px;display:flex;align-items:center;justify-content:space-between;transition:all 150ms ease;border-radius:8px;position:relative;`;
        const link = buildLink(child, settings, 1);
        itemEl.appendChild(link);

        // Add arrow indicator if has children
        if (child.children && child.children.length > 0) {
          const arrow = el("span", "mc-submenu-arrow");
          arrow.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 4l4 4-4 4V4z"/></svg>`;
          arrow.style.cssText = "margin-left:8px;display:flex;align-items:center;opacity:0.5;";
          itemEl.appendChild(arrow);
        }

        itemEl.onmouseenter = () => {
          itemEl.style.background = "rgba(0,0,0,0.04)";
          itemEl.style.transform = "translateX(4px)";
        };
        itemEl.onmouseleave = () => {
          itemEl.style.background = "transparent";
          itemEl.style.transform = "translateX(0)";
        };

        // Nested dropdown flyout for child items
        if (child.children && child.children.length > 0) {
          const wrapper = el("div", "mc-dropdown-wrapper");
          wrapper.style.cssText = "position:relative;";

          // Check if children have block templates (links, images, etc.)
          const hasBlocks = child.children.some((c) => c.blockTemplate && c.blockTemplate !== "none");

          const nestedPanel = el("div", "mc-nested-dropdown");
          if (hasBlocks) {
            // Fixed width panel for mega content grid — 4 columns at 25% = 900px works well
            const panelWidth = 900;

            nestedPanel.style.cssText = `position:absolute;left:100%;top:0;width:${panelWidth}px;background:${settings.colorSubmenuBackground};border:1px solid ${settings.colorSubmenuBorder};border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);padding:16px;opacity:0;visibility:hidden;transition:all 200ms ease;pointer-events:none;z-index:1000;margin-left:8px;overflow:hidden;box-sizing:border-box;`;

            // If panel would overflow right, open to the left instead
            requestAnimationFrame(() => {
              const rect = nestedPanel.getBoundingClientRect();
              if (rect.right > window.innerWidth - 16) {
                nestedPanel.style.left = "auto";
                nestedPanel.style.right = "100%";
                nestedPanel.style.marginLeft = "0";
                nestedPanel.style.marginRight = "8px";
              }
              // Also clamp if still overflows (e.g. small viewport)
              const rect2 = nestedPanel.getBoundingClientRect();
              if (rect2.right > window.innerWidth - 16) {
                nestedPanel.style.width = `${window.innerWidth - rect2.left - 32}px`;
              }
              if (rect2.left < 16) {
                nestedPanel.style.width = `${rect2.right - 32}px`;
                nestedPanel.style.left = `-${rect2.left - 16}px`;
                nestedPanel.style.right = "auto";
              }
            });

            // Build mega content — override maxWidth to fill the panel
            const megaContent = buildMegaContent(child, settings);
            megaContent.style.maxWidth = "100%";
            megaContent.style.padding = "0";
            nestedPanel.appendChild(megaContent);
          } else {
            // Simple list for plain links
            nestedPanel.style.cssText = `position:absolute;left:100%;top:0;min-width:200px;background:${settings.colorSubmenuBackground};border:1px solid ${settings.colorSubmenuBorder};border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:8px;opacity:0;visibility:hidden;transition:all 200ms ease;pointer-events:none;z-index:1000;margin-left:8px;`;
            const nestedList = buildSimpleList(child.children, settings, 2);
            nestedPanel.appendChild(nestedList);
          }

          wrapper.appendChild(itemEl);
          wrapper.appendChild(nestedPanel);

          // Show/hide nested on hover
          let hideTimeout;
          wrapper.onmouseenter = () => {
            clearTimeout(hideTimeout);
            nestedPanel.style.opacity = "1";
            nestedPanel.style.visibility = "visible";
            nestedPanel.style.pointerEvents = "auto";
          };
          wrapper.onmouseleave = () => {
            hideTimeout = setTimeout(() => {
              nestedPanel.style.opacity = "0";
              nestedPanel.style.visibility = "hidden";
              nestedPanel.style.pointerEvents = "none";
            }, 150);
          };

          container.appendChild(wrapper);
        } else {
          container.appendChild(itemEl);
        }
      }
    });
    return container;
  };

  // ── 6.3 Horizontal dropdown content ───────────────────────────────
  const buildHorizontalDropdownContent = (parentItem, settings) => {
    const container = el("div", "mc-hdropdown-content");
    container.style.cssText = "display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;padding:0;align-items:stretch;width:max-content;";

    const items = Array.isArray(parentItem.children) ? parentItem.children : [];
    items.forEach((child) => {
      if (child.blockTemplate && child.blockTemplate !== "none") {
        const block = buildBlockByType(child, settings);
        block.style.flex = "0 0 auto";
        container.appendChild(block);
      } else {
        const hasNested = child.children && child.children.length > 0;

        const wrapper = el("div", "mc-hdropdown-wrapper");
        wrapper.style.cssText = "position:relative;flex:0 0 auto;display:flex;";

        const itemEl = el("div", "mc-hdropdown-item");
        itemEl.style.cssText = `padding:14px 28px;display:flex;align-items:center;white-space:nowrap;transition:all 150ms ease;flex:0 0 auto;cursor:pointer;gap:6px;background:transparent;`;

        const linkWrapper = buildLink(child, settings, 1);
        linkWrapper.style.width = "auto";
        linkWrapper.style.whiteSpace = "nowrap";
        // Bigger font
        const lnk = linkWrapper.querySelector(".mc-link");
        if (lnk) {
          lnk.style.fontSize = `${Math.max(settings.typographySubtextSize, 15)}px`;
          lnk.style.fontWeight = "500";
        }
        itemEl.appendChild(linkWrapper);

        if (hasNested) {
          const arrow = el("span", "mc-hdropdown-arrow");
          arrow.innerHTML = `<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style="opacity:0.4;"><path d="M4 6l4 4 4-4"/></svg>`;
          arrow.style.cssText = "display:flex;align-items:center;flex-shrink:0;transition:transform 200ms ease;";
          itemEl.appendChild(arrow);
        }

        wrapper.appendChild(itemEl);

        // Nested flyout dropdown
        if (hasNested) {
          const nestedPanel = el("div", "mc-hdropdown-nested");
          nestedPanel.style.cssText = `position:absolute;left:0;top:100%;min-width:200px;background:${settings.colorSubmenuBackground};${settings.submenuShowBorder ? `border:1px solid ${settings.colorSubmenuBorder};` : ""}border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:8px;opacity:0;visibility:hidden;transition:all 200ms ease;pointer-events:none;z-index:1001;margin-top:2px;`;

          const nestedList = buildSimpleList(child.children, settings, 2);
          nestedPanel.appendChild(nestedList);
          wrapper.appendChild(nestedPanel);

          let hideTimeout;
          wrapper.onmouseenter = () => {
            clearTimeout(hideTimeout);
            itemEl.style.background = "rgba(0,0,0,0.05)";
            const arrow = itemEl.querySelector(".mc-hdropdown-arrow");
            if (arrow) arrow.style.transform = "rotate(180deg)";
            nestedPanel.style.opacity = "1";
            nestedPanel.style.visibility = "visible";
            nestedPanel.style.pointerEvents = "auto";
          };
          wrapper.onmouseleave = () => {
            itemEl.style.background = "transparent";
            const arrow = itemEl.querySelector(".mc-hdropdown-arrow");
            if (arrow) arrow.style.transform = "rotate(0deg)";
            hideTimeout = setTimeout(() => {
              nestedPanel.style.opacity = "0";
              nestedPanel.style.visibility = "hidden";
              nestedPanel.style.pointerEvents = "none";
            }, 150);
          };
        } else {
          itemEl.onmouseenter = () => { itemEl.style.background = "rgba(0,0,0,0.05)"; };
          itemEl.onmouseleave = () => { itemEl.style.background = "transparent"; };
        }

        container.appendChild(wrapper);
      }
    });
    return container;
  };

  // ── 6.4 Tab content ───────────────────────────────────────────────
  const buildTabsContent = (parentItem, settings) => {
    const container = el("div", "mc-tabs-container");
    const template = parentItem.submenuTemplate || parentItem.blockTemplate || "simple-left-tabs";

    const isTop = template.includes("top");
    const isRight = template.includes("right") && !template.includes("nested-tabs-right");
    const isNestedRight = template.includes("nested-tabs-right");
    const isNested = template.includes("two-level") || template.includes("three-level") || template.includes("two-nested") || template.includes("three-nested") || template.includes("two-top") || template.includes("three-top");

    container.style.cssText = `display:flex;width:100%;background:transparent;${isTop ? "flex-direction:column;" : isRight ? "flex-direction:row-reverse;" : "flex-direction:row;"}`;

    const tabsMenu = el("div", "mc-tabs-menu");
    const contentArea = el("div", "mc-tabs-content-area");
    contentArea.style.cssText = "flex:1;";

    if (isTop) {
      tabsMenu.style.cssText = `flex:0 0 auto;display:flex;flex-direction:row;border-bottom:1px solid ${settings.colorSubmenuBorder};overflow-x:auto;gap:0;`;
    } else if (isRight || isNestedRight) {
      tabsMenu.style.cssText = `flex:0 0 200px;display:flex;flex-direction:column;border-left:1px solid ${settings.colorSubmenuBorder};background:rgba(0,0,0,0.01);`;
    } else {
      tabsMenu.style.cssText = `flex:0 0 200px;display:flex;flex-direction:column;border-right:1px solid ${settings.colorSubmenuBorder};background:rgba(0,0,0,0.01);`;
    }

    const tabs = Array.isArray(parentItem.children) ? parentItem.children : [];
    const contentPanels = [];

    tabs.forEach((tab, index) => {
      const tabBtn = el("div", "mc-tab-item", tab.label || "Tab");
      tabBtn.style.cssText = `padding:14px 20px;cursor:pointer;font-family:${settings.typographyTabFont};font-weight:${settings.typographyTabWeight};font-size:${settings.typographyTabSize}px;color:${settings.colorTabHeading};transition:all 0.2s;text-align:${isRight || isNestedRight ? "right" : "left"};white-space:nowrap;`;

      if (isTop) {
        tabBtn.style.borderBottom = "3px solid transparent";
      } else if (isRight || isNestedRight) {
        tabBtn.style.borderRight = "3px solid transparent";
      } else {
        tabBtn.style.borderLeft = "3px solid transparent";
      }

      const panel = el("div", "mc-tab-panel");
      panel.style.cssText = "display:none;padding:10px 0 10px 20px;box-sizing:border-box;overflow:visible;";

      if (isNested && tab.children && tab.children.length > 0) {
        // Nested tabs: render children as sub-tabs
        const subTabContainer = buildTabsContent({
          ...tab,
          submenuTemplate: isTop || template.includes("top") ? "simple-top-tabs" : isNestedRight ? "simple-left-tabs" : "simple-left-tabs",
        }, settings);
        panel.appendChild(subTabContainer);
      } else {
        // Regular: render tab content
        panel.appendChild(buildSubmenuContent(tab, settings));
      }

      contentPanels.push(panel);

      if (index === 0) {
        tabBtn.classList.add("is-active");
        if (isTop) {
          tabBtn.style.borderBottomColor = settings.colorSubmenuHeading;
        } else if (isRight || isNestedRight) {
          tabBtn.style.borderRightColor = settings.colorSubmenuHeading;
        } else {
          tabBtn.style.borderLeftColor = settings.colorSubmenuHeading;
        }
        tabBtn.style.background = settings.colorTabBackgroundActive;
        tabBtn.style.color = settings.colorTabHeadingActive;
        panel.style.display = "block";
      }

      const activate = () => {
        tabsMenu.querySelectorAll(".mc-tab-item").forEach((b) => {
          b.classList.remove("is-active");
          b.style.background = "transparent";
          b.style.color = settings.colorTabHeading;
          if (isTop) b.style.borderBottomColor = "transparent";
          else if (isRight || isNestedRight) b.style.borderRightColor = "transparent";
          else b.style.borderLeftColor = "transparent";
        });
        contentPanels.forEach((p) => (p.style.display = "none"));
        tabBtn.classList.add("is-active");
        tabBtn.style.background = settings.colorTabBackgroundActive;
        tabBtn.style.color = settings.colorTabHeadingActive;
        if (isTop) tabBtn.style.borderBottomColor = settings.colorSubmenuHeading;
        else if (isRight || isNestedRight) tabBtn.style.borderRightColor = settings.colorSubmenuHeading;
        else tabBtn.style.borderLeftColor = settings.colorSubmenuHeading;
        panel.style.display = "block";
      };

      tabBtn.addEventListener("mouseenter", activate);
      tabBtn.addEventListener("click", activate);

      tabsMenu.appendChild(tabBtn);
      contentArea.appendChild(panel);
    });

    if (isRight || isNestedRight) {
      container.appendChild(contentArea);
      container.appendChild(tabsMenu);
    } else {
      container.appendChild(tabsMenu);
      container.appendChild(contentArea);
    }

    return container;
  };

  // ── 6.5 Submenu content router ────────────────────────────────────
  const buildSubmenuContent = (parentItem, settings) => {
    const tmpl = parentItem.submenuTemplate;
    console.log("[MenuCraft Debug] submenuTemplate:", tmpl, "submenuType:", parentItem.submenuType, "label:", parentItem.label);

    // Tab templates
    if (isTabTemplate(tmpl)) {
      return buildTabsContent(parentItem, settings);
    }

    // Horizontal dropdown (check BEFORE regular dropdown)
    if (tmpl === "horizontal-dropdown" || parentItem.submenuType === "horizontal-dropdown") {
      return buildHorizontalDropdownContent(parentItem, settings);
    }

    // Dropdown
    if (tmpl === "dropdown" || tmpl === "custom-normal-dropdown" || parentItem.submenuType === "dropdown") {
      return buildDropdownContent(parentItem, settings);
    }

    // Mega menu (default for items with block templates)
    if (isMegaMenu(parentItem)) {
      return buildMegaContent(parentItem, settings);
    }

    // Default: simple dropdown list
    return buildDropdownContent(parentItem, settings);
  };

  /* ═══════════════════════════════════════════════════════════════════
     Section 7 — Main Menu Renderer
     ═══════════════════════════════════════════════════════════════════ */
  const renderMenu = (menu) => {
    const settings = normalizeSettings(menu.settings);
    const mobile = checkMobile(settings);
    const bp = settings.advancedMobileBreakpoint || 768;

    const container = el("nav", "mc-menu");
    container.setAttribute("aria-label", "Main menu");
    container.style.setProperty("background", settings.colorMainBackground, "important");
    container.style.setProperty("color", settings.colorMainText, "important");
    container.style.minHeight = `${settings.spacingMainRowHeight}px`;

    const inner = el("div", "mc-menu-inner");
    const maxW = parseCssSize(settings.layoutMaxWidth);
    if (maxW) inner.style.maxWidth = maxW;

    const currentPath = window.location.pathname;
    const list = el("ul", "mc-menu-list");
    if (settings.layoutAlignment === "center") list.style.justifyContent = "center";
    else if (settings.layoutAlignment === "right") list.style.justifyContent = "flex-end";

    const items = Array.isArray(menu.items) ? menu.items : [];

    items.forEach((item) => {
      if (!item) return;
      if (mobile && item.hideOnMobile) return;
      if (!mobile && item.hideOnDesktop) return;
      if (!item.label && !item.icon && (!item.children || item.children.length === 0) && !item.blockTemplate) return;

      const li = el("li", "mc-menu-item");
      const isActive = item.url === currentPath || (item.url === "/" && currentPath === "/");
      if (isActive) li.classList.add("is-active");
      if (item.extraClassName) li.classList.add(item.extraClassName);

      // Per-item background
      if (item.customBackgroundColor) {
        li.style.setProperty("background", item.customBackgroundColor, "important");
      }

      const link = buildLink(item, settings, 0);
      li.appendChild(link);

      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      if (hasChildren) {
        li.classList.add("has-children");
        if (isMegaMenu(item)) li.classList.add("is-mega");
        if (item.submenuTemplate === "dropdown" || item.submenuTemplate === "custom-normal-dropdown" || item.submenuType === "dropdown") {
          li.classList.add("is-dropdown");
        }
        if (item.submenuTemplate === "horizontal-dropdown" || item.submenuType === "horizontal-dropdown") {
          li.classList.add("is-hdropdown");
        }

        if (settings.elementsShowIndicators) {
          const indicator = el("span", "mc-indicator", "▾");
          li.appendChild(indicator);
        }

        const submenu = el("div", "mc-submenu");

        // Per-item submenu background
        if (item.submenuBackgroundColor) {
          submenu.style.setProperty("background", item.submenuBackgroundColor, "important");
        }
        if (item.submenuBackgroundImage) {
          submenu.style.backgroundImage = `url(${item.submenuBackgroundImage})`;
          submenu.style.backgroundSize = "cover";
          submenu.style.backgroundPosition = "center";
        }

        // Submenu width for non-mega
        if (!isMegaMenu(item)) {
          const isHorizontalDropdown = item.submenuTemplate === "horizontal-dropdown" || item.submenuType === "horizontal-dropdown";

          if (item.submenuCustomWidth) {
            submenu.style.width = `${item.submenuCustomWidth}px`;
            submenu.style.maxWidth = "none";
          } else if (isHorizontalDropdown) {
            // Horizontal dropdown: max-content forces panel to be as wide as its row content
            submenu.style.width = "max-content";
            submenu.style.maxWidth = "none";
            submenu.style.minWidth = "0";
          } else {
            // Regular dropdown: narrower width
            submenu.style.maxWidth = "320px";
            submenu.style.width = "auto";
          }
        }

        submenu.appendChild(buildSubmenuContent(item, settings));
        li.appendChild(submenu);

        // Desktop trigger
        if (!mobile && settings.animationDesktopTrigger === "click") {
          li.addEventListener("click", (e) => {
            if (e.target.closest(".mc-submenu")) return;
            e.preventDefault();
            e.stopPropagation();
            const isOpen = li.classList.contains("is-open");
            // Close all siblings
            list.querySelectorAll(".mc-menu-item.is-open").forEach((s) => s.classList.remove("is-open"));
            if (!isOpen) li.classList.add("is-open");
          });
        }
      }

      list.appendChild(li);
    });

    inner.appendChild(list);

    // Search
    if (settings.elementsShowSearch) {
      const searchBox = el("div", "mc-search-wrapper");
      const searchLink = el("a", "mc-search-link");
      searchLink.href = "/search";
      searchLink.setAttribute("aria-label", "Search");
      searchLink.innerHTML = `<svg viewBox="0 0 20 20" style="width:20px;height:20px;fill:currentColor;"><path fill-rule="evenodd" d="M12.322 13.383a5.5 5.5 0 1 1 1.06-1.06l2.835 2.835a.75.75 0 1 1-1.06 1.06l-2.835-2.835ZM11.5 8.75a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0Z" clip-rule="evenodd"/></svg>`;
      searchBox.appendChild(searchLink);
      inner.appendChild(searchBox);
    }

    container.appendChild(inner);

    // ── CSS Generation ────────────────────────────────────────────
    const styleTag = document.createElement("style");
    const rootId = root.id;
    const animEffect = settings.animationEffect || "fade";
    const animDur = settings.animationDuration || 300;
    const animDelay = settings.animationDelay || 150;

    let submenuTransform, submenuTransformActive;
    if (animEffect === "slide") {
      submenuTransform = "translateY(10px)";
      submenuTransformActive = "translateY(0)";
    } else if (animEffect === "scale") {
      submenuTransform = "scale(0.95) translateY(5px)";
      submenuTransformActive = "scale(1) translateY(0)";
    } else {
      submenuTransform = "translateY(6px)";
      submenuTransformActive = "translateY(0)";
    }

    styleTag.textContent = `
      /* ── Base ── */
      #${rootId} { width:100%; }
      .mc-menu { width:100%;position:relative;z-index:999;overflow:visible; }
      .mc-menu * { box-sizing:border-box; }
      .mc-menu-inner { width:100%;margin:0 auto;padding:0;display:flex;align-items:stretch;justify-content:${settings.layoutAlignment === "center" ? "center" : settings.layoutAlignment === "right" ? "flex-end" : "flex-start"}; }
      .mc-menu-list {
        display:flex !important;align-items:stretch !important;flex-wrap:nowrap !important;overflow:visible !important;
        gap:0;list-style:none !important;margin:0 !important;padding:0 !important;width:fit-content !important;
        background:${settings.colorMainBackground} !important;
        border:${settings.elementsShowDesktopDivider ? `1px solid ${settings.colorMainDivider}` : "none"} !important;
      }
      .mc-menu-list::-webkit-scrollbar { display:none; }

      /* ── Menu Items ── */
      .mc-menu-item {
        position:relative !important;display:flex !important;align-items:center !important;
        padding:0 ${settings.spacingMainPadding}px !important;min-height:${settings.spacingMainRowHeight}px !important;
        background:${settings.colorMainBackground} !important;color:${settings.colorMainText} !important;
        border:none !important;
        ${settings.elementsShowDesktopDivider ? `border-right:1px solid ${settings.colorMainDivider} !important;` : ""}
        transition:background-color 0.2s ease !important;cursor:pointer !important;
      }
      .mc-menu-item:last-child { border-right:none !important; }
      .mc-menu-item:hover {
        background:${settings.colorMainBackgroundHover} !important;color:${settings.colorMainTextHover} !important;
      }
      .mc-menu-item:hover .mc-link { color:${settings.colorMainTextHover} !important; }
      .mc-menu-item.is-active { opacity:1 !important; }

      /* ── Links ── */
      .mc-link {
        color:inherit !important;text-decoration:none !important;display:inline-flex !important;align-items:center !important;
        height:100% !important;font-family:${settings.typographyMainFont} !important;
        font-weight:${settings.typographyMainWeight} !important;font-size:${settings.typographyMainSize}px !important;
        white-space:nowrap !important;background:transparent !important;
      }
      .mc-submenu .mc-link {
        white-space:normal !important;overflow-wrap:anywhere !important;
        font-family:${settings.typographySubtextFont} !important;
        font-weight:${settings.typographySubtextWeight} !important;
        font-size:${settings.typographySubtextSize}px !important;
        color:${settings.colorSubmenuText} !important;
      }
      .mc-submenu .mc-link:hover { color:${settings.colorSubmenuTextHover} !important; }
      .mc-link-desc, .mc-img-label, .mc-img-desc, .mc-product-title { overflow-wrap:break-word !important; }

      /* ── Indicator ── */
      .mc-indicator { font-size:12px !important;margin-left:6px !important;transition:transform 0.2s !important;color:inherit !important; }
      .mc-menu-item:hover .mc-indicator { transform:translateY(2px) !important; }

      /* ── Headings ── */
      .mc-heading {
        margin: 0; padding: 0 !important;
        font-weight:700 !important;
        color:${settings.colorSubmenuHeading} !important;
        width:fit-content;
      }

      /* ── Submenu Panel ── */
      .mc-submenu {
        position:absolute;left:0;top:100%;
        background:${settings.colorSubmenuBackground};
        color:${settings.colorSubmenuText} !important;
        ${settings.submenuShowBorder ? `border:1px solid ${settings.colorSubmenuBorder};` : ""}
        padding:0;min-width:240px;
        box-shadow:0 10px 30px rgba(0,0,0,0.12);
        display:none;z-index:1000;
        opacity:0;transform:${submenuTransform};
        transition:opacity ${animDur}ms ease ${animDelay}ms, transform ${animDur}ms ease ${animDelay}ms;
      }
      .mc-submenu::before {
        content:"";position:absolute;top:-30px;left:0;width:100%;height:30px;background:transparent;
      }

      /* ── Mega submenu ── */
      .mc-menu-item.is-mega { position:static !important; }
      .mc-menu-item.is-mega > .mc-submenu {
        transform:${submenuTransform} !important;
        box-sizing:border-box !important;min-height:unset !important;
        padding:0 !important;background:${settings.colorSubmenuBackground} !important;
      }

      /* ── Desktop hover ── */
      @media (min-width:${bp + 1}px) {
        ${settings.animationDesktopTrigger === "hover" ? `
        .mc-menu-item.has-children:hover > .mc-submenu {
          display:block !important;opacity:1 !important;transform:${submenuTransformActive} !important;
        }
        ` : `
        .mc-menu-item.has-children.is-open > .mc-submenu {
          display:block !important;opacity:1 !important;transform:${submenuTransformActive} !important;
        }
        `}
        .mc-menu-item.is-mega:hover > .mc-submenu,
        .mc-menu-item.is-mega.is-open > .mc-submenu {
          transform:${submenuTransformActive} !important;
        }
      }

      /* ── Mega container ── */
      .mc-mega-container {
        display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;
        width:100%;max-width:100%;margin:0 auto;padding:20px;box-sizing:border-box;
      }
      .mc-tabs-content-area .mc-mega-container { justify-content:flex-start !important; }
      .mc-mega-container > div { overflow:hidden;box-sizing:border-box; }
      .mc-menu-item.is-mega > .mc-submenu { overflow:hidden; }

      /* ── Product card ── */
      .mc-product-card { border:none;overflow:hidden;background:transparent;transition:all 150ms ease; }
      .mc-product-card:hover { background:rgba(0,0,0,0.04);border-radius:8px; }
      .mc-product-grid { scrollbar-width:none; }
      .mc-product-grid::-webkit-scrollbar { display:none; }

      /* ── Tabs ── */
      .mc-tabs-container { display:flex;width:100%;background:transparent; }
      .mc-tabs-menu { display:flex;flex-direction:column; }
      .mc-tab-item { padding:14px 20px;cursor:pointer;transition:all 0.2s; }
      .mc-tab-item:hover { background:rgba(0,0,0,0.03); }

      /* ── Badge ── */
      .mc-badge { display:inline-flex;align-items:center;margin-left:6px; }

      /* ── Search ── */
      .mc-search-wrapper {
        margin-left:auto;display:flex;align-items:center;padding:0 10px;
        border-left:1px solid ${settings.colorMainDivider};
      }
      .mc-search-link {
        color:inherit;text-decoration:none;display:flex;align-items:center;justify-content:center;
        padding:10px;transition:opacity 0.2s;
      }
      .mc-search-link:hover { opacity:0.7; }

      /* ── Submenu list ── */
      .mc-submenu-list { list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px; }

      /* ── Horizontal dropdown ── */
      .mc-menu-item.is-hdropdown > .mc-submenu {
        max-width:none !important;width:max-content !important;min-width:0 !important;
      }
      .mc-hdropdown-content {
        display:flex !important;flex-direction:row !important;flex-wrap:nowrap !important;
        gap:0 !important;align-items:stretch !important;padding:0 !important;width:max-content !important;
      }
      .mc-hdropdown-content > * { flex:0 0 auto !important;white-space:nowrap !important; }
      .mc-hdropdown-content .mc-hdropdown-item {
        flex:0 0 auto !important;white-space:nowrap !important;display:flex !important;
        align-items:center !important;
      }
      .mc-hdropdown-content .mc-link-wrapper { width:auto !important;white-space:nowrap !important; }
      .mc-hdropdown-content .mc-link-text { flex:0 0 auto !important; }
      .mc-hdropdown-content .mc-link { white-space:nowrap !important; }

      /* ── Contact form responsive ── */
      @media (max-width:600px) {
        .mc-contact-row { grid-template-columns:1fr !important; }
      }

      /* ── Carousel ── */
      .mc-carousel-wrap { position:relative;overflow:hidden; }
      .mc-carousel-track { display:flex;gap:16px;transition:transform 300ms ease; }
      .mc-carousel-prev, .mc-carousel-next {
        position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;
        border-radius:50%;border:1px solid #e5e7eb;background:#fff;
        box-shadow:0 1px 3px rgba(0,0,0,0.1);cursor:pointer;display:flex;
        align-items:center;justify-content:center;z-index:2;
      }
      .mc-carousel-prev { left:4px; }
      .mc-carousel-next { right:4px; }

      /* ═══════════════════════════════════════════════════════════
         Mobile Styles
         ═══════════════════════════════════════════════════════════ */
      @media (max-width:${bp}px) {
        .mc-menu {
          display:none;background:${settings.colorMainBackground} !important;color:${settings.colorMainText} !important;
        }
        .mc-mobile-show .mc-menu,
        .mc-menu.is-mobile-active,
        [class*="drawer"] .mc-menu,
        [class*="mobile-menu"] .mc-menu,
        details-disclosure .mc-menu,
        .menu-drawer .mc-menu { display:block !important; }

        .mc-menu.is-mobile-active {
          z-index:999999 !important;position:relative !important;
          left:0 !important;right:auto !important;margin:0 !important;width:100% !important;
          transform:none !important;box-sizing:border-box !important;
          background-color:${settings.colorMainBackground} !important;
        }
        .mc-menu-list {
          flex-direction:column !important;background:${settings.colorMainBackground} !important;
          width:100% !important;border:none !important;display:flex !important;padding:0 !important;
        }
        .mc-menu-item {
          width:100% !important;border-right:none !important;
          ${settings.elementsShowMobileDivider ? `border-bottom:1px solid ${settings.colorMainDivider} !important;` : ""}
          position:relative !important;display:flex !important;flex-direction:row !important;
          flex-wrap:wrap !important;align-items:center !important;
          background:${settings.colorMainBackground} !important;color:${settings.colorMainText} !important;
          padding:0 !important;box-sizing:border-box !important;
        }
        .mc-link-wrapper {
          flex:1 !important;padding:15px !important;display:flex !important;align-items:center !important;color:inherit !important;
        }
        .mc-indicator { padding-right:15px !important;color:inherit !important;flex-shrink:0 !important; }
        .mc-link, .mc-link-desc { color:inherit !important; }

        .mc-submenu,
        .mc-menu-item.is-mega > .mc-submenu {
          position:static !important;width:100% !important;flex:0 0 100% !important;
          left:auto !important;right:auto !important;box-shadow:none !important;
          display:none !important;opacity:1 !important;transform:none !important;
          padding:20px !important;background:${settings.colorSubmenuBackground} !important;
          color:${settings.colorSubmenuText} !important;border:none !important;
          min-height:0 !important;box-sizing:border-box !important;
        }
        .mc-menu-item.has-children.is-open > .mc-submenu { display:block !important; }
        .mc-menu-item.is-open > .mc-indicator { transform:rotate(180deg) !important; }

        .mc-mega-container {
          display:flex !important;flex-direction:column !important;width:100% !important;
          max-width:100% !important;margin:0 !important;padding:0 !important;gap:20px !important;
          background:transparent !important;
        }
        .mc-block-product, .mc-block-links, .mc-block-image,
        .mc-block-html, .mc-block-contact, .mc-block-collection, .mc-block-blog,
        .mc-mega-container > div {
          width:100% !important;margin:0 0 16px 0 !important;padding:0 !important;
          flex:0 0 100% !important;max-width:100% !important;
        }
        .mc-product-grid, .mc-links-grid, .mc-collection-grid {
          display:flex !important;flex-direction:column !important;gap:16px !important;overflow:visible !important;
        }
        .mc-product-grid { grid-template-columns:1fr !important; }
        .mc-collection-grid { grid-template-columns:1fr !important; }

        /* Mobile link accordion */
        .mc-link-col .mc-link-wrapper { display:none !important; }
        .mc-link-col.is-open .mc-link-wrapper { display:flex !important; }
        .mc-heading-wrapper { cursor:pointer; }
        .mc-heading-toggle {
          margin-left:auto;font-size:14px;transition:transform 0.2s;color:${settings.colorSubmenuHeading};
          flex-shrink:0;
        }
        .mc-link-col.is-open .mc-heading-toggle { transform:rotate(180deg); }

        .mc-product-card {
          width:100% !important;max-width:100% !important;flex:0 0 100% !important;
          display:flex !important;flex-direction:column !important;
          background:transparent !important;margin:0 !important;color:${settings.colorSubmenuText} !important;
        }
        .mc-product-img-wrap { width:100% !important;height:auto !important;aspect-ratio:1/1 !important; }

        /* Tabs mobile: stack */
        .mc-tabs-container { flex-direction:column !important; }
        .mc-tabs-menu {
          flex:0 0 auto !important;flex-direction:row !important;overflow-x:auto !important;
          border-right:none !important;border-left:none !important;border-bottom:1px solid ${settings.colorSubmenuBorder} !important;
        }
        .mc-tab-panel { padding:10px 0 !important; }

        /* Carousel mobile */
        .mc-carousel-track > * { flex:0 0 100% !important; }

        .mc-search-wrapper { display:none !important; }
      }

      ${settings.customCss || ""}
    `;

    // ── Mount ─────────────────────────────────────────────────────
    const mountTarget = getMountTarget(settings);
    if (!mountTarget) return;

    root.innerHTML = "";

    const isMobileBreakpoint = window.innerWidth <= bp;
    if (isMobileBreakpoint) {
      container.classList.add("is-mobile-active");
    }

    root.appendChild(container);

    const existingStyle = document.head.querySelector("style[data-menucraft]");
    if (existingStyle) existingStyle.remove();
    styleTag.setAttribute("data-menucraft", "true");
    document.head.appendChild(styleTag);

    mountTarget.prepend(root);

    const shouldReplace = settings.layoutLocation === "replaceNavigation" || settings.layoutLocation === "auto";
    if (shouldReplace) {
      hideExistingNavigation(settings);
    }

    if (isMobileBreakpoint) {
      setupMobileInteractions(container, settings);
    }

    // Close desktop click-triggered menus when clicking outside
    if (!mobile && settings.animationDesktopTrigger === "click") {
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".mc-menu")) {
          list.querySelectorAll(".mc-menu-item.is-open").forEach((s) => s.classList.remove("is-open"));
        }
      });
    }

    // Position full-width submenus (mega + full-width dropdowns) via JS
    if (!isMobileBreakpoint) {
      const positionFullWidthSubmenus = () => {
        const nav = container;
        const navRect = nav.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        // Mega submenus
        nav.querySelectorAll(".mc-menu-item.is-mega > .mc-submenu").forEach((sub) => {
          sub.style.left = `-${navRect.left}px`;
          sub.style.width = `${vw}px`;
        });
        // Non-mega full-width submenus
        nav.querySelectorAll('.mc-submenu[data-full-width="true"]').forEach((sub) => {
          sub.style.left = `-${navRect.left}px`;
          sub.style.width = `${vw}px`;
        });
      };
      // Run after mount
      requestAnimationFrame(positionFullWidthSubmenus);
      // Recalculate on resize
      window.addEventListener("resize", positionFullWidthSubmenus);
      // Prevent horizontal scrollbar
      document.documentElement.style.overflowX = "clip";
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
     Section 9 — Mount & Navigation
     ═══════════════════════════════════════════════════════════════════ */
  const hideExistingNavigation = (settings) => {
    const selectors = [
      "#HeaderMenu", ".header__inline-menu",
      "nav[aria-label='Main menu']", "nav[aria-label='Main navigation']",
      ".site-nav", ".main-menu", ".header__menu", "header nav",
      ".header__menu-item", ".header__menu-items", ".header__menu-wrapper",
      ".site-header__menu", ".header-nav", ".navigation", ".nav-bar",
      ".menu-drawer__menu", ".mobile-nav", ".mobile-menu-list",
      ".drawer__menu", ".drawer__nav-list", ".mobile-menu nav", ".nav-drawer-menu",
    ];
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((e) => {
        if (e === root || e.contains(root) || root.contains(e)) return;
        const hasMC = (e.className && typeof e.className === "string" && e.className.includes("mc-")) || (e.id && e.id.includes("menucraft"));
        if (hasMC) return;
        e.setAttribute("data-menucraft-hidden", "true");
        e.style.display = "none";
      });
    });
  };

  const getMountTarget = (settings) => {
    const bp = settings.advancedMobileBreakpoint || 768;
    const mobile = window.matchMedia(`(max-width: ${bp}px)`).matches;

    if (settings.layoutLocation === "cssSelector") {
      const selector = mobile ? settings.layoutCssSelectorMobile : settings.layoutCssSelectorDesktop;
      if (selector) {
        const target = document.querySelector(selector);
        if (target) return target;
      }
    }

    if (mobile) {
      const fallbacks = [
        ".menu-drawer__navigation", ".menu-drawer__inner-container",
        ".js-menu-drawer__menu", ".drawer__menu-page",
        ".mobile-nav-wrapper", "#MobileNav",
        ".drawer__inner", ".drawer__main", ".mobile-menu",
        ".header__drawer nav", ".nav-drawer", "#AccessibleNav",
        "aside.drawer-menu", ".slideout-menu", ".mobile-menu-container",
        '[id^="Drawer"]',
      ];
      for (const s of fallbacks) {
        const t = document.querySelector(s);
        if (t) return t;
      }
      return null;
    }

    if (root.id === "menucraft-block-root" && root.parentElement) {
      return root.parentElement;
    }

    return document.querySelector("header") || document.querySelector(".site-header") || document.body;
  };

  const setupMobileInteractions = (container, settings) => {
    const itemsWithChildren = container.querySelectorAll(".mc-menu-item.has-children");
    itemsWithChildren.forEach((item) => {
      if (item.dataset.mobileSetup === "true") return;
      item.dataset.mobileSetup = "true";
      item.style.cursor = "pointer";

      const link = item.querySelector(".mc-link");
      if (link) link.addEventListener("click", (e) => e.preventDefault());

      item.addEventListener("click", (e) => {
        if (e.target.closest(".mc-submenu")) return;
        e.preventDefault();
        e.stopPropagation();
        const wasOpen = item.classList.contains("is-open");
        Array.from(item.parentNode.children).forEach((sibling) => {
          if (sibling !== item && sibling.classList.contains("mc-menu-item")) {
            sibling.classList.remove("is-open");
          }
        });
        if (wasOpen) item.classList.remove("is-open");
        else item.classList.add("is-open");
      });

      item.classList.remove("is-open");
    });

    // Link list heading accordion
    container.querySelectorAll(".mc-link-col").forEach((col) => {
      if (col.dataset.accordionSetup === "true") return;
      col.dataset.accordionSetup = "true";

      const heading = col.querySelector(".mc-heading-wrapper");
      if (!heading) return;

      // Add toggle chevron
      const toggle = el("span", "mc-heading-toggle", "▾");
      heading.appendChild(toggle);
      heading.style.cursor = "pointer";

      heading.addEventListener("click", (e) => {
        e.stopPropagation();
        col.classList.toggle("is-open");
      });
    });
  };

  /* ═══════════════════════════════════════════════════════════════════
     Section 10 — Loader
     ═══════════════════════════════════════════════════════════════════ */
  const doRender = (data) => {
    if (!data || !data.menu || data.menu.status !== "active") return false;
    window.MenuCraftData = data;

    const tryRender = (retries) => {
      const bp = (data.menu.settings && data.menu.settings.advancedMobileBreakpoint) || 768;
      const mobile = window.matchMedia(`(max-width: ${bp}px)`).matches;
      const mountTarget = getMountTarget(data.menu.settings || {});

      if (mobile && !mountTarget && retries < 15) {
        setTimeout(() => tryRender(retries + 1), 1000);
        return;
      }
      if (!mountTarget) return;
      renderMenu(data.menu);
    };

    tryRender(0);
    return true;
  };

  const loadMenu = async () => {
    // 1. Cache-first: render instantly from sessionStorage if available
    let renderedFromCache = false;
    try {
      const cached = sessionStorage.getItem("MenuCraftData");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.menu && parsed.menu.status === "active") {
          renderedFromCache = doRender(parsed);
        }
      }
    } catch (e) { /* ignore cache errors */ }

    // 2. Always fetch fresh data from proxy (background refresh)
    try {
      const response = await fetch(PROXY_URL + window.location.search, { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || !data.menu) return;

      try { sessionStorage.setItem("MenuCraftData", JSON.stringify(data)); } catch (e) { /* ignore */ }

      // Only re-render if data changed or we didn't render from cache
      if (!renderedFromCache) {
        doRender(data);
      } else {
        // Update resources silently (products/collections may have changed)
        window.MenuCraftData = data;
      }
    } catch (error) {
      // If fetch fails but we rendered from cache, that's still OK
      if (!renderedFromCache) {
        console.error("[MenuCraft] Load failed", error);
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadMenu);
  } else {
    loadMenu();
  }
  document.addEventListener("turbo:load", loadMenu);
  document.addEventListener("turbolinks:load", loadMenu);
})();
