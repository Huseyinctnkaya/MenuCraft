import type { BlockTemplateId, MenuItem } from "./types";
import { ICON_LIBRARY, ICON_PREFIX } from "./icons";
import { buildId } from "./utils";

export const buildTwoColumnLinkItems = () => {
  const defaultItemLabels = [
    "Menu item 1",
    "Menu item 2",
    "Menu item 3",
    "Menu item 4",
    "Menu item 5",
    "Menu item 6",
  ];
  return [
    {
      id: buildId(),
      label: "Heading",
      url: "",
      role: "item" as const,
      isHeading: true,
      description: "",
    },
    ...defaultItemLabels.map((label) => ({
      id: buildId(),
      label,
      url: "/",
      role: "item" as const,
      description: "Description",
    })),
  ];
};

export const buildEasyColumnLinkItems = () => {
  const defaultItemLabels = ["Menu item 1", "Menu item 2"];
  return [
    {
      id: buildId(),
      label: "Heading",
      url: "",
      role: "item" as const,
      isHeading: true,
      description: "",
    },
    ...defaultItemLabels.map((label) => ({
      id: buildId(),
      label,
      url: "/",
      role: "item" as const,
      description: "Description",
    })),
  ];
};

const buildSingleColumnLinkItems = () => {
  const defaultItemLabels = [
    "Menu item 1",
    "Menu item 2",
    "Menu item 3",
    "Menu item 4",
    "Menu item 5",
    "Menu item 6",
    "Menu item 7",
  ];
  return [
    {
      id: buildId(),
      label: "Heading",
      url: "",
      role: "item" as const,
      isHeading: true,
      description: "",
    },
    ...defaultItemLabels.map((label) => ({
      id: buildId(),
      label,
      url: "/",
      role: "item" as const,
      description: "",
    })),
  ];
};

export const buildDropdownMenuItems = () => {
  const flyoutItems = ["Submenu item 1", "Submenu item 2", "Submenu item 3"].map((label) => ({
    id: buildId(),
    label,
    url: "/",
    role: "item" as const,
  }));
  return [
    {
      id: buildId(),
      label: "Dropdown item 1",
      url: "/",
      role: "item" as const,
    },
    {
      id: buildId(),
      label: "Dropdown item 2",
      url: "",
      role: "group" as const,
      expanded: true,
      children: flyoutItems,
    },
    {
      id: buildId(),
      label: "Dropdown item 3",
      url: "/",
      role: "item" as const,
    },
  ];
};

export const buildSimpleLeftTabsItems = () => {
  const blockItems = buildMultiBlockTwoColumnsTwoPhotos();
  return [
    {
      id: buildId(),
      label: "Dropdown item 1",
      url: "/",
      role: "item" as const,
    },
    {
      id: buildId(),
      label: "Dropdown item 2",
      url: "",
      role: "group" as const,
      expanded: true,
      children: blockItems,
    },
    {
      id: buildId(),
      label: "Dropdown item 3",
      url: "/",
      role: "item" as const,
    },
  ];
};

export const buildSimpleTopTabsItems = () => {
  const blockItems = buildMultiBlockTwoColumnsTwoPhotos();
  return [
    {
      id: buildId(),
      label: "Dropdown item 1",
      url: "/",
      role: "item" as const,
    },
    {
      id: buildId(),
      label: "Dropdown item 2",
      url: "",
      role: "group" as const,
      expanded: true,
      children: blockItems,
    },
    {
      id: buildId(),
      label: "Dropdown item 3",
      url: "/",
      role: "item" as const,
    },
  ];
};

