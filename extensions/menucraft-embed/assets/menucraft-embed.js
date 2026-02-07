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

  const buildLink = (item, settings) => {
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
      desc.style.fontSize = `${settings.typographySubtextSize}px`;
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
      const link = buildLink(item, settings);
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
    container.style.gap = "14px";
    container.style.padding = "12px";
    container.style.borderRadius = "12px";
    container.style.background = "transparent";
    container.style.transition = "all 0.3s ease";
    container.style.textDecoration = "none";
    container.style.color = "inherit";
    container.style.border = "1px solid transparent";

    if (product?.handle) {
      container.href = `/products/${product.handle}`;
    }

    const imgUrl = product?.featuredImage?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png";
    const imageWrapper = createElement("div", "menucraft-product-image-wrapper");
    imageWrapper.style.width = isImageLeft ? "100px" : "100%";
    imageWrapper.style.aspectRatio = isImageLeft ? "1/1" : "4/5";
    imageWrapper.style.flexShrink = "0";
    imageWrapper.style.background = "#f3f4f4";
    imageWrapper.style.borderRadius = "8px";
    imageWrapper.style.overflow = "hidden";
    imageWrapper.style.display = "flex";
    imageWrapper.style.alignItems = "center";
    imageWrapper.style.justifyContent = "center";

    const img = createElement("img");
    img.src = imgUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    // Hide broken images
    img.onerror = () => { img.style.display = "none"; };
    imageWrapper.appendChild(img);
    container.appendChild(imageWrapper);

    const info = createElement("div", "menucraft-product-info");
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "6px";
    info.style.padding = "4px 0";

    const title = createElement("div", "menucraft-product-title", product?.title || "Example Product Title");
    title.style.fontWeight = "600";
    title.style.fontSize = "15px";
    title.style.fontFamily = settings.typographySubheadingFont;
    title.style.color = settings.colorSubmenuText || "#111";
    title.style.lineHeight = "1.3";
    info.appendChild(title);

    if (product?.priceRange?.minVariantPrice) {
      const price = createElement("div", "menucraft-product-price");
      price.textContent = formatPrice(product.priceRange.minVariantPrice);
      price.style.fontSize = "14px";
      price.style.fontWeight = "500";
      price.style.color = settings.colorSubmenuDescription || "#888";
      info.appendChild(price);
    }
    container.appendChild(info);

    container.onmouseenter = () => {
      container.style.background = "#fcfcfc";
      container.style.borderColor = "#eee";
      container.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
    };
    container.onmouseleave = () => {
      container.style.background = "transparent";
      container.style.borderColor = "transparent";
      container.style.boxShadow = "none";
    };

    return container;
  };

  const buildProductBlock = (item, settings) => {
    const container = createElement("div", "menucraft-block-product-group");
    const layout = item.productLayout || (item.blockTemplate === "product-horizontal" ? "image-left" : "image-top");
    const ids = Array.isArray(item.productIds) ? item.productIds : [];

    const grid = createElement("div", "menucraft-product-grid");
    grid.style.display = "grid";
    grid.style.gap = "20px";

    const isCarousel = item.blockTemplate === "product-carousel";
    const isHorizontal = item.blockTemplate === "product-horizontal" || layout === "image-left";

    if (isCarousel) {
      grid.style.display = "flex";
      grid.style.overflowX = "auto";
      grid.style.scrollSnapType = "x mandatory";
      grid.style.paddingBottom = "10px";
      grid.style.gap = "16px";
    } else if (ids.length > 1) {
      grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(200px, 1fr))";
    } else {
      grid.style.gridTemplateColumns = "1fr";
    }

    ids.forEach(id => {
      const card = buildProductCard(id, settings, layout === "image-left" ? "row" : "column");
      if (isCarousel) card.style.flex = "0 0 250px";
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
        <div style="margin-bottom: 8px;"><input type="text" placeholder="${item.contactNameLabel || 'Name'}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></div>
        <div style="margin-bottom: 8px;"><input type="email" placeholder="${item.contactEmailLabel || 'Email'}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></div>
        <div style="margin-bottom: 8px;"><textarea placeholder="${item.contactMessageLabel || 'Message'}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 60px;"></textarea></div>
        <button type="submit" style="background: ${settings.colorButtonBackground}; color: ${settings.colorButtonText}; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">${item.contactSubmitLabel || 'Send'}</button>
    `;
    container.appendChild(form);
    return container;
  };

  const buildLinkListBlock = (group, settings) => {
    const container = createElement("div", "menucraft-block-links");
    const columnCount = Math.max(1, group.linkColumns || 1);
    const linkItems = (group.children || []).filter(c => !c.isHeading);
    const headingItem = (group.children || []).find(c => c.isHeading);

    if (headingItem) {
      container.appendChild(buildLink(headingItem, settings));
    }

    const columnsWrapper = createElement("div", "menucraft-block-links-columns");
    columnsWrapper.style.display = "flex";
    columnsWrapper.style.gap = "20px";

    const itemsPerColumn = Math.ceil(linkItems.length / columnCount);
    for (let i = 0; i < columnCount; i++) {
      const column = createElement("div", "menucraft-block-column");
      column.style.flex = "1";
      const columnList = createElement("ul", "menucraft-submenu-list");
      const start = i * itemsPerColumn;
      const end = Math.min(start + itemsPerColumn, linkItems.length);
      const columnItems = linkItems.slice(start, end);

      columnItems.forEach(item => {
        const li = createElement("li", "menucraft-submenu-item");
        li.appendChild(buildLink(item, settings));
        columnList.appendChild(li);
      });
      column.appendChild(columnList);
      columnsWrapper.appendChild(column);
    }
    container.appendChild(columnsWrapper);
    return container;
  };

  const buildImageBlock = (item, settings) => {
    const container = createElement("div", "menucraft-block-image");
    if (item.imageUrl) {
      const img = createElement("img");
      img.src = item.imageUrl;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.borderRadius = "8px";
      container.appendChild(img);
    }
    if (item.label) {
      const label = createElement("div", "menucraft-block-image-label", item.label);
      label.style.marginTop = "8px";
      label.style.fontWeight = "600";
      label.style.fontSize = `${settings.typographySubtextSize + 2}px`;
      container.appendChild(label);
    }
    if (item.description) {
      const desc = createElement("div", "menucraft-block-image-desc", item.description);
      desc.style.marginTop = "4px";
      desc.style.fontSize = `${settings.typographySubtextSize}px`;
      desc.style.color = settings.colorSubmenuDescription || "#666";
      container.appendChild(desc);
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
    container.style.display = "grid";
    container.style.gap = "16px";
    container.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";

    const ids = Array.isArray(item.collectionIds) ? item.collectionIds : [];

    ids.forEach(id => {
      const collection = getResource("collection", id);
      const card = createElement("a", "menucraft-collection-card");
      card.style.display = "block";
      card.style.position = "relative";
      card.style.borderRadius = "10px";
      card.style.overflow = "hidden";
      card.style.textDecoration = "none";
      card.style.transition = "transform 0.3s ease";

      if (collection?.handle) {
        card.href = `/collections/${collection.handle}`;
      }

      const imgUrl = collection?.image?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png";
      const img = createElement("img");
      img.src = imgUrl;
      img.style.width = "100%";
      img.style.aspectRatio = "16/9";
      img.style.objectFit = "cover";
      img.style.display = "block";
      img.style.transition = "transform 0.5s ease";
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
      overlay.style.height = "50%";

      const label = createElement("div", "menucraft-collection-label", collection?.title || "Collection");
      label.style.fontWeight = "600";
      label.style.fontSize = "15px";
      label.style.fontFamily = settings.typographySubheadingFont;
      overlay.appendChild(label);

      card.appendChild(overlay);

      card.onmouseenter = () => {
        img.style.transform = "scale(1.05)";
        card.style.transform = "translateY(-2px)";
      };
      card.onmouseleave = () => {
        img.style.transform = "none";
        card.style.transform = "none";
      };

      container.appendChild(card);
    });
    return container;
  };

  const buildBlogBlock = (item, settings) => {
    const container = createElement("div", "menucraft-block-blog");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "20px";

    const ids = Array.isArray(item.blogIds) ? item.blogIds : [];

    ids.forEach(id => {
      const blog = getResource("blog", id);
      if (!blog) return;

      const blogGroup = createElement("div", "menucraft-blog-group");

      const blogTitle = createElement("h4", "menucraft-blog-title", blog.title);
      blogTitle.style.marginBottom = "16px";
      blogTitle.style.fontSize = "16px";
      blogTitle.style.fontWeight = "600";
      blogTitle.style.fontFamily = settings.typographySubheadingFont;
      blogTitle.style.color = settings.colorSubmenuHeading;
      blogTitle.style.paddingBottom = "8px";
      blogTitle.style.borderBottom = `1px solid ${settings.colorMainDivider || '#eee'}`;
      blogGroup.appendChild(blogTitle);

      const articlesContainer = createElement("div", "menucraft-articles-list");
      articlesContainer.style.display = "flex";
      articlesContainer.style.flexDirection = "column";
      articlesContainer.style.gap = "12px";

      const articles = blog.articles?.nodes || [];
      articles.forEach(article => {
        const row = createElement("a", "menucraft-article-row");
        row.href = `/blogs/${blog.handle}/${article.handle}`;
        row.style.display = "flex";
        row.style.gap = "12px";
        row.style.textDecoration = "none";
        row.style.color = "inherit";
        row.style.padding = "4px";
        row.style.borderRadius = "8px";
        row.style.transition = "background 0.2s ease";

        if (article.image) {
          const imgWrapper = createElement("div", "menucraft-article-image-wrapper");
          imgWrapper.style.width = "60px";
          imgWrapper.style.height = "60px";
          imgWrapper.style.flexShrink = "0";
          imgWrapper.style.borderRadius = "6px";
          imgWrapper.style.overflow = "hidden";

          const img = createElement("img");
          img.src = article.image.url;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";
          imgWrapper.appendChild(img);
          row.appendChild(imgWrapper);
        }

        const info = createElement("div", "menucraft-article-info");
        info.style.display = "flex";
        info.style.flexDirection = "column";
        info.style.justifyContent = "center";

        const atitle = createElement("div", "menucraft-article-title", article.title);
        atitle.style.fontSize = "14px";
        atitle.style.fontWeight = "500";
        atitle.style.fontFamily = settings.typographySubtextFont;
        atitle.style.color = settings.colorSubmenuText;
        info.appendChild(atitle);

        row.appendChild(info);

        row.onmouseenter = () => { row.style.background = "#f5f5f5"; };
        row.onmouseleave = () => { row.style.background = "transparent"; };

        articlesContainer.appendChild(row);
      });

      blogGroup.appendChild(articlesContainer);
      container.appendChild(blogGroup);
    });
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

      const link = buildLink(item, settings);
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
        border-top: 1px solid ${settings.colorMainDivider};
        border-bottom: 1px solid ${settings.colorMainDivider};
      }
      .menucraft-menu-inner { 
        width: 100%; 
        margin: 0 auto; 
        padding: 0; 
        display: flex; 
        align-items: stretch; 
      }
      .menucraft-menu-list {
        display: flex;
        align-items: stretch;
        gap: 0;
        list-style: none;
        margin: 0;
        padding: 0;
        width: 100%;
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
      .menucraft-menu-item:first-child { border-left: 1px solid ${settings.colorMainDivider}; }
      
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
      .menucraft-menu-item.is-mega { position: static; }
      .menucraft-menu-item.is-mega .menucraft-submenu { width: 100%; left: 0; right: 0; }

      .menucraft-menu-item.has-children:hover .menucraft-submenu { 
        display: block; opacity: 1; transform: translateY(0); 
      }
      
      .menucraft-mega-container {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 32px;
        align-items: start;
        width: 100%;
      }
      
      .menucraft-product-card {
        border: none;
        border-radius: 12px;
        overflow: hidden;
        background: transparent;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
        margin-bottom: 12px;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px !important;
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
