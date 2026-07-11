import type { CSSProperties } from "react";
import { Icon } from "@shopify/polaris";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  PlusIcon,
} from "@shopify/polaris-icons";

import type { MenuItem, ProductSummary } from "../../../types";
import { updateItemById } from "../../../utils";
import type { PreviewBlockDeps } from "./deps";
export function renderProductBlockImpl(
  deps: PreviewBlockDeps,
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
) {
  const {
    menuItems,
    setMenuItems,
    draggedItemId,
    draggedParentId,
    setDraggedItemId,
    setDraggedParentId,
    lastDragOverIdRef,
    findParentId,
    moveItem,
    selectedItemId,
    handleSelectItem,
    handleDuplicateItem,
    openDeleteItemDialog,
    previewColors,
    subheadingTypography,
    descriptionTypography,
    useImageSpaceLayout,
    builderSettings,
    products,
    productCarouselPageById,
    setProductCarouselPageById,
    previewMenu,
    registerPreviewRow,
    themeSettings,
    isMobilePreview,
    useBlockFlexLayout,
  } = deps;
    const isGroupSelected = selectedItemId === group.id;
    const productWidth = Math.max(1, Math.min(12, group.productWidth ?? 3));
    const isCarouselLayout =
      group.blockTemplate === "product-carousel" ||
      group.multiLayout === "multi-product-carousel" ||
      group.multiLayout === "multi-link-list-product-carousel" ||
      group.multiLayout === "multi-image-product-carousel" ||
      group.multiLayout === "multi-element-group-masonry";
    const isProductGridLayout =
      group.blockTemplate === "product-grid" || group.blockTemplate === "product-grid-horizontal";
    const isProductListGroup =
      (group.blockTemplate === "product" || isProductGridLayout) &&
      Boolean(group.children?.length) &&
      !isCarouselLayout;
    const productLayout = isCarouselLayout
      ? "image-top"
      : group.children?.length && !isProductGridLayout
        ? "image-left"
        : group.productLayout ??
        (group.blockTemplate === "product-horizontal" ? "image-left" : "image-top");
    const productFlexBasis = `${Math.round((productWidth / 12) * 100)}%`;
    const productPreviewHeight = isMobilePreview ? 500 : useImageSpaceLayout ? 220 : 150;
    const isMultiLayout = Boolean(group.multiLayout);
    const resolvedProductFlexBasis =
      group.blockTemplate === "product-horizontal"
        ? "33%"
        : isProductListGroup
          ? productFlexBasis
          : !isCarouselLayout
            ? "20%"
            : productFlexBasis;
    const productItems = group.children ?? [];
    const headingItem = isProductListGroup ? productItems.find((child) => child.isHeading) : null;
    const productHeading = isProductListGroup
      ? headingItem?.label?.trim() ?? ""
      : group.label?.trim() ?? "";
    const showProductHeading = isProductListGroup
      ? Boolean(productHeading)
      : isCarouselLayout
        ? Boolean(productHeading)
        : Boolean(group.productListCount) && Boolean(productHeading);
    const selectedProductIds = isProductListGroup || isCarouselLayout ? [] : group.productIds ?? [];
    const selectedProducts = selectedProductIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is ProductSummary => Boolean(product));
    const productListCount = group.productListCount ?? 0;
    const limitedProducts = productListCount
      ? selectedProducts.slice(0, productListCount)
      : selectedProducts;
    const carouselItems = isCarouselLayout
      ? productItems.filter((child) => !child.isHeading)
      : [];
    const carouselSourceItems =
      isCarouselLayout && carouselItems.length === 0
        ? Array.from({ length: 8 }, () => null)
        : carouselItems;
    const carouselProducts = isCarouselLayout
      ? carouselSourceItems.map((child) => ({
        child: child ?? undefined,
        product: child ? products.find((product) => product.id === child.productIds?.[0]) ?? null : null,
      }))
      : [];
    const carouselPageSize = productWidth < 10 ? 3 : 4;
    const carouselPageCount = Math.max(1, Math.ceil(carouselProducts.length / carouselPageSize));
    const carouselPage = Math.min(
      productCarouselPageById[group.id] ?? 0,
      carouselPageCount - 1
    );
    const carouselStartIndex = carouselPage * carouselPageSize;
    const carouselPageItems = carouselProducts.slice(
      carouselStartIndex,
      carouselStartIndex + carouselPageSize
    );
    const displayProducts = isCarouselLayout
      ? carouselPageItems
      : isProductListGroup
        ? productItems
          .filter((child) => !child.isHeading)
          .map((child) => ({
            child,
            product: products.find((product) => product.id === child.productIds?.[0]) ?? null,
          }))
        : (limitedProducts.length
          ? limitedProducts
          : productListCount > 0
            ? Array.from({ length: productListCount }, () => null)
            : [null]
        ).map((product) => ({ product }));
    const cardGridStyle = isCarouselLayout
      ? {
        display: "flex",
        gap: 16,
        animation: "menucraftCarouselFade 180ms ease",
      }
      : isProductListGroup
        ? isProductGridLayout
          ? { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }
          : { display: "grid", gap: 16 }
        : productLayout === "image-top" && displayProducts.length > 1
          ? {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }
          : { display: "grid", gap: 16 };

    return (
      <div
        key={group.id}
        className="group relative border-1 border-transparent transition-colors hover:border-dotted hover:border-blue-500"
        ref={registerPreviewRow(group.id)}

        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", group.id);
          setDraggedItemId(group.id);
          const parentId = findParentId(menuItems, group.id);
          setDraggedParentId(parentId ?? null);
          lastDragOverIdRef.current = null;
        }}
        onDragOver={(event) => {
          if (!draggedItemId) return;
          const targetParentId = findParentId(menuItems, group.id);
          if (draggedParentId !== targetParentId) return;
          if (draggedItemId === group.id) return;
          event.preventDefault();
          if (lastDragOverIdRef.current === group.id) return;
          lastDragOverIdRef.current = group.id;
          setMenuItems((items) => moveItem(items, draggedItemId, group.id));
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (!draggedItemId) return;
          const targetParentId = findParentId(menuItems, group.id);
          if (draggedParentId !== targetParentId) return;
          setMenuItems((items) => moveItem(items, draggedItemId, group.id));
          setDraggedItemId(null);
          setDraggedParentId(null);
          lastDragOverIdRef.current = null;
        }}
        onDragEnd={() => {
          setDraggedItemId(null);
          setDraggedParentId(null);
          lastDragOverIdRef.current = null;
        }}
        style={{
          willChange: "transform",
          flex:
            options.flex ??
            (useImageSpaceLayout || isMultiLayout ? `0 0 ${resolvedProductFlexBasis}` : undefined),
          minWidth: isMultiLayout ? 0 : undefined,
          order: useImageSpaceLayout ? 0 : undefined,
          border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
          padding: "6px",
          borderRadius: 0,
          ...options.wrapperStyle,
        }}
      >
        <div className="pointer-events-none absolute right-4 top-3 z-10 flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            onClick={() => handleSelectItem(group.id, true)}
            aria-label="Edit item"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
          >
            <Icon source={EditIcon} />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicateItem(group.id)}
            aria-label="Duplicate item"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
          >
            <Icon source={DuplicateIcon} />
          </button>
          <button
            type="button"
            onClick={() => openDeleteItemDialog(group.id)}
            aria-label="Delete item"
            className="flex h-6 w-6 items-center justify-center rounded-md text-red-400 hover:bg-gray-800"
          >
            <Icon source={DeleteIcon} />
          </button>
        </div>
        <div
          style={{
            borderRadius: 16,
            background: "transparent",
            padding: "5px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {showProductHeading ? (
            <>
              <div
                style={{
                  color: previewColors.submenuHeading,
                  fontWeight: 600,
                  ...subheadingTypography,
                  lineHeight: 1.2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{productHeading}</span>
                    {headingItem?.badgeEnabled && headingItem.badgeText ? (
                      <span
                        style={{
                          background: headingItem.badgeType === "sold_out"
                            ? builderSettings.colorBadgeSoldOutBackground
                            : headingItem.badgeType === "none"
                              ? builderSettings.colorBadgeDefaultBackground
                              : builderSettings.colorBadgeSaleBackground,
                          color: headingItem.badgeType === "sold_out"
                            ? builderSettings.colorBadgeSoldOutText
                            : headingItem.badgeType === "none"
                              ? builderSettings.colorBadgeDefaultText
                              : builderSettings.colorBadgeSaleText,
                          borderRadius: 9999,
                          padding: "2px 8px",
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: 0.2,
                        }}
                      >
                        {headingItem.badgeText}
                      </span>
                    ) : null}
                  </div>
                  {headingItem?.description ? (
                    <div
                      style={Object.assign({}, descriptionTypography, {
                        fontSize: 12,
                        fontWeight: 400,
                        opacity: 0.8,
                        marginTop: 2,
                        color: previewColors.submenuDescription,
                      })}
                    >
                      {headingItem.description}
                    </div>
                  ) : null}
                </div>
              </div>
              <div
                style={{
                  borderTop: `1px solid ${previewColors.submenuHeading}`,
                  opacity: 0.5,
                }}
              />
            </>
          ) : null}
          <div
            style={{
              position: "relative",
              paddingBottom: isCarouselLayout && carouselPageCount > 1 ? 28 : undefined,
            }}
          >
            <div
              key={isCarouselLayout ? `${group.id}-page-${carouselPage}` : undefined}
              style={cardGridStyle}
            >
              {displayProducts.map(({ product, child }, index) => {
                const placeholderKey = `${group.id}-placeholder-${carouselStartIndex + index}`;
                const title = product?.title ?? child?.label ?? "Example Product Title";
                const imageSrc = product?.featuredImage?.url;
                const imageAlt = product?.featuredImage?.altText ?? title;
                const hasImage = Boolean(imageSrc);
                const isImageLeft = productLayout === "image-left";
                const productImageSize = isImageLeft ? (isMobilePreview ? 150 : 74) : undefined;
                const priceAmount = product?.priceRange?.minVariantPrice?.amount;
                const priceCurrency = product?.priceRange?.minVariantPrice?.currencyCode;
                const fallbackCurrency = priceCurrency || "USD";
                let priceLabel =
                  fallbackCurrency === "TRY"
                    ? "₺ 19,99"
                    : fallbackCurrency === "USD"
                      ? "$ 19,99"
                      : "$19.99";
                if (priceAmount) {
                  const rawAmount = priceAmount.trim();
                  const value = Number(rawAmount.replace(",", "."));
                  if (Number.isFinite(value)) {
                    const decimalSeparator = rawAmount.includes(".")
                      ? "."
                      : rawAmount.includes(",")
                        ? ","
                        : null;
                    const [wholePartRaw, decimalPartRaw = ""] = decimalSeparator
                      ? rawAmount.split(decimalSeparator)
                      : [rawAmount, ""];
                    const wholePart = (wholePartRaw ?? "").replace(/^0+/, "");
                    const decimalPart = decimalPartRaw.replace(/\s+/g, "");
                    const hasOnlyZeros = decimalPart.length > 0 && /^0+$/.test(decimalPart);
                    const shouldNormalize =
                      (!decimalSeparator && wholePart.length > 4) ||
                      (hasOnlyZeros && wholePart.length > 4);
                    const normalizedValue = shouldNormalize ? value / 100 : value;
                    try {
                      if (fallbackCurrency === "USD") {
                        priceLabel = `$ ${normalizedValue.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`;
                      } else if (fallbackCurrency === "TRY") {
                        const locale = "tr-TR";
                        const parts = new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: fallbackCurrency,
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).formatToParts(normalizedValue);
                        const currencyPart =
                          parts.find((part) => part.type === "currency")?.value ?? "₺";
                        const numberPart = parts
                          .filter((part) => part.type !== "currency")
                          .map((part) => part.value)
                          .join("")
                          .trim();
                        priceLabel = `${currencyPart} ${numberPart}`;
                      } else {
                        priceLabel = new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: fallbackCurrency,
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(normalizedValue);
                      }
                    } catch {
                      priceLabel =
                        fallbackCurrency === "TRY"
                          ? `₺ ${normalizedValue.toFixed(2).replace(".", ",")}`
                          : fallbackCurrency === "USD"
                            ? `$ ${normalizedValue.toFixed(2).replace(".", ",")}`
                            : `$${normalizedValue.toFixed(2)}`;
                    }
                  }
                }
                return (
                  <div
                    key={child?.id ?? product?.id ?? placeholderKey}
                    style={{
                      display: "flex",
                      flexDirection: isImageLeft ? "row" : "column",
                      gap: 12,
                      alignItems: isImageLeft ? "center" : undefined,
                      flex: isCarouselLayout
                        ? `0 0 calc(${100 / carouselPageSize}% - ${(16 * (carouselPageSize - 1)) / carouselPageSize
                        }px)`
                        : 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        background: "#f3f4f4",
                        width: isImageLeft ? productImageSize : "100%",
                        height: isImageLeft ? productImageSize : "auto",
                        flex: isImageLeft ? `0 0 ${productImageSize}px` : undefined,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        boxSizing: "border-box",
                      }}
                    >
                      {hasImage ? (
                        <img
                          src={imageSrc}
                          alt={imageAlt}
                          style={{
                            width: "100%",
                            height: "100%",
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <svg
                          className="gm-placeholder-svg"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 525.5 525.5"
                          style={{
                            width: "68%",
                            height: "68%",
                            fill: "rgba(148, 163, 184, 0.6)",
                          }}
                        >
                          <path d="M375.5 345.2c0-.1 0-.1 0 0 0-.1 0-.1 0 0-1.1-2.9-2.3-5.5-3.4-7.8-1.4-4.7-2.4-13.8-.5-19.8 3.4-10.6 3.6-40.6 1.2-54.5-2.3-14-12.3-29.8-18.5-36.9-5.3-6.2-12.8-14.9-15.4-17.9 8.6-5.6 13.3-13.3 14-23 0-.3 0-.6.1-.8.4-4.1-.6-9.9-3.9-13.5-2.1-2.3-4.8-3.5-8-3.5h-54.9c-.8-7.1-3-13-5.2-17.5-6.8-13.9-12.5-16.5-21.2-16.5h-.7c-8.7 0-14.4 2.5-21.2 16.5-2.2 4.5-4.4 10.4-5.2 17.5h-48.5c-3.2 0-5.9 1.2-8 3.5-3.2 3.6-4.3 9.3-3.9 13.5 0 .2 0 .5.1.8.7 9.8 5.4 17.4 14 23-2.6 3.1-10.1 11.7-15.4 17.9-6.1 7.2-16.1 22.9-18.5 36.9-2.2 13.3-1.2 47.4 1 54.9 1.1 3.8 1.4 14.5-.2 19.4-1.2 2.4-2.3 5-3.4 7.9-4.4 11.6-6.2 26.3-5 32.6 1.8 9.9 16.5 14.4 29.4 14.4h176.8c12.9 0 27.6-4.5 29.4-14.4 1.2-6.5-.5-21.1-5-32.7zm-97.7-178c.3-3.2.8-10.6-.2-18 2.4 4.3 5 10.5 5.9 18h-5.7zm-36.3-17.9c-1 7.4-.5 14.8-.2 18h-5.7c.9-7.5 3.5-13.7 5.9-18zm4.5-6.9c0-.1.1-.2.1-.4 4.4-5.3 8.4-5.8 13.1-5.8h.7c4.7 0 8.7.6 13.1 5.8 0 .1 0 .2.1.4 3.2 8.9 2.2 21.2 1.8 25h-30.7c-.4-3.8-1.3-16.1 1.8-25zm-70.7 42.5c0-.3 0-.6-.1-.9-.3-3.4.5-8.4 3.1-11.3 1-1.1 2.1-1.7 3.4-2.1l-.6.6c-2.8 3.1-3.7 8.1-3.3 11.6 0 .2 0 .5.1.8.3 3.5.9 11.7 10.6 18.8.3.2.8.2 1-.2.2-.3.2-.8-.2-1-9.2-6.7-9.8-14.4-10-17.7 0-.3 0-.6-.1-.8-.3-3.2.5-7.7 3-10.5.8-.8 1.7-1.5 2.6-1.9h155.7c1 .4 1.9 1.1 2.6 1.9 2.5 2.8 3.3 7.3 3 10.5 0 .2 0 .5-.1.8-.3 3.6-1 13.1-13.8 20.1-.3.2-.5.6-.3 1 .1.2.4.4.6.4.1 0 .2 0 .3-.1 13.5-7.5 14.3-17.5 14.6-21.3 0-.3 0-.5.1-.8.4-3.5-.5-8.5-3.3-11.6l-.6-.6c1.3.4 2.5 1.1 3.4 2.1 2.6 2.9 3.5 7.9 3.1 11.3 0 .3 0 .6-.1.9-1.5 20.9-23.6 31.4-65.5 31.4h-43.8c-41.8 0-63.9-10.5-65.4-31.4zm91 89.1h-7c0-1.5 0-3-.1-4.2-.2-12.5-2.2-31.1-2.7-35.1h3.6c.8 0 1.4-.6 1.4-1.4v-14.1h2.4v14.1c0 .8.6 1.4 1.4 1.4h3.7c-.4 3.9-2.4 22.6-2.7 35.1v4.2zm65.3 11.9h-16.8c-.4 0-.7.3-.7.7 0 .4.3.7.7.7h16.8v2.8h-62.2c0-.9-.1-1.9-.1-2.8h33.9c.4 0 .7-.3.7-.7 0-.4-.3-.7-.7-.7h-33.9c-.1-3.2-.1-6.3-.1-9h62.5v9zm-12.5 24.4h-6.3l.2-1.6h5.9l.2 1.6zm-5.8-4.5l1.6-12.3h2l1.6 12.3h-5.2zm-57-19.9h-62.4v-9h62.5c0 2.7 0 5.8-.1 9zm-62.4 1.4h62.4c0 .9-.1 1.8-.1 2.8H194v-2.8zm65.2 0h7.3c0 .9.1 1.8.1 2.8H259c.1-.9.1-1.8.1-2.8zm7.2-1.4h-7.2c.1-3.2.1-6.3.1-9h7c0 2.7 0 5.8.1 9zm-7.7-66.7v6.8h-9v-6.8h9zm-8.9 8.3h9v.7h-9v-.7zm0 2.1h9v2.3h-9v-2.3zm26-1.4h-9v-.7h9v.7zm-9 3.7v-2.3h9v2.3h-9zm9-5.9h-9v-6.8h9v6.8zm-119.3 91.1c-2.1-7.1-3-40.9-.9-53.6 2.2-13.5 11.9-28.6 17.8-35.6 5.6-6.5 13.5-15.7 15.7-18.3 11.4 6.4 28.7 9.6 51.8 9.6h6v14.1c0 .8.6 1.4 1.4 1.4h5.4c.3 3.1 2.4 22.4 2.7 35.1 0 1.2.1 2.6.1 4.2h-63.9c-.8 0-1.4.6-1.4 1.4v16.1c0 .8.6 1.4 1.4 1.4H256c-.8 11.8-2.8 24.7-8 33.3-2.6 4.4-4.9 8.5-6.9 12.2-.4.7-.1 1.6.6 1.9.2.1.4.2.6.2.5 0 1-.3 1.3-.8 1.9-3.7 4.2-7.7 6.8-12.1 5.4-9.1 7.6-22.5 8.4-34.7h7.8c.7 11.2 2.6 23.5 7.1 32.4.2.5.8.8 1.3.8.2 0 .4 0 .6-.2.7-.4 1-1.2.6-1.9-4.3-8.5-6.1-20.3-6.8-31.1H312l-2.4 18.6c-.1.4.1.8.3 1.1.3.3.7.5 1.1.5h9.6c.4 0 .8-.2 1.1-.5.3-.3.4-.7.3-1.1l-2.4-18.6H333c.8 0 1.4-.6 1.4-1.4v-16.1c0-.8-.6-1.4-1.4-1.4h-63.9c0-1.5 0-2.9.1-4.2.2-12.7 2.3-32 2.7-35.1h5.2c.8 0 1.4-.6 1.4-1.4v-14.1h6.2c23.1 0 40.4-3.2 51.8-9.6 2.3 2.6 10.1 11.8 15.7 18.3 5.9 6.9 15.6 22.1 17.8 35.6 2.2 13.4 2 43.2-1.1 53.1-1.2 3.9-1.4 8.7-1 13-1.7-2.8-2.9-4.4-3-4.6-.2-.3-.6-.5-.9-.6h-.5c-.2 0-.4.1-.5.2-.6.5-.8 1.4-.3 2 0 0 .2.3.5.8 1.4 2.1 5.6 8.4 8.9 16.7h-42.9v-43.8c0-.8-.6-1.4-1.4-1.4s-1.4.6-1.4 1.4v44.9c0 .1-.1.2-.1.3 0 .1 0 .2.1.3v9c-1.1 2-3.9 3.7-10.5 3.7h-7.5c-.4 0-.7.3-.7.7 0 .4.3.7.7.7h7.5c5 0 8.5-.9 10.5-2.8-.1 3.1-1.5 6.5-10.5 6.5H210.4c-9 0-10.5-3.4-10.5-6.5 2 1.9 5.5 2.8 10.5 2.8h67.4c.4 0 .7-.3.7-.7 0-.4-.3-.7-.7-.7h-67.4c-6.7 0-9.4-1.7-10.5-3.7v-54.5c0-.8-.6-1.4-1.4-1.4s-1.4.6-1.4 1.4v43.8h-43.6c4.2-10.2 9.4-17.4 9.5-17.5.5-.6.3-1.5-.3-2s-1.5-.3-2 .3c-.1.2-1.4 2-3.2 5 .1-4.9-.4-10.2-1.1-12.8zm221.4 60.2c-1.5 8.3-14.9 12-26.6 12H174.4c-11.8 0-25.1-3.8-26.6-12-1-5.7.6-19.3 4.6-30.2H197v9.8c0 6.4 4.5 9.7 13.4 9.7h105.4c8.9 0 13.4-3.3 13.4-9.7v-9.8h44c4 10.9 5.6 24.5 4.6 30.2z"></path>
                          <path d="M286.1 359.3c0 .4.3.7.7.7h14.7c.4 0 .7-.3.7-.7 0-.4-.3-.7-.7-.7h-14.7c-.3 0-.7.3-.7.7zm5.3-145.6c13.5-.5 24.7-2.3 33.5-5.3.4-.1.6-.5.4-.9-.1-.4-.5-.6-.9-.4-8.6 3-19.7 4.7-33 5.2-.4 0-.7.3-.7.7 0 .4.3.7.7.7zm-11.3.1c.4 0 .7-.3.7-.7 0-.4-.3-.7-.7-.7H242c-19.9 0-35.3-2.5-45.9-7.4-.4-.2-.8 0-.9.3-.2.4 0 .8.3.9 10.8 5 26.4 7.5 46.5 7.5h38.1zm-7.2 116.9c.4.1.9.1 1.4.1 1.7 0 3.4-.7 4.7-1.9 1.4-1.4 1.9-3.2 1.5-5-.2-.8-.9-1.2-1.7-1.1-.8.2-1.2.9-1.1 1.7.3 1.2-.4 2-.7 2.4-.9.9-2.2 1.3-3.4 1-.8-.2-1.5.3-1.7 1.1s.2 1.5 1 1.7z"></path>
                          <path d="M275.5 331.6c-.8 0-1.4.6-1.5 1.4 0 .8.6 1.4 1.4 1.5h.3c3.6 0 7-2.8 7.7-6.3.2-.8-.4-1.5-1.1-1.7-.8-.2-1.5.4-1.7 1.1-.4 2.3-2.8 4.2-5.1 4zm5.4 1.6c-.6.5-.6 1.4-.1 2 1.1 1.3 2.5 2.2 4.2 2.8.2.1.3.1.5.1.6 0 1.1-.3 1.3-.9.3-.7-.1-1.6-.8-1.8-1.2-.5-2.2-1.2-3-2.1-.6-.6-1.5-.6-2.1-.1zm-38.2 12.7c.5 0 .9 0 1.4-.1.8-.2 1.3-.9 1.1-1.7-.2-.8-.9-1.3-1.7-1.1-1.2.3-2.5-.1-3.4-1-.4-.4-1-1.2-.8-2.4.2-.8-.3-1.5-1.1-1.7-.8-.2-1.5.3-1.7 1.1-.4 1.8.1 3.7 1.5 5 1.2 1.2 2.9 1.9 4.7 1.9z"></path>
                          <path d="M241.2 349.6h.3c.8 0 1.4-.7 1.4-1.5s-.7-1.4-1.5-1.4c-2.3.1-4.6-1.7-5.1-4-.2-.8-.9-1.3-1.7-1.1-.8.2-1.3.9-1.1 1.7.7 3.5 4.1 6.3 7.7 6.3zm-9.7 3.6c.2 0 .3 0 .5-.1 1.6-.6 3-1.6 4.2-2.8.5-.6.5-1.5-.1-2s-1.5-.5-2 .1c-.8.9-1.8 1.6-3 2.1-.7.3-1.1 1.1-.8 1.8 0 .6.6.9 1.2.9z"></path>
                        </svg>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          color: previewColors.submenuText,
                          fontWeight: 600,
                          ...subheadingTypography,
                          lineHeight: 1.2,
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          color: previewColors.submenuDescription,
                          ...descriptionTypography,
                          lineHeight: 1.2,
                        }}
                      >
                        {priceLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {isCarouselLayout && carouselPageCount > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setProductCarouselPageById((prev) => ({
                      ...prev,
                      [group.id]: Math.max(0, carouselPage - 1),
                    }))
                  }
                  disabled={carouselPage === 0}
                  aria-label="Previous slide"
                  className="flex items-center justify-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 8,
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    color: "#374151",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    cursor: carouselPage === 0 ? "not-allowed" : "pointer",
                    opacity: carouselPage === 0 ? 0.4 : 1,
                    pointerEvents: "auto",
                    zIndex: 2,
                  }}
                >
                  <Icon source={ChevronLeftIcon} tone="base" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setProductCarouselPageById((prev) => ({
                      ...prev,
                      [group.id]: Math.min(carouselPageCount - 1, carouselPage + 1),
                    }))
                  }
                  disabled={carouselPage >= carouselPageCount - 1}
                  aria-label="Next slide"
                  className="flex items-center justify-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    color: "#374151",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    cursor: carouselPage >= carouselPageCount - 1 ? "not-allowed" : "pointer",
                    opacity: carouselPage >= carouselPageCount - 1 ? 0.4 : 1,
                    pointerEvents: "auto",
                    zIndex: 2,
                  }}
                >
                  <Icon source={ChevronRightIcon} tone="base" />
                </button>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 0,
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 6,
                  }}
                >
                  {Array.from({ length: carouselPageCount }, (_, index) => {
                    const isActive = index === carouselPage;
                    return (
                      <button
                        key={`${group.id}-dot-${index}`}
                        type="button"
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() =>
                          setProductCarouselPageById((prev) => ({
                            ...prev,
                            [group.id]: index,
                          }))
                        }
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 9999,
                          border: "none",
                          background: isActive ? "#111827" : "#cbd5e1",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      />
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
}