export const buildTwoTopTabsItems = () => {
  const buildBlockItems = () => {
    const linkGroup: MenuItem = {
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links",
      linkColumns: 1,
      linkWidth: 4,
      linkTextAlign: "left",
      children: buildEasyColumnLinkItems(),
    };
    const buildImageGroup = () => ({
      id: buildId(),
      label: "Image title",
      url: "",
      role: "group" as const,
      expanded: false,
      blockTemplate: "image" as const,
      icon: `${ICON_PREFIX}image`,
      description: "",
      imageWidth: 3,
      imageNoFill: false,
      imageTextAlign: "left" as const,
    });
    return [linkGroup, buildImageGroup(), buildImageGroup(), buildImageGroup()];
  };
  return [
    {
      id: buildId(),
      label: "Dropdown item 1",
      url: "/",
      role: "item" as const,
    },
    {
      id: buildId(),
      label: "Dropdown item 2",
      url: "",
      role: "group" as const,
      expanded: true,
      children: [
        { id: buildId(), label: "Submenu item 1", url: "/", role: "item" as const },
        {
          id: buildId(),
          label: "Submenu item 2",
          url: "",
          role: "group" as const,
          expanded: true,
          children: buildBlockItems(),
        },
        { id: buildId(), label: "Submenu item 3", url: "/", role: "item" as const },
      ],
    },
    {
      id: buildId(),
      label: "Dropdown item 3",
      url: "/",
      role: "item" as const,
    },
  ];
};

export const buildThreeTopTabsItems = () => {
  const buildImageGroup = () => ({
    id: buildId(),
    label: "Image title",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "image" as const,
    icon: `${ICON_PREFIX}image`,
    description: "",
    imageWidth: 3,
    imageNoFill: false,
    imageTextAlign: "left" as const,
  });
  return [
    {
      id: buildId(),
      label: "Dropdown item 1",
      url: "/",
      role: "item" as const,
    },
    {
      id: buildId(),
      label: "Dropdown item 2",
      url: "",
      role: "group" as const,
      expanded: true,
      children: [
        { id: buildId(), label: "Submenu item 1", url: "/", role: "item" as const },
        {
          id: buildId(),
          label: "Submenu item 2",
          url: "",
          role: "group" as const,
          expanded: true,
          children: [
            { id: buildId(), label: "Submenu item 1", url: "/", role: "item" as const },
            {
              id: buildId(),
              label: "Submenu item 2",
              url: "",
              role: "group" as const,
              expanded: true,
              children: [
                buildImageGroup(),
                buildImageGroup(),
                buildImageGroup(),
                buildImageGroup(),
              ],
            },
            { id: buildId(), label: "Submenu item 3", url: "/", role: "item" as const },
          ],
        },
        { id: buildId(), label: "Submenu item 3", url: "/", role: "item" as const },
      ],
    },
    {
      id: buildId(),
      label: "Dropdown item 3",
      url: "/",
      role: "item" as const,
    },
  ];
};

export const buildTwoLevelTabsItems = () => {
  const buildLeafBlocks = () => {
    const linkGroup: MenuItem = {
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links",
      linkColumns: 1,
      linkWidth: 6,
      linkTextAlign: "left",
      children: buildEasyColumnLinkItems(),
    };
    const imageGroup: MenuItem = {
      id: buildId(),
      label: "Image title",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "image",
      icon: `${ICON_PREFIX}image`,
      description: "",
      imageWidth: 3,
      imageNoFill: false,
      imageTextAlign: "left",
    };
    return [linkGroup, imageGroup];
  };

  return [
    { id: buildId(), label: "Dropdown item 1", url: "/", role: "item" },
    {
      id: buildId(),
      label: "Dropdown item 2",
      url: "",
      role: "group",
      expanded: true,
      children: [
        { id: buildId(), label: "Submenu item 1", url: "/", role: "item" },
        {
          id: buildId(),
          label: "Submenu item 2",
          url: "",
          role: "group",
          expanded: true,
          children: buildLeafBlocks(),
        },
        { id: buildId(), label: "Submenu item 3", url: "/", role: "item" },
      ],
    },
    { id: buildId(), label: "Dropdown item 3", url: "/", role: "item" },
  ];
};

