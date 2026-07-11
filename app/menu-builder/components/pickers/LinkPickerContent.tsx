import { ActionList, Box, Button, Divider, Icon, Text, TextField } from "@shopify/polaris";
import {
  BlogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CollectionIcon,
  CollectionListIcon,
  HomeIcon,
  PageIcon,
  ProductIcon,
  ProductListIcon,
  SearchIcon,
} from "@shopify/polaris-icons";

import type { BlogSummary, PageSummary, ProductSummary } from "../../types";
import type { CollectionPickerItem } from "./CollectionPickerPanel";

type LinkPickerContentProps = {
  onSelect: (url: string, label: string) => void;
  linkSearchQuery: string;
  setLinkSearchQuery: (value: string) => void;
  linkPickerCategory: string | null;
  setLinkPickerCategory: (value: string | null) => void;
  setLinkPickerOpenId: (value: string | null) => void;
  products: ProductSummary[];
  collections: CollectionPickerItem[];
  pages: PageSummary[];
  blogs: BlogSummary[];
};

export function LinkPickerContent({
  onSelect,
  linkSearchQuery,
  setLinkSearchQuery,
  linkPickerCategory,
  setLinkPickerCategory,
  setLinkPickerOpenId,
  products,
  collections,
  pages,
  blogs,
}: LinkPickerContentProps) {
  const query = linkSearchQuery.toLowerCase().trim();

  const handleSelect = (url: string, label: string) => {
    onSelect(url, label);
    setLinkPickerOpenId(null);
    setLinkSearchQuery("");
    setLinkPickerCategory(null);
  };

  if (!linkPickerCategory) {
    // Level 0: Categories and Common Links
    const categories = [
      { label: "Home", url: "/", icon: HomeIcon },
      { label: "Search", url: "/search", icon: SearchIcon },
      { label: "All collections", url: "/collections", icon: CollectionListIcon },
      { label: "All products", url: "/collections/all", icon: ProductListIcon },
      { label: "Collections", type: "category", id: "collections", icon: CollectionIcon },
      { label: "Products", type: "category", id: "products", icon: ProductIcon },
      { label: "Pages", type: "category", id: "pages", icon: PageIcon },
      { label: "Blogs", type: "category", id: "blogs", icon: BlogIcon },
    ];

    return (
      <div style={{ width: "240px" }}>
        <ActionList
          items={categories.map((item) => ({
            content: item.label,
            icon: item.icon,
            suffix: item.type === "category" ? <Icon source={ChevronRightIcon} tone="subdued" /> : null,
            onAction: () => {
              if (item.type === "category") {
                setLinkPickerCategory(item.id!);
              } else {
                handleSelect(item.url!, item.label);
              }
            },
          }))}
        />
      </div>
    );
  }

  // Level 1: Category Details with Search
  let items: Array<{ title: string; handle: string; image?: any }> = [];
  let title = "";
  let urlPrefix = "";
  let itemIcon = ProductIcon;

  switch (linkPickerCategory) {
    case "products":
      items = products;
      title = "Products";
      urlPrefix = "/products/";
      itemIcon = ProductIcon;
      break;
    case "collections":
      items = collections;
      title = "Collections";
      urlPrefix = "/collections/";
      itemIcon = CollectionIcon;
      break;
    case "pages":
      items = pages;
      title = "Pages";
      urlPrefix = "/pages/";
      itemIcon = PageIcon;
      break;
    case "blogs":
      items = blogs;
      title = "Blogs";
      urlPrefix = "/blogs/";
      itemIcon = BlogIcon;
      break;
  }

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query)
  );

  return (
    <div style={{ width: "240px" }}>
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <Button
          variant="plain"
          icon={ChevronLeftIcon}
          onClick={() => {
            setLinkPickerCategory(null);
            setLinkSearchQuery("");
          }}
        />
        <Text as="span" variant="headingSm">
          {title}
        </Text>
      </div>
      <Box padding="200">
        <TextField
          label={`Search ${title.toLowerCase()}`}
          labelHidden
          value={linkSearchQuery}
          onChange={setLinkSearchQuery}
          prefix={<Icon source={SearchIcon} tone="subdued" />}
          placeholder={`Search ${title.toLowerCase()}`}
          autoComplete="off"
          focused={true}
        />
      </Box>
      <Divider />
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        {filteredItems.length === 0 ? (
          <Box padding="400">
            <Text as="p" textAlign="center" tone="subdued">
              No results found
            </Text>
          </Box>
        ) : (
          <ActionList
            items={filteredItems.map((item) => ({
              content: item.title,
              media: item.image?.url ? (
                <img
                  src={item.image.url}
                  alt=""
                  style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }}
                />
              ) : (
                <Icon source={itemIcon} tone="subdued" />
              ),
              onAction: () => handleSelect(`${urlPrefix}${item.handle}`, item.title),
            }))}
          />
        )}
      </div>
    </div>
  );
}
