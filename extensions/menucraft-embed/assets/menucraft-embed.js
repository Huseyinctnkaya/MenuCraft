(() => {
  if (window.__menucraftEmbedLoaded) return;
  window.__menucraftEmbedLoaded = true;

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
    layoutLocation: "replaceNavigation",
    layoutCssSelectorDesktop: "#SiteNav",
    layoutCssSelectorMobile: "#AccessibleNav",
    layoutOrientation: "horizontal",
    layoutAlignment: "left",
    layoutMaxWidth: "",
    spacingMainPadding: 20,
    spacingMainRowHeight: 50,
    spacingDropdownRowHeight: 50,
    spacingTabRowHeight: 50,
    spacingLinkListRowHeight: 30,
    typographyMainFont: "Work Sans, system-ui, sans-serif",
    typographyMainWeight: 500,
    typographyMainSize: 14,
    typographyMainFont: "Work Sans, system-ui, sans-serif",
    typographyMainWeight: 500,
    typographyMainSize: 14,
    typographySubheadingFont: "Work Sans, system-ui, sans-serif",
    typographySubheadingWeight: 600,
    typographySubheadingSize: 14,
    typographySubtextFont: "Work Sans, system-ui, sans-serif",
    typographySubtextWeight: 400,
    typographySubtextSize: 13,
    colorMainBackground: "#000000",
    colorMainBackgroundHover: "#1D1D1D",
    colorMainDivider: "#0F0F0F",
    colorMainText: "#FFFFFF",
    colorMainTextHover: "#F6F1F1",
    colorSubmenuBackground: "#FFFFFF",
    colorSubmenuBorder: "#D1D1D1",
    colorSubmenuHeading: "#AE2828",
    colorSubmenuText: "#313131",
    colorSubmenuText: "#313131",
    colorSubmenuTextHover: "#000000",
    colorTabHeading: "#202020",
    colorTabHeadingActive: "#000000",
    colorTabBackgroundActive: "#D9D9D9",
    colorBadgeSaleText: "#FFFFFF",
    colorBadgeSaleBackground: "#D32F2F",
    colorBadgeSoldOutText: "#FFFFFF",
    colorBadgeSoldOutBackground: "#757575",
    colorButtonText: "#FFFFFF",
    colorButtonBackground: "#000000",
    colorButtonBackgroundHover: "#333333",
    colorButtonTextHover: "#FFFFFF",
    colorSubmenuDescription: "#666666",
    colorSubmenuDescriptionHover: "#333333",
    customCss: "",
    submenuShowBorder: true,
    submenuEnableDesktopScroll: true,
    submenuEnableMobileScroll: true,
    submenuMaxWidth: "",
    submenuMobileStyle: "collapse",
    elementsShowIndicators: true,
    elementsShowSearch: false,
  };

  const normalizeSettings = (raw) => {
    if (!raw || typeof raw !== "object") {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...raw };
  };

  const createElement = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };

  const buildLink = (item, settings, depth = 0) => {
    if (item.isHeading) {
      const span = createElement("span", "menucraft-menu-heading");
      span.textContent = item.label || "";
      span.style.fontFamily = settings.typographySubheadingFont;
      span.style.fontWeight = String(settings.typographySubheadingWeight);
      span.style.fontSize = `${settings.typographySubheadingSize}px`;
      span.style.color = settings.colorSubmenuHeading;
      span.style.display = "block";
      span.style.padding = "8px 0";
      return span;
    }

    const wrapper = createElement("div", "menucraft-link-wrapper");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";

    if (item.icon) {
      let iconSrc = item.icon;
      const resolved = getResource("icons", item.icon);
      if (resolved) iconSrc = resolved;

      const iconContainer = createElement("div", "menucraft-link-icon");
      iconContainer.style.width = "20px";
      iconContainer.style.height = "20px";
      iconContainer.style.display = "flex";
      iconContainer.style.alignItems = "center";
      iconContainer.style.justifyContent = "center";
      iconContainer.style.flexShrink = "0";

      if (iconSrc.trim().startsWith("<svg")) {
        iconContainer.innerHTML = iconSrc;
        const svg = iconContainer.querySelector("svg");
        if (svg) {
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.fill = "currentColor";
        }
      } else {
        const img = createElement("img");
        img.src = iconSrc;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        // Hide broken images
        img.onerror = () => { img.style.display = "none"; };
        iconContainer.appendChild(img);
      }
      wrapper.appendChild(iconContainer);
    }

    const textContent = createElement("div", "menucraft-link-text-content");
    const link = createElement("a", "menucraft-menu-link");
    link.href = item.url || "#";

    let label = item.label || "";
    if (!label && item.productIds?.length) {
      const p = getResource("product", item.productIds[0]);
      if (p) label = p.title;
    } else if (!label && item.collectionIds?.length) {
      const c = getResource("collection", item.collectionIds[0]);
      if (c) label = c.title;
    }

    link.textContent = label;
    link.style.fontFamily = settings.typographyMainFont;
    link.style.fontWeight = String(settings.typographyMainWeight);
    link.style.fontSize = `${settings.typographyMainSize}px`;
    if (item.openInNewTab) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    textContent.appendChild(link);

    if (item.description) {
      const desc = createElement("div", "menucraft-link-description", item.description);
      desc.style.fontSize = depth > 0 ? "14px" : `${settings.typographySubtextSize}px`;
      desc.style.color = settings.colorSubmenuDescription;
      desc.style.marginTop = "2px";
      desc.style.lineHeight = "1.2";
      textContent.appendChild(desc);
    }

    wrapper.appendChild(textContent);
    return wrapper;
  };

  const buildMenuItems = (items, settings, depth = 0) => {
    const list = createElement("ul", depth === 0 ? "menucraft-menu-list" : "menucraft-submenu-list");
    items.forEach((item) => {
      if (!item || item.hideOnDesktop) return;

      const li = createElement("li", depth === 0 ? "menucraft-menu-item" : "menucraft-submenu-item");
      const link = buildLink(item, settings, depth);
      li.appendChild(link);

      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      if (hasChildren) {
        li.classList.add("has-children");
        if (isMegaMenu(item)) li.classList.add("is-mega");

        if (settings.elementsShowIndicators) {
          const indicator = createElement("span", "menucraft-indicator", "▾");
          li.appendChild(indicator);
        }
        const submenu = createElement("div", "menucraft-submenu");
        submenu.appendChild(buildSubmenuContent(item, settings));
        li.appendChild(submenu);
      }

      list.appendChild(li);
    });
    return list;
  };

  const hideExistingNavigation = (rootId) => {
    const selectors = [
      "#HeaderMenu",
      ".header__inline-menu",
      "nav[aria-label='Main menu']",
      "nav[aria-label='Main navigation']",
      ".site-nav",
      ".main-menu",
      ".header__menu",
      "header nav",
      ".header__menu-item",
      ".header__menu-items",
      ".header__menu-wrapper",
      ".site-header__menu",
      ".header-nav",
      ".navigation",
      ".nav-bar",
    ];

    selectors.forEach((selector) => {
      const el = document.querySelector(selector);
      if (el && !el.closest(`#${rootId}`)) {
        el.setAttribute("data-menucraft-hidden", "true");
        el.style.display = "none";
      }
    });
  };

  const getMountTarget = (settings) => {
    const rootId = root.id;

    if (settings.layoutLocation === "cssSelector") {
      const mobileBreakpoint = settings.advancedMobileBreakpoint || 768;
      const isMobile = window.innerWidth <= mobileBreakpoint;
      const selector = isMobile
        ? settings.layoutCssSelectorMobile
        : settings.layoutCssSelectorDesktop;

      if (selector) {
        const target = document.querySelector(selector);
        if (target) return target;
      }
    }

    const shouldReplace = settings.layoutLocation === "replaceNavigation" || settings.layoutLocation === "auto";
    if (shouldReplace) {
      hideExistingNavigation(rootId);
    }
    if (rootId === "menucraft-block-root" && root.parentElement) {
      return root.parentElement;
    }
    const header =
      document.querySelector("header") ||
      document.querySelector(".header") ||
      document.querySelector(".site-header") ||
      document.body;
    return header;
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

    // Normalize logic from preview
    let normalized = amount;
    const raw = String(priceObj.amount);
    if (!raw.includes(".") && !raw.includes(",") && raw.length > 4) {
      normalized = amount / 100;
    } else if (raw.endsWith("00") && !raw.includes(".") && !raw.includes(",")) {
      normalized = amount / 100;
    }

    try {
      // Builder uses tr-TR for USD/TRY to get the dot thousand, comma decimal look
      if (currency === "USD" || currency === "TRY") {
        const formatted = normalized.toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        return currency === "USD" ? `$ ${formatted}` : `₺ ${formatted}`;
      }
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2
      }).format(normalized);
    } catch (e) {
      return `${currency} ${normalized.toFixed(2)}`;
    }
  };

  const getBlockSpan = (item) => {
    if (item.blockTemplate === "links") return item.linkWidth || 3;
    if (item.blockTemplate?.startsWith("image")) return item.imageWidth || 3;
    if (item.blockTemplate?.startsWith("product")) return item.productWidth || 3;
    if (item.blockTemplate?.startsWith("collection")) return item.imageWidth || 3;
    if (item.blockTemplate?.startsWith("blog")) return item.imageWidth || 4;
    if (item.blockTemplate === "contact") return 6;
    if (item.blockTemplate === "html") return 6;
    if (item.blockTemplate === "space") return item.linkWidth || 1;
    return 3;
  };

  const buildProductCard = (productId, settings, layout = "column") => {
    const product = getResource("product", productId);
    const container = createElement("a", "menucraft-product-card");
    const isImageLeft = layout === "row";

    container.style.display = "flex";
    container.style.flexDirection = isImageLeft ? "row" : "column";
    container.style.gap = "12px";
    container.style.padding = "0";
    container.style.background = "transparent";
    container.style.textDecoration = "none";
    container.style.color = "inherit";
    container.style.transition = "all 150ms ease";

    if (product?.handle) {
      container.href = `/products/${product.handle}`;
    }

    const productImageSize = isImageLeft ? 74 : "100%";
    const imageWrapper = createElement("div", "menucraft-product-image-wrapper");
    imageWrapper.style.width = isImageLeft ? `${productImageSize}px` : "100%";
    imageWrapper.style.height = isImageLeft ? `${productImageSize}px` : "auto";
    imageWrapper.style.flex = isImageLeft ? `0 0 ${productImageSize}px` : "undefined";
    imageWrapper.style.background = "#f3f4f4";
    imageWrapper.style.border = "1px solid #e5e7eb";
    // imageWrapper.style.borderRadius = "0"; // Builder uses 0 for inner image box
    imageWrapper.style.overflow = "hidden";
    imageWrapper.style.display = "flex";
    imageWrapper.style.alignItems = "center";
    imageWrapper.style.justifyContent = "center";
    imageWrapper.style.boxSizing = "border-box";

    const imgUrl = product?.featuredImage?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png";
    const img = createElement("img");
    img.src = imgUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.onerror = () => { img.style.display = "none"; };
    imageWrapper.appendChild(img);
    container.appendChild(imageWrapper);

    const info = createElement("div", "menucraft-product-info");
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "6px";
    info.style.justifyContent = "center";

    const title = createElement("div", "menucraft-product-title", product?.title || "Example Product Title");
    title.style.fontWeight = "600";
    title.style.fontSize = "14px";
    title.style.fontFamily = settings.typographySubheadingFont;
    title.style.color = settings.colorSubmenuText || "#111";
    title.style.lineHeight = "1.2";
    info.appendChild(title);

    if (product?.priceRange?.minVariantPrice) {
      const price = createElement("div", "menucraft-product-price");
      price.textContent = formatPrice(product.priceRange.minVariantPrice);
      price.style.fontSize = "13px";
      price.style.fontWeight = "400";
      price.style.color = settings.colorSubmenuDescription || "#888";
      info.appendChild(price);
    }
    container.appendChild(info);

    return container;
  };

  const buildProductBlock = (item, settings) => {
    const container = createElement("div", "menucraft-block-product-group");
    container.style.borderRadius = "16px";
    container.style.padding = "5px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";

    const productWidth = getBlockSpan(item);
    const isCarousel = item.blockTemplate === "product-carousel";
    const layout = item.productLayout || (item.blockTemplate === "product-horizontal" ? "image-left" : "image-top");
    const isImageLeft = layout === "image-left";

    const ids = Array.isArray(item.productIds) ? item.productIds : [];

    // Heading handling check
    const productHeading = (item.label || "").trim();
    if (productHeading) {
      const heading = createElement("div", "menucraft-product-block-heading");
      heading.textContent = productHeading;
      heading.style.color = settings.colorSubmenuHeading;
      heading.style.fontWeight = "600";
      heading.style.fontFamily = settings.typographySubheadingFont;
      heading.style.fontSize = "18px";
      heading.style.fontWeight = "700";
      heading.style.lineHeight = "1.3";
      heading.style.letterSpacing = "-0.01em";
      heading.style.marginBottom = "10px";
      container.appendChild(heading);

      const hr = createElement("div");
      hr.style.borderTop = `1px solid ${settings.colorSubmenuHeading}`;
      hr.style.opacity = "0.5";
      container.appendChild(hr);
    }

    const grid = createElement("div", "menucraft-product-grid");
    if (isCarousel) {
      grid.style.display = "flex";
      grid.style.gap = "16px";
      grid.style.overflowX = "auto";
      grid.style.paddingBottom = "10px";
    } else {
      grid.style.display = "grid";
      grid.style.gap = "16px";
      if (isImageLeft || ids.length === 1) {
        grid.style.gridTemplateColumns = "1fr";
      } else {
        grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(210px, 1fr))";
      }
    }

    ids.forEach(id => {
      const card = buildProductCard(id, settings, isImageLeft ? "row" : "column");
      if (isCarousel) {
        const carouselPageSize = productWidth < 10 ? 3 : 4;
        card.style.flex = `0 0 calc(${100 / carouselPageSize}% - ${(16 * (carouselPageSize - 1)) / carouselPageSize}px)`;
      }
      grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
  };

  const buildHtmlBlock = (item) => {
    const container = createElement("div", "menucraft-block-html");
    container.innerHTML = item.htmlContent || "";
    return container;
  };

  const buildContactBlock = (item, settings) => {
    const container = createElement("div", "menucraft-block-contact");
    const title = createElement("h3", "menucraft-contact-title", item.contactTitle || "Contact Us");
    container.appendChild(title);

    const form = createElement("form", "menucraft-contact-form");
    form.innerHTML = `
        <div style="margin-bottom: 12px;"><input type="text" placeholder="${item.contactNameLabel || 'Name'}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;"></div>
        <div style="margin-bottom: 12px;"><input type="email" placeholder="${item.contactEmailLabel || 'Email'}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;"></div>
        <div style="margin-bottom: 12px;"><textarea placeholder="${item.contactMessageLabel || 'Message'}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; height: 100px; font-size: 16px;"></textarea></div>
        <button type="submit" style="background: ${settings.colorButtonBackground}; color: ${settings.colorButtonText}; border: none; padding: 14px 28px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px; width: 100%;">${item.contactSubmitLabel || 'Send'}</button>
    `;
    container.appendChild(form);
    return container;
  };

  const buildLinkListBlock = (group, settings) => {
    const container = createElement("div", "menucraft-block-links");
    container.style.borderRadius = "16px";
    container.style.padding = "6px 12px 12px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "12px";

    const columnCount = Math.max(1, group.linkColumns || 1);
    const children = group.children || [];
    const headingItem = children.find(c => c.isHeading);
    const linkItems = children.filter(c => !c.isHeading);

    if (headingItem) {
      const hWrapper = createElement("div", "menucraft-link-list-heading-wrapper");
      hWrapper.style.display = "flex";
      hWrapper.style.flexDirection = "column";

      const hLink = buildLink(headingItem, settings, 1);
      hLink.style.padding = "4px 8px";
      hWrapper.appendChild(hLink);

      const hr = createElement("div");
      hr.style.borderTop = `1px solid ${settings.colorSubmenuHeading}`;
      hr.style.opacity = "0.5";
      hWrapper.appendChild(hr);

      container.appendChild(hWrapper);
    }

    const grid = createElement("div", "menucraft-block-links-grid");
    grid.style.display = "flex";
    grid.style.gap = "32px";

    const itemsPerColumn = Math.ceil(linkItems.length / columnCount);
    for (let i = 0; i < columnCount; i++) {
      const column = createElement("div", "menucraft-block-column");
      column.style.flex = "1 1 0";
      column.style.display = "flex";
      column.style.flexDirection = "column";
      column.style.gap = "6px";

      const start = i * itemsPerColumn;
      const end = Math.min(start + itemsPerColumn, linkItems.length);
      const columnItems = linkItems.slice(start, end);

      columnItems.forEach(item => {
        const itemBtn = buildLink(item, settings, 1);
        itemBtn.style.padding = "6px 8px";
        itemBtn.style.borderRadius = "8px";
        itemBtn.style.width = "100%";

        // Add hover effect for button look
        itemBtn.onmouseenter = () => {
          itemBtn.style.background = "rgba(0,0,0,0.04)";
        };
        itemBtn.onmouseleave = () => {
          itemBtn.style.background = "transparent";
        };

        column.appendChild(itemBtn);
      });
      grid.appendChild(column);
    }
    container.appendChild(grid);
    return container;
  };

  const buildImageBlock = (item, settings) => {
    const container = createElement("div", "menucraft-block-image");
    container.style.borderRadius = "16px";
    container.style.padding = "5px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";

    const isOverlay = item.blockTemplate === "image2";
    const imageAlign = item.imageTextAlign || "left";
    const textAlignItems = imageAlign === "center" ? "center" : imageAlign === "right" ? "flex-end" : "flex-start";

    const imgWrapper = createElement("div", "menucraft-image-block-wrapper");
    imgWrapper.style.position = "relative";
    imgWrapper.style.overflow = "hidden";
    imgWrapper.style.display = "flex";
    imgWrapper.style.alignItems = "center";
    imgWrapper.style.justifyContent = "center";

    if (item.imageUrl) {
      const img = createElement("img");
      img.src = item.imageUrl;
      img.style.width = "100%";
      img.style.display = "block";
      imgWrapper.appendChild(img);
    } else {
      imgWrapper.style.background = "rgba(133, 133, 133, 0.1)";
      imgWrapper.style.minHeight = "150px";
      imgWrapper.innerHTML = `<svg viewBox="0 0 525.5 525.5" style="width: 100%; height: 100%; fill: rgba(133, 133, 133, 0.35);"><path d="M324.5 212.7H203c-1.6 0-2.8 1.3-2.8 2.8V308c0 1.6 1.3 2.8 2.8 2.8h121.6c1.6 0 2.8-1.3 2.8-2.8v-92.5c0-1.6-1.3-2.8-2.9-2.8zm1.1 95.3c0 .6-.5 1.1-1.1 1.1H203c-.6 0-1.1-.5-1.1-1.1v-92.5c0-.6.5-1.1 1.1-1.1h121.6c.6 0 1.1.5 1.1 1.1V308z" /><path d="M210.4 299.5H240v.1s.1 0 .2-.1h75.2v-76.2h-105v76.2zm1.8-7.2l20-20c1.6-1.6 3.8-2.5 6.1-2.5s4.5.9 6.1 2.5l11.5 11.5 16.8 16.8c-12.9 3.3-20.7 6.3-22.8 7.2h-27.7v-5.5zm101.5-10.1c-20.1 1.7-36.7 4.8-49.1 7.9l-16.9-16.9 26.3-26.3c1.6-1.6 3.8-2.5 6.1-2.5s4.5.9 6.1 2.5l27.5 27.5v7.8zm-68.9 15.5c9.7-3.5 33.9-10.9 68.9-13.8v13.8h-68.9zm68.9-72.7v46.8l-26.2-26.2c-1.9-1.9-4.5-3-7.3-3s-5.4 1.1-7.3 3l-18.8 18.8V225h101.4z" /><path d="M232.8 254c4.6 0 8.3-3.7 8.3-8.3s-3.7-8.3-8.3-8.3-8.3 3.7-8.3 8.3 3.7 8.3 8.3 8.3zm0-14.9c3.6 0 6.6 2.9 6.6 6.6s-2.9 6.6-6.6 6.6-6.6-2.9-6.6-6.6 3-6.6 6.6-6.6z" /></svg>`;
    }
    container.appendChild(imgWrapper);

    const info = createElement("div", "menucraft-image-info");
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "4px";
    info.style.textAlign = imageAlign;
    info.style.alignSelf = textAlignItems;

    if (item.label) {
      const label = createElement("div", "menucraft-image-label", item.label);
      label.style.fontWeight = "600";
      label.style.fontFamily = settings.typographySubheadingFont;
      label.style.fontSize = "18px";
      label.style.lineHeight = "1.3";
      label.style.color = settings.colorSubmenuText;
      info.appendChild(label);
    }

    if (item.description) {
      const desc = createElement("div", "menucraft-image-desc", item.description);
      desc.style.fontSize = "12px";
      desc.style.fontFamily = settings.typographySubtextFont;
      desc.style.color = settings.colorSubmenuDescription;
      desc.style.lineHeight = "1.2";
      info.appendChild(desc);
    }

    if (isOverlay) {
      info.style.position = "absolute";
      info.style.left = "16px";
      info.style.right = "16px";
      info.style.bottom = "16px";
      info.style.background = "#3f3f3f";
      info.style.color = "#ffffff";
      info.style.padding = "10px 12px";
      imgWrapper.appendChild(info);
    } else {
      container.appendChild(info);
    }

    return container;
  };

  const isMegaMenu = (item) => {
    if (item.submenuType === "mega" || item.submenuTemplate === "mega") return true;
    if (item.submenuType === "dropdown" || item.submenuTemplate === "dropdown") return false;
    if (item.submenuType === "horizontal-dropdown" || item.submenuTemplate === "horizontal-dropdown") return false;

    // Auto-detect if any child has a block template
    return Array.isArray(item.children) && item.children.length > 0 &&
      item.children.some(child => child.blockTemplate && child.blockTemplate !== "none");
  };

  const buildCollectionBlock = (item, settings) => {
    const container = createElement("div", "menucraft-block-collection");
    container.style.borderRadius = "16px";
    container.style.padding = "5px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";

    const ids = Array.isArray(item.collectionIds) ? item.collectionIds : [];

    // Heading check
    const blockHeading = (item.label || "").trim();
    if (blockHeading) {
      const heading = createElement("div", "menucraft-collection-block-heading");
      heading.textContent = blockHeading;
      heading.style.color = settings.colorSubmenuHeading;
      heading.style.fontWeight = "600";
      heading.style.fontFamily = settings.typographySubheadingFont;
      heading.style.fontSize = "18px";
      heading.style.fontWeight = "700";
      heading.style.lineHeight = "1.3";
      heading.style.letterSpacing = "-0.01em";
      heading.style.marginBottom = "10px";
      container.appendChild(heading);

      const hr = createElement("div");
      hr.style.borderTop = `1px solid ${settings.colorSubmenuHeading}`;
      hr.style.opacity = "0.5";
      container.appendChild(hr);
    }

    const grid = createElement("div", "menucraft-collection-grid");
    grid.style.display = "grid";
    grid.style.gap = "16px";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))";

    ids.forEach(id => {
      const collection = getResource("collection", id);
      const card = createElement("a", "menucraft-collection-card");
      card.style.display = "block";
      card.style.position = "relative";
      card.style.borderRadius = "16px";
      card.style.overflow = "hidden";
      card.style.textDecoration = "none";
      card.style.background = "#f3f4f4";
      card.style.border = "1px solid #e5e7eb";
      card.style.aspectRatio = "16/9";

      if (collection?.handle) {
        card.href = `/collections/${collection.handle}`;
      }

      const imgUrl = collection?.image?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png";
      const img = createElement("img");
      img.src = imgUrl;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.display = "block";
      img.style.transition = "transform 500ms ease";
      card.appendChild(img);

      const overlay = createElement("div", "menucraft-collection-overlay");
      overlay.style.position = "absolute";
      overlay.style.bottom = "0";
      overlay.style.left = "0";
      overlay.style.right = "0";
      overlay.style.padding = "16px";
      overlay.style.background = "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)";
      overlay.style.color = "#fff";
      overlay.style.display = "flex";
      overlay.style.flexDirection = "column";
      overlay.style.justifyContent = "flex-end";
      overlay.style.height = "60%";

      const label = createElement("div", "menucraft-collection-label", collection?.title || "Collection");
      label.style.fontWeight = "600";
      label.style.fontSize = "15px";
      label.style.fontFamily = settings.typographySubheadingFont;
      overlay.appendChild(label);

      card.appendChild(overlay);

      card.onmouseenter = () => {
        img.style.transform = "scale(1.05)";
      };
      card.onmouseleave = () => {
        img.style.transform = "none";
      };

      grid.appendChild(card);
    });
    container.appendChild(grid);
    return container;
  };

  const buildBlogBlock = (item, settings) => {
    const container = createElement("div", "menucraft-block-blog");
    container.style.borderRadius = "16px";
    container.style.padding = "5px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";

    const blogId = Array.isArray(item.blogIds) ? item.blogIds[0] : null;
    const blog = getResource("blog", blogId);
    const articles = blog?.articles || [];
    const limit = item.articleCount || 3;
    const displayArticles = articles.slice(0, limit);

    // Heading
    const blogTitle = (item.label || blog?.title || "Blog").trim();
    if (blogTitle) {
      const heading = createElement("div", "menucraft-blog-block-heading");
      heading.textContent = blogTitle;
      heading.style.color = settings.colorSubmenuHeading;
      heading.style.fontWeight = "600";
      heading.style.fontFamily = settings.typographySubheadingFont;
      heading.style.fontSize = "18px";
      heading.style.fontWeight = "700";
      heading.style.lineHeight = "1.3";
      heading.style.letterSpacing = "-0.01em";
      heading.style.marginBottom = "10px";
      container.appendChild(heading);

      const hr = createElement("div");
      hr.style.borderTop = `1px solid ${settings.colorSubmenuHeading}`;
      hr.style.opacity = "0.5";
      container.appendChild(hr);
    }

    const list = createElement("div", "menucraft-blog-list");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "4px";

    displayArticles.forEach(article => {
      const row = createElement("a", "menucraft-blog-article-row");
      row.href = `/blogs/${blog.handle}/${article.handle}`;
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "12px";
      row.style.padding = "8px 10px";
      row.style.borderRadius = "8px";
      row.style.textDecoration = "none";
      row.style.color = "inherit";
      row.style.transition = "background 150ms ease";

      const thumbWrapper = createElement("div", "menucraft-article-thumb-wrapper");
      thumbWrapper.style.width = "48px";
      thumbWrapper.style.height = "48px";
      thumbWrapper.style.flexShrink = "0";
      thumbWrapper.style.borderRadius = "6px";
      thumbWrapper.style.overflow = "hidden";
      thumbWrapper.style.background = "#f3f4f4";

      const img = createElement("img");
      img.src = article.image?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-lifestyle-2_large.png";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      thumbWrapper.appendChild(img);
      row.appendChild(thumbWrapper);

      const title = createElement("div", "menucraft-article-title", article.title);
      title.style.fontSize = "16px";
      title.style.fontWeight = "600";
      title.style.color = settings.colorSubmenuText;
      title.style.lineHeight = "1.3";
      title.style.display = "-webkit-box";
      title.style.webkitLineClamp = "2";
      title.style.webkitBoxOrient = "vertical";
      title.style.overflow = "hidden";
      row.appendChild(title);

      row.onmouseenter = () => {
        row.style.background = "rgba(0,0,0,0.04)";
      };
      row.onmouseleave = () => {
        row.style.background = "transparent";
      };

      list.appendChild(row);
    });

    container.appendChild(list);
    return container;
  };


  const buildSpaceBlock = (item) => {
    const div = createElement("div", "menucraft-block-space");
    div.style.height = "20px"; // Default space
    return div;
  };

  const buildSubmenuContent = (parentItem, settings) => {
    if (isMegaMenu(parentItem)) {
      const container = createElement("div", "menucraft-mega-container");
      container.style.display = "grid";
      container.style.gridTemplateColumns = "repeat(12, 1fr)";
      container.style.gap = "32px";
      container.style.padding = "20px";
      container.style.maxWidth = settings.layoutMaxWidth ?
        (/^\d+$/.test(settings.layoutMaxWidth) ? `${settings.layoutMaxWidth}px` : settings.layoutMaxWidth) :
        "1200px";
      container.style.margin = "0 auto";
      container.style.width = "100%";
      container.style.boxSizing = "border-box";

      const items = Array.isArray(parentItem.children) ? parentItem.children : [];

      items.forEach(child => {
        let block;
        if (child.blockTemplate === "links" || child.blockTemplate?.startsWith("links-")) {
          block = buildLinkListBlock(child, settings);
        } else if (child.blockTemplate?.startsWith("image")) {
          block = buildImageBlock(child, settings);
        } else if (child.blockTemplate?.startsWith("product")) {
          block = buildProductBlock(child, settings);
        } else if (child.blockTemplate?.startsWith("collection")) {
          block = buildCollectionBlock(child, settings);
        } else if (child.blockTemplate?.startsWith("blog")) {
          block = buildBlogBlock(child, settings);
        } else if (child.blockTemplate === "html") {
          block = buildHtmlBlock(child);
        } else if (child.blockTemplate === "contact") {
          block = buildContactBlock(child, settings);
        } else if (child.blockTemplate === "space") {
          block = buildSpaceBlock(child);
        } else {
          block = createElement("div", "menucraft-block-default");
          block.appendChild(buildMenuItems([child], settings, 1));
        }

        const span = getBlockSpan(child);
        block.style.gridColumn = `span ${span}`;
        container.appendChild(block);
      });
      return container;
    }
    // Default dropdown
    return buildMenuItems(parentItem.children, settings, 1);
  };

  const renderMenu = (menu) => {
    const settings = normalizeSettings(menu.settings);
    const container = createElement("nav", "menucraft-menu");

    container.style.background = settings.colorMainBackground;
    container.style.color = settings.colorMainText;
    container.style.minHeight = `${settings.spacingMainRowHeight}px`;

    const inner = createElement("div", "menucraft-menu-inner");
    if (settings.layoutMaxWidth) {
      inner.style.maxWidth = /^\d+$/.test(settings.layoutMaxWidth)
        ? `${settings.layoutMaxWidth}px`
        : settings.layoutMaxWidth;
    }

    const currentPath = window.location.pathname;
    const list = createElement("ul", "menucraft-menu-list");

    if (settings.layoutAlignment === "center") list.style.justifyContent = "center";
    if (settings.layoutAlignment === "right") list.style.justifyContent = "flex-end";

    const items = Array.isArray(menu.items) ? menu.items : [];

    items.forEach((item) => {
      if (!item || item.hideOnDesktop) return;

      // Safety filter for genuinely empty items (to avoid ghost black boxes)
      // Only hide if it has absolutely no content
      if (!item.label && !item.icon && (!item.children || item.children.length === 0) && !item.blockTemplate) return;

      const li = createElement("li", "menucraft-menu-item");
      const isActive = item.url === currentPath || (item.url === "/" && currentPath === "/");

      if (isActive) li.classList.add("is-active");

      const link = buildLink(item, settings, 0);
      li.appendChild(link);

      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      if (hasChildren) {
        li.classList.add("has-children");
        if (isMegaMenu(item)) li.classList.add("is-mega");

        if (settings.elementsShowIndicators) {
          const indicator = createElement("span", "menucraft-indicator", "▾");
          li.appendChild(indicator);
        }
        const submenu = createElement("div", "menucraft-submenu");
        submenu.appendChild(buildSubmenuContent(item, settings));
        li.appendChild(submenu);
      }

      list.appendChild(li);
    });

    inner.appendChild(list);

    if (settings.elementsShowSearch) {
      const searchBox = createElement("div", "menucraft-search-wrapper");
      const searchLink = createElement("a", "menucraft-search");
      searchLink.href = "/search";
      searchLink.innerHTML = `<svg viewBox="0 0 20 20" class="menucraft-icon" style="width: 20px; height: 20px; fill: currentColor;"><path fill-rule="evenodd" d="M12.322 13.383a5.5 5.5 0 1 1 1.06-1.06l2.835 2.835a.75.75 0 1 1-1.06 1.06l-2.835-2.835ZM11.5 8.75a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0Z" clip-rule="evenodd" /></svg>`;
      searchBox.appendChild(searchLink);
      inner.appendChild(searchBox);
    }

    container.appendChild(inner);

    const styleTag = document.createElement("style");
    const rootId = root.id;
    styleTag.textContent = `
      #${rootId} { width: 100%; }
      .menucraft-menu { 
        width: 100%; 
        position: relative; 
        z-index: 999; 
      }
      .menucraft-menu-inner { 
        width: 100%; 
        margin: 0 auto; 
        padding: 0; 
        display: flex; 
        align-items: stretch;
        justify-content: ${settings.layoutAlignment === "center" ? "center" : settings.layoutAlignment === "right" ? "flex-end" : "flex-start"};
      }
      .menucraft-menu-list {
        display: flex;
        align-items: stretch;
        flex-wrap: nowrap;
        overflow: visible !important;
        -ms-overflow-style: none;
        scrollbar-width: none;
        gap: 0;
        list-style: none;
        margin: 0;
        padding: 0;
        width: fit-content;
        background: ${settings.colorMainBackground};
        border: 1px solid ${settings.colorMainDivider};
      }
      .menucraft-menu-list::-webkit-scrollbar {
        display: none;
      }
      .menucraft-menu-item {
        position: relative;
        display: flex;
        align-items: center;
        padding: 0 ${settings.spacingMainPadding}px;
        min-height: ${settings.spacingMainRowHeight}px;
        color: ${settings.colorMainText};
        border-right: 1px solid ${settings.colorMainDivider};
        transition: background-color 0.2s ease;
        cursor: pointer;
      }
      .menucraft-menu-item:last-child { border-right: none; }
      
      .menucraft-menu-item.is-active {
        background-color: ${settings.colorMainText};
        color: ${settings.colorMainBackground};
      }
      .menucraft-menu-item.is-active .menucraft-menu-link {
        color: ${settings.colorMainBackground};
      }

      .menucraft-menu-link {
        color: inherit;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        height: 100%;
        font-family: ${settings.typographyMainFont};
        font-weight: ${settings.typographyMainWeight};
        font-size: ${settings.typographyMainSize}px;
        white-space: nowrap;
      }
      .menucraft-menu-item:hover { 
        background: ${settings.colorMainBackgroundHover}; 
        color: ${settings.colorMainTextHover}; 
      }
      .menucraft-submenu-item {
        position: relative;
        display: block;
        padding: 5px 0;
        cursor: pointer;
      }
      .menucraft-submenu-item:hover .menucraft-menu-link {
        color: ${settings.colorSubmenuTextHover};
      }
      .menucraft-indicator { font-size: 12px; margin-left: 6px; transition: transform 0.2s; }
      .menucraft-menu-item:hover .menucraft-indicator { transform: translateY(2px); }

      .menucraft-submenu {
        position: absolute;
        left: 0;
        top: 100%;
        background: ${settings.colorSubmenuBackground};
        border: ${settings.submenuShowBorder ? `1px solid ${settings.colorSubmenuBorder}` : "none"};
        padding: 24px;
        min-width: 240px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        display: none;
        z-index: 1000;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.2s, transform 0.2s;
      }
      .menucraft-menu-item.is-mega { position: static !important; }
      .menucraft-menu-item.is-mega .menucraft-submenu { 
        width: max-content !important;
        max-width: min(1400px, 95vw) !important;
        left: 50% !important; 
        right: auto !important;
        transform: translate(-50%, 10px) !important;
        box-sizing: border-box !important;
        min-height: auto;
        padding: 40px !important; 
        background: ${settings.colorSubmenuBackground};
        border-radius: 16px !important;
        box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important;
        border: 1px solid rgba(0,0,0,0.05) !important;
        overflow: hidden !important;
      }
      
      /* Reset transform for mega menu hover to maintain centering */
      .menucraft-menu-item.is-mega:hover .menucraft-submenu {
        transform: translate(-50%, 0) !important;
      }

      .menucraft-menu-item.has-children:hover .menucraft-submenu { 
        display: block !important; 
        opacity: 1 !important; 
      }
      
      .menucraft-mega-container {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 40px;
        align-items: start;
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 !important;
      }
      
      .menucraft-product-card {
        border: none;
        overflow: hidden;
        background: transparent;
        padding: 0;
        transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      }
      .menucraft-product-card:hover {
        background: rgba(0,0,0,0.04);
        border-radius: 8px;
        transform: translateY(-5px);
      }
      .menucraft-product-image-wrapper {
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 15px;
        background: #f9f9f9;
        aspect-ratio: 1;
      }
      
      .menucraft-product-grid {
        scrollbar-width: none;
      }
      .menucraft-product-grid::-webkit-scrollbar {
        display: none;
      }

      .menucraft-block-links-columns {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      
      @media screen and (max-width: 768px) {
        .menucraft-mega-container {
            grid-template-columns: 1fr !important;
        }
        .menucraft-menu-item {
            padding: 0 10px;
        }
        .menucraft-mega-container > div {
            grid-column: span 1 !important;
        }
      }

      .menucraft-submenu-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .menucraft-submenu .menucraft-menu-link {
        color: ${settings.colorSubmenuText};
        font-family: ${settings.typographySubtextFont};
        font-weight: ${settings.typographySubtextWeight};
        font-size: ${settings.typographySubtextSize}px;
      }
      .menucraft-submenu .menucraft-menu-link:hover { color: ${settings.colorSubmenuTextHover}; }
      
      .menucraft-menu-heading {
        margin-bottom: 16px;
        border-bottom: 1px solid ${settings.colorMainDivider};
        padding-bottom: 12px !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        letter-spacing: -0.01em;
      }

      .menucraft-search-wrapper { 
        margin-left: auto; 
        display: flex; 
        align-items: center; 
        padding: 0 10px; 
        border-left: 1px solid ${settings.colorMainDivider};
      }
      .menucraft-search { 
        color: inherit; 
        text-decoration: none; 
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        transition: opacity 0.2s;
      }
      .menucraft-search:hover { opacity: 0.7; }

      @media (max-width: ${settings.advancedMobileBreakpoint || 768}px) {
        .menucraft-menu-list { flex-direction: column; }
        .menucraft-menu-item { width: 100%; border-right: none; border-bottom: 1px solid ${settings.colorMainDivider}; }
        .menucraft-submenu { position: static; width: 100%; box-shadow: none; display: none; opacity: 1; transform: none; padding: 15px; }
        .menucraft-menu-item.has-children.is-open .menucraft-submenu { display: block; }
        .menucraft-mega-container { grid-template-columns: 1fr; gap: 20px; }
      }
      ${settings.customCss || ""}
    `;

    const mountTarget = getMountTarget(settings);
    if (!mountTarget) return;

    root.innerHTML = "";
    root.appendChild(container);

    const existingStyle = document.head.querySelector("style[data-menucraft]");
    if (existingStyle) existingStyle.remove();
    styleTag.setAttribute("data-menucraft", "true");
    document.head.appendChild(styleTag);

    if (root.parentElement !== mountTarget) mountTarget.prepend(root);
  };

  const loadMenu = async () => {
    console.log("[MenuCraft] Loading menu...");
    try {
      const response = await fetch(PROXY_URL + window.location.search, { credentials: "include" });
      if (!response.ok) {
        console.error("[MenuCraft] Proxy request failed", response.status);
        return;
      }
      const data = await response.json();
      if (!data || !data.menu) {
        console.warn("[MenuCraft] No menu data returned from proxy", data);
        return;
      }
      if (data.menu.status !== "active") {
        console.warn("[MenuCraft] Menu is not active. Current status:", data.menu.status);
        return;
      }
      window.MenuCraftData = data;
      renderMenu(data.menu);
    } catch (error) {
      console.error("[MenuCraft] Load failed", error);
    }
  };

  loadMenu();
})();