export const buildThreeLevelTabsItems = () => {
  const buildLeafBlocks = () => {
    const imageGroup: MenuItem = {
      id: buildId(),
      label: "Image title",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "image",
      icon: `${ICON_PREFIX}image`,
      description: "",
      imageWidth: 3,
      imageNoFill: false,
      imageTextAlign: "left",
    };
    return [imageGroup];
  };
  const buildThirdLevelItems = () => [
    { id: buildId(), label: "Submenu item 1", url: "/", role: "item" as const },
    {
      id: buildId(),
      label: "Submenu item 2",
      url: "",
      role: "group" as const,
      expanded: true,
      children: buildLeafBlocks(),
    },
    { id: buildId(), label: "Submenu item 3", url: "/", role: "item" as const },
  ];

  return [
    { id: buildId(), label: "Dropdown item 1", url: "/", role: "item" },
    {
      id: buildId(),
      label: "Dropdown item 2",
      url: "",
      role: "group",
      expanded: true,
      children: [
        { id: buildId(), label: "Submenu item 1", url: "/", role: "item" },
        {
          id: buildId(),
          label: "Submenu item 2",
          url: "",
          role: "group",
          expanded: true,
          children: buildThirdLevelItems(),
        },
        { id: buildId(), label: "Submenu item 3", url: "/", role: "item" },
      ],
    },
    { id: buildId(), label: "Dropdown item 3", url: "/", role: "item" },
  ];
};

export const buildEasyColumnWithIcons = () => {
  const [firstIcon, secondIcon] = (() => {
    if (!ICON_LIBRARY.length) return [undefined, undefined];
    const firstIndex = Math.floor(Math.random() * ICON_LIBRARY.length);
    let secondIndex = Math.floor(Math.random() * ICON_LIBRARY.length);
    if (ICON_LIBRARY.length > 1) {
      while (secondIndex === firstIndex) {
        secondIndex = Math.floor(Math.random() * ICON_LIBRARY.length);
      }
    }
    return [
      `${ICON_PREFIX}${ICON_LIBRARY[firstIndex].id}`,
      `${ICON_PREFIX}${ICON_LIBRARY[secondIndex].id}`,
    ];
  })();
  return [
    {
      id: buildId(),
      label: "Heading",
      url: "",
      role: "item" as const,
      isHeading: true,
      description: "",
    },
    {
      id: buildId(),
      label: "Menu item 1",
      url: "/",
      role: "item" as const,
      description: "Description",
      icon: firstIcon,
    },
    {
      id: buildId(),
      label: "Menu item 2",
      url: "/",
      role: "item" as const,
      description: "Description",
      icon: secondIcon,
    },
  ];
};

export const buildMultiBlockLinkGroups = () =>
  Array.from({ length: 4 }, () => ({
    id: buildId(),
    label: "Link list",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "links" as const,
    multiLayout: "multi-links" as const,
    linkColumns: 1,
    linkWidth: 3,
    linkTextAlign: "left" as const,
    children: buildEasyColumnLinkItems(),
  }));

const buildMultiBlockThreeColumnsPhoto = () => {
  const linkGroups = Array.from({ length: 3 }, () => ({
    id: buildId(),
    label: "Link list",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "links" as const,
    multiLayout: "multi-3-photo" as const,
    linkColumns: 1,
    linkWidth: 3,
    linkTextAlign: "left" as const,
    children: buildEasyColumnLinkItems(),
  }));
  const imageGroup: MenuItem = {
    id: buildId(),
    label: "Image title",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "image",
    multiLayout: "multi-3-photo",
    icon: `${ICON_PREFIX}image`,
    description: "",
    imageWidth: 3,
    imageNoFill: false,
    imageTextAlign: "left",
  };
  return [...linkGroups, imageGroup];
};

const buildMultiBlockTwoColumnsTwoPhotos = () => {
  const buildLinkGroup = () => ({
    id: buildId(),
    label: "Link list",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "links" as const,
    multiLayout: "multi-2-photos" as const,
    linkColumns: 1,
    linkWidth: 3,
    linkTextAlign: "left" as const,
    children: buildEasyColumnLinkItems(),
  });
  const buildImageGroup = () => ({
    id: buildId(),
    label: "Image title",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "image" as const,
    multiLayout: "multi-2-photos" as const,
    icon: `${ICON_PREFIX}image`,
    description: "",
    imageWidth: 3,
    imageNoFill: false,
    imageTextAlign: "left" as const,
  });
  return [buildLinkGroup(), buildImageGroup(), buildLinkGroup(), buildImageGroup()];
};

