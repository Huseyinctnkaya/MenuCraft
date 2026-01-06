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
    layoutOrientation: "horizontal",
    layoutAlignment: "left",
    layoutMaxWidth: "",
    spacingMainRowHeight: 50,
    typographyMainFont: "Work Sans, system-ui, sans-serif",
    typographyMainWeight: 500,
    typographyMainSize: 14,
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
    colorSubmenuTextHover: "#000000",
    submenuShowBorder: true,
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
    const link = document.createElement("a");
    link.href = item.url || "#";
    link.textContent = item.label || "";
    link.className = "menucraft-menu-link";
    link.style.fontFamily = settings.typographyMainFont;
    link.style.fontWeight = String(settings.typographyMainWeight);
    link.style.fontSize = `${settings.typographyMainSize}px`;
    if (item.openInNewTab) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    return link;
  };

  const buildMenuItems = (items, settings, depth = 0) => {
    const list = createElement("ul", depth === 0 ? "menucraft-menu-list" : "menucraft-submenu-list");
    items.forEach((item) => {
      if (!item || item.hideOnDesktop) return;
      const li = createElement("li", "menucraft-menu-item");
      const link = buildLink(item, settings);
      li.appendChild(link);

      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      if (hasChildren) {
        li.classList.add("has-children");
        if (settings.elementsShowIndicators) {
          const indicator = createElement("span", "menucraft-indicator", "▾");
          li.appendChild(indicator);
        }
        const submenu = createElement("div", "menucraft-submenu");
        submenu.appendChild(buildMenuItems(item.children, settings, depth + 1));
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

  const renderMenu = (menu) => {
    const settings = normalizeSettings(menu.settings);
    const container = createElement("nav", "menucraft-menu");
    container.style.background = settings.colorMainBackground;
    container.style.color = settings.colorMainText;
    container.style.minHeight = `${settings.spacingMainRowHeight}px`;

    const inner = createElement("div", "menucraft-menu-inner");
    if (settings.layoutMaxWidth) {
      inner.style.maxWidth =
        settings.layoutMaxWidth.trim().length > 0 && /\d/.test(settings.layoutMaxWidth)
          ? `${settings.layoutMaxWidth.replace(/px$/, "")}px`
          : settings.layoutMaxWidth;
    }

    const list = buildMenuItems(Array.isArray(menu.items) ? menu.items : [], settings);
    if (settings.layoutAlignment === "center") {
      list.style.justifyContent = "center";
    } else if (settings.layoutAlignment === "right") {
      list.style.justifyContent = "flex-end";
    }

    inner.appendChild(list);

    if (settings.elementsShowSearch) {
      const searchLink = createElement("a", "menucraft-search", "Search");
      searchLink.href = "/search";
      inner.appendChild(searchLink);
    }

    container.appendChild(inner);

    const styleTag = document.createElement("style");
    const rootId = root.id;
    styleTag.textContent = `
      #${rootId} { width: 100%; }
      .menucraft-menu { width: 100%; position: relative; z-index: 50; }
      .menucraft-menu-inner { width: 100%; margin: 0 auto; padding: 0 16px; box-sizing: border-box; display: flex; align-items: center; }
      .menucraft-menu-list {
        display: flex;
        align-items: center;
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
        gap: 6px;
        padding: 0 18px;
        min-height: ${settings.spacingMainRowHeight}px;
        color: ${settings.colorMainText};
        border-right: 1px solid ${settings.colorMainDivider};
        box-sizing: border-box;
      }
      .menucraft-menu-item:last-child { border-right: none; }
      .menucraft-menu-link {
        color: inherit;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        line-height: 1;
      }
      .menucraft-menu-item:hover { background: ${settings.colorMainBackgroundHover}; color: ${settings.colorMainTextHover}; }
      .menucraft-menu-item:hover .menucraft-menu-link { color: ${settings.colorMainTextHover}; }
      .menucraft-indicator { font-size: 10px; margin-left: 6px; }
      .menucraft-submenu {
        position: absolute;
        left: 0;
        top: 100%;
        background: ${settings.colorSubmenuBackground};
        border: ${settings.submenuShowBorder ? `1px solid ${settings.colorSubmenuBorder}` : "none"};
        padding: 12px;
        min-width: 220px;
        display: none;
        z-index: 60;
      }
      .menucraft-submenu-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }
      .menucraft-submenu .menucraft-menu-link {
        color: ${settings.colorSubmenuText};
        font-size: ${settings.typographySubtextSize || 13}px;
      }
      .menucraft-submenu .menucraft-menu-item { padding: 0; border-right: none; min-height: auto; }
      .menucraft-menu-item.has-children:hover .menucraft-submenu { display: block; }
      .menucraft-search {
        margin-left: auto;
        color: ${settings.colorMainText};
        text-decoration: none;
        font-size: 13px;
      }
    `;

    const mountTarget = getMountTarget(settings);
    if (!mountTarget) return;

    root.innerHTML = "";
    root.appendChild(container);

    const existingStyle = document.head.querySelector("style[data-menucraft]");
    if (existingStyle) {
      existingStyle.remove();
    }
    styleTag.setAttribute("data-menucraft", "true");
    document.head.appendChild(styleTag);

    if (root.parentElement !== mountTarget) {
      mountTarget.prepend(root);
    }
  };

  const loadMenu = async () => {
    try {
      const response = await fetch(PROXY_URL, { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || !data.menu || data.menu.status !== "active") return;
      renderMenu(data.menu);
    } catch (error) {
      console.error("MenuCraft embed failed", error);
    }
  };

  loadMenu();
})();