const buildMultiBlockOneColumnThreePhotos = () => {
  const linkGroup = {
    id: buildId(),
    label: "Link list",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "links" as const,
    multiLayout: "multi-1-3-photos" as const,
    linkColumns: 1,
    linkWidth: 3,
    linkTextAlign: "left" as const,
    children: buildEasyColumnLinkItems(),
  };
  const buildImageGroup = () => ({
    id: buildId(),
    label: "Image title",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "image" as const,
    multiLayout: "multi-1-3-photos" as const,
    icon: `${ICON_PREFIX}image`,
    description: "",
    imageWidth: 3,
    imageNoFill: false,
    imageTextAlign: "left" as const,
  });
  return [linkGroup, buildImageGroup(), buildImageGroup(), buildImageGroup()];
};

const buildMultiBlockFourImages = () =>
  Array.from({ length: 4 }, () => ({
    id: buildId(),
    label: "Image title",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "image" as const,
    multiLayout: "multi-4-images" as const,
    icon: `${ICON_PREFIX}image`,
    description: "",
    imageWidth: 3,
    imageNoFill: false,
    imageTextAlign: "left" as const,
  }));

const buildMultiBlockFourProducts = () =>
  Array.from({ length: 4 }, () => ({
    id: buildId(),
    label: "Example Product Title",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "product" as const,
    multiLayout: "multi-4-products" as const,
    productLayout: "image-top" as const,
    productWidth: 3,
    productIds: [],
  }));

const buildMultiBlockMapContactAddress = () => {
  const mapHtml =
    '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d476861.25720572006!2d105.37180736560343!3d20.973445013776995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135008e13800a29%3A0x2987e416210b90d!2sSMOqIE7hu5lpLCBWAeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1575429838619!5m2!1svi!2s" width="100%" height="260" frameborder="0" style="border:0; pointer-events:auto;" allowfullscreen="" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>';
  const addressHtml =
    "Adi-Dassler-Strasse 191074 Herzogenaurach Germany<br/>Phone: +49 (0) 9132 84-0<br/>Working hours: 8:00 - 16:00, Monday - Friday";
  const mapBlock: MenuItem = {
    id: buildId(),
    label: "Custom HTML",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "html",
    multiLayout: "multi-map-contact-address",
    icon: `${ICON_PREFIX}code`,
    htmlContent: mapHtml,
    imageWidth: 3,
  };
  const contactBlock: MenuItem = {
    id: buildId(),
    label: "Contact",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "contact",
    multiLayout: "multi-map-contact-address",
    contactTitle: "Contact",
    contactDescription: "",
    contactNameLabel: "Name",
    contactEmailLabel: "Email",
    contactPhoneLabel: "Phone number",
    contactMessageLabel: "Message",
    contactSubmitLabel: "Send",
    contactSuccessMessage: "Thanks for contacting us. We'll get back to you soon.",
    imageWidth: 6,
  };
  const addressBlock: MenuItem = {
    id: buildId(),
    label: "Address",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "html",
    multiLayout: "multi-map-contact-address",
    icon: `${ICON_PREFIX}code`,
    htmlContent: addressHtml,
    imageWidth: 3,
  };
  return [mapBlock, contactBlock, addressBlock];
};

const buildProductListColumnItems = (
  headingLabel: string,
  productLayout: "image-top" | "image-left" = "image-left",
  itemCount: number = 4
) => {
  const productItems = Array.from({ length: itemCount }, () => ({
    id: buildId(),
    label: "Example Product Title",
    url: "",
    role: "item" as const,
    blockTemplate: "product" as const,
    productLayout,
    productIds: [],
    icon: `${ICON_PREFIX}tag`,
  }));
  return [
    {
      id: buildId(),
      label: headingLabel,
      url: "",
      role: "item" as const,
      isHeading: true,
      description: "",
    },
    ...productItems,
  ];
};

export const buildProductGridItems = () => buildProductListColumnItems("Heading", "image-top");
export const buildProductListItems = () => buildProductListColumnItems("Heading", "image-left", 3);
export const buildHorizontalProductGridItems = () =>
  buildProductListColumnItems("Heading", "image-left");

export const buildProductCarouselItems = () =>
  Array.from({ length: 8 }, () => ({
    id: buildId(),
    label: "Example Product Title",
    url: "",
    role: "item" as const,
    blockTemplate: "product" as const,
    productLayout: "image-top" as const,
    productIds: [],
    icon: `${ICON_PREFIX}tag`,
  }));

const buildMultiBlockFourProductList = () => {
  const headings = Array.from({ length: 4 }, () => "Product list");
  return headings.map((label) => ({
    id: buildId(),
    label,
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "product" as const,
    multiLayout: "multi-4-product-list" as const,
    productLayout: "image-left" as const,
    productWidth: 3,
    productIds: [],
    children: buildProductListColumnItems(label),
  }));
};

const buildMultiBlockOneColumnThreeProductList = () => {
  const linkGroup: MenuItem = {
    id: buildId(),
    label: "Link list",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "links",
    multiLayout: "multi-1-column-3-product-list",
    linkColumns: 1,
    linkWidth: 2,
    linkTextAlign: "left",
    children: buildSingleColumnLinkItems(),
  };
  const productGroups = Array.from({ length: 3 }, () => ({
    id: buildId(),
    label: "Product list",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "product" as const,
    multiLayout: "multi-1-column-3-product-list" as const,
    productLayout: "image-left" as const,
    productWidth: 3,
    productIds: [],
    children: buildProductListColumnItems("Product list"),
  }));
  return [linkGroup, ...productGroups];
};

const buildMultiBlockProductCarousel = () => ({
  id: buildId(),
  label: "Product carousel",
  url: "",
  role: "group" as const,
  expanded: false,
  blockTemplate: "product" as const,
  multiLayout: "multi-product-carousel" as const,
  productLayout: "image-top" as const,
  productWidth: 12,
  productIds: [],
  children: Array.from({ length: 8 }, () => ({
    id: buildId(),
    label: "Example Product Title",
    url: "",
    role: "item" as const,
    blockTemplate: "product" as const,
    productLayout: "image-top" as const,
    productIds: [],
    icon: `${ICON_PREFIX}tag`,
  })),
});

const buildMultiBlockLinkListProductCarousel = () => {
  const linkGroup: MenuItem = {
    id: buildId(),
    label: "Link list",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "links",
    multiLayout: "multi-link-list-product-carousel",
    linkColumns: 1,
    linkWidth: 3,
    linkTextAlign: "left",
    children: buildSingleColumnLinkItems(),
  };
  const carouselGroup: MenuItem = {
    id: buildId(),
    label: "Product carousel",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "product",
    multiLayout: "multi-link-list-product-carousel",
    productLayout: "image-top",
    productWidth: 9,
    productIds: [],
    children: Array.from({ length: 8 }, () => ({
      id: buildId(),
      label: "Example Product Title",
      url: "",
      role: "item",
      blockTemplate: "product",
      productLayout: "image-top",
      productIds: [],
      icon: `${ICON_PREFIX}tag`,
    })),
  };
  return [linkGroup, carouselGroup];
};

const buildMultiBlockImageProductCarousel = () => {
  const imageGroup: MenuItem = {
    id: buildId(),
    label: "Image title",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "image",
    multiLayout: "multi-image-product-carousel",
    icon: `${ICON_PREFIX}image`,
    description: "",
    imageWidth: 3,
    imageNoFill: false,
    imageTextAlign: "left",
  };
  const carouselGroup: MenuItem = {
    id: buildId(),
    label: "Product carousel",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "product",
    multiLayout: "multi-image-product-carousel",
    productLayout: "image-top",
    productWidth: 9,
    productIds: [],
    children: Array.from({ length: 8 }, () => ({
      id: buildId(),
      label: "Example Product Title",
      url: "",
      role: "item",
      blockTemplate: "product",
      productLayout: "image-top",
      productIds: [],
      icon: `${ICON_PREFIX}tag`,
    })),
  };
  return [imageGroup, carouselGroup];
};

const buildMultiBlockElementGroupMasonry = () => {
  const carouselGroup: MenuItem = {
    id: buildId(),
    label: "Product carousel",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "product",
    multiLayout: "multi-element-group-masonry",
    productLayout: "image-top",
    productWidth: 6,
    productIds: [],
    children: Array.from({ length: 8 }, () => ({
      id: buildId(),
      label: "Example Product Title",
      url: "",
      role: "item",
      blockTemplate: "product",
      productLayout: "image-top",
      productIds: [],
      icon: `${ICON_PREFIX}tag`,
    })),
  };
  const linkGroup = () => ({
    id: buildId(),
    label: "Link list",
    url: "",
    role: "group" as const,
    expanded: false,
    blockTemplate: "links" as const,
    multiLayout: "multi-element-group-masonry" as const,
    linkColumns: 1,
    linkWidth: 3,
    linkTextAlign: "left" as const,
    children: buildSingleColumnLinkItems(),
  });
  const textGroup: MenuItem = {
    id: buildId(),
    label: "Heading",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "html",
    multiLayout: "multi-element-group-masonry",
    htmlContent:
      "The Current Culture Marketplace<br/>Our mission is to provide the world's most curated collection of sneakers, apparel, collectibles, trading cards and more.",
    imageWidth: 6,
  };
  return [carouselGroup, linkGroup(), linkGroup(), textGroup];
};

export const buildThreeColumnLinkItems = () => {
  const defaultItemLabels = [
    "Menu item 1",
    "Menu item 2",
    "Menu item 3",
    "Menu item 4",
    "Menu item 5",
    "Menu item 6",
    "Menu item 7",
    "Menu item 8",
    "Menu item 9",
  ];
  return [
    {
      id: buildId(),
      label: "Heading",
      url: "",
      role: "item" as const,
      isHeading: true,
      description: "",
    },
    ...defaultItemLabels.map((label) => ({
      id: buildId(),
      label,
      url: "/",
      role: "item" as const,
      description: "Description",
    })),
  ];
};

export const buildCollectionListItems = () =>
  Array.from({ length: 3 }, () => ({
    id: buildId(),
    label: "Collection title",
    url: "",
    role: "item" as const,
    blockTemplate: "collection" as const,
    collectionIds: [],
  }));

export const buildMultiBlockPreset = (templateId: BlockTemplateId) => {
  if (templateId === "multi-3-photo") return buildMultiBlockThreeColumnsPhoto();
  if (templateId === "multi-2-photos") return buildMultiBlockTwoColumnsTwoPhotos();
  if (templateId === "multi-1-3-photos") return buildMultiBlockOneColumnThreePhotos();
  if (templateId === "multi-4-images") return buildMultiBlockFourImages();
  if (templateId === "multi-4-products") return buildMultiBlockFourProducts();
  if (templateId === "multi-map-contact-address") return buildMultiBlockMapContactAddress();
  if (templateId === "multi-4-product-list") return buildMultiBlockFourProductList();
  if (templateId === "multi-1-column-3-product-list") return buildMultiBlockOneColumnThreeProductList();
  if (templateId === "multi-product-carousel") return [buildMultiBlockProductCarousel()];
  if (templateId === "multi-link-list-product-carousel") return buildMultiBlockLinkListProductCarousel();
  if (templateId === "multi-image-product-carousel") return buildMultiBlockImageProductCarousel();
  if (templateId === "multi-element-group-masonry") return buildMultiBlockElementGroupMasonry();
  return buildMultiBlockLinkGroups();
};
