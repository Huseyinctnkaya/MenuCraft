import { Button, Text } from "@shopify/polaris";
import type { NavigateFunction } from "@remix-run/react";

import { BLOCK_TEMPLATES } from "../../constants";
import type { BlockTemplateId, SubmenuTemplateId } from "../../types";
import { renderBlockTemplatePreviewCard } from "./BlockTemplatePreviewCard";

type BlockTemplatePreviewPanelProps = {
  blockTemplateTargetId: string | null;
  blockTemplateHoverId: BlockTemplateId | null;
  setBlockTemplateHoverId: (id: BlockTemplateId | null) => void;
  blockTemplatePanelHover: boolean;
  setBlockTemplatePanelHover: (hover: boolean) => void;
  clearBlockTemplateHoverTimeout: () => void;
  handleApplyBlockTemplate: (templateId: BlockTemplateId) => void;
  handleApplyTabsBlockTemplate: (templateId: SubmenuTemplateId) => void;
  isPlusPlan: boolean;
  isProPlan: boolean;
  navigate: NavigateFunction;
};

export function BlockTemplatePreviewPanel({
  blockTemplateTargetId,
  blockTemplateHoverId,
  setBlockTemplateHoverId,
  blockTemplatePanelHover,
  setBlockTemplatePanelHover,
  clearBlockTemplateHoverTimeout,
  handleApplyBlockTemplate,
  handleApplyTabsBlockTemplate,
  isPlusPlan,
  isProPlan,
  navigate,
}: BlockTemplatePreviewPanelProps) {
    const isOpen = Boolean(blockTemplateTargetId);
    const activeTemplate = BLOCK_TEMPLATES.find((template) => template.id === blockTemplateHoverId);
    const showPanel = isOpen && Boolean(activeTemplate || blockTemplatePanelHover);
    const previewTitle = activeTemplate?.label ?? "Block preview";

    const renderPreviewForTemplate = () => {
      if (!activeTemplate) return null;
      const selectTemplate = () => handleApplyBlockTemplate(activeTemplate.id);
      switch (activeTemplate.id) {
        case "space":
          return renderBlockTemplatePreviewCard({
            title: "Space",
            onSelect: selectTemplate,
            showSelectButton: false,
            showTitle: false,
            previewHeightClassName: "h-44",
            previewContainerClassName: "bg-transparent p-0",
            preview: (
              <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                <img
                  src="/Space.png"
                  alt="Space template"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                  Space
                </div>
                <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <Button
                    fullWidth
                    onClick={selectTemplate}
                    size="slim"
                    variant="primary"
                    style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ),
          });
        case "multi":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Element Group (Mansory Order)",
                onSelect: isPlusPlan ? () => handleApplyBlockTemplate("multi-element-group-masonry") : () => navigate("/app/pricing"),
                badge: "Plus",
                selectLabel: isPlusPlan ? "Select" : "Upgrade to Plus",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-carousel.png"
                      alt="Element Group (Mansory Order) template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Element Group (Mansory Order)
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={
                          isPlusPlan ? () => handleApplyBlockTemplate("multi-element-group-masonry") : () => navigate("/app/pricing")
                        }
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isPlusPlan ? "Select" : "Upgrade to Plus"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Link list",
                onSelect: () => handleApplyBlockTemplate("multi"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/link-list-multiblock.png"
                      alt="Multi block link list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Link list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "4 product list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-4-product-list") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/4-product-list.png"
                      alt="4 product list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      4 product list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("multi-4-product-list") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "3 columns + 1 photo",
                onSelect: () => handleApplyBlockTemplate("multi-3-photo"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/3columns+1photo.png"
                      alt="3 columns + 1 photo template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      3 columns + 1 photo
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-3-photo")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "1 link list + 3 product list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-1-column-3-product-list") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/1link-list+3product-columns.png"
                      alt="1 link list + 3 product list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      1 link list + 3 product list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={
                          isProPlan ? () => handleApplyBlockTemplate("multi-1-column-3-product-list") : () => navigate("/app/pricing")
                        }
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "2 columns + 2 photos",
                onSelect: () => handleApplyBlockTemplate("multi-2-photos"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/2columns+2photos.png"
                      alt="2 columns + 2 photos template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      2 columns + 2 photos
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-2-photos")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Product carousel",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-product-carousel") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-carousel.png"
                      alt="Product carousel template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product carousel
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("multi-product-carousel") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "1 column + 3 photos",
                onSelect: () => handleApplyBlockTemplate("multi-1-3-photos"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/1column%20+%203photos.png"
                      alt="1 column + 3 photos template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      1 column + 3 photos
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-1-3-photos")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "1 link list + product carousel",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-link-list-product-carousel") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/1link-list+product-carousel.png"
                      alt="1 link list + product carousel template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      1 link list + product carousel
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={
                          isProPlan ? () => handleApplyBlockTemplate("multi-link-list-product-carousel") : () => navigate("/app/pricing")
                        }
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "4 images",
                onSelect: () => handleApplyBlockTemplate("multi-4-images"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/4images.png"
                      alt="4 images template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      4 images
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-4-images")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Image + product carousel",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-image-product-carousel") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/image+product-carousel.png"
                      alt="Image + product carousel template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Image + product carousel
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={
                          isProPlan ? () => handleApplyBlockTemplate("multi-image-product-carousel") : () => navigate("/app/pricing")
                        }
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "4 products",
                onSelect: () => handleApplyBlockTemplate("multi-4-products"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/4products.png"
                      alt="4 products template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      4 products
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-4-products")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Map + contact + address",
                onSelect: () => handleApplyBlockTemplate("multi-map-contact-address"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/map-contact-adres.png"
                      alt="Map + contact + address template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Map + contact + address
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-map-contact-address")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "tabs":
          return (
            <div className="flex flex-col gap-0">
              {(
                [
                  {
                    id: "simple-left-tabs",
                    label: "Simple Left Tabs",
                    image: "/simple-left-tabs.png",
                  },
                  {
                    id: "simple-top-tabs",
                    label: "Simple Top Tabs",
                    image: "/simple-top-tabs.png",
                  },
                  { id: "two-top-tabs", label: "Two Top Tabs", image: "/two-top-tabs.png" },
                  { id: "three-top-tabs", label: "Three Top Tabs", image: "/three-top-tabs.png" },
                  { id: "two-level-tabs", label: "Two Level Tabs", image: "/two-level-tabs.png" },
                  { id: "three-level-tabs", label: "Three Level Tabs", image: "/three-level-tabs.png" },
                ] as Array<{ id: SubmenuTemplateId; label: string; image: string }>
              ).map((template) => {
                const isAllowed = isPlusPlan;
                return renderBlockTemplatePreviewCard({
                  title: template.label,
                  onSelect: () => {
                    if (!isAllowed) return navigate("/app/pricing");
                    handleApplyTabsBlockTemplate(template.id);
                  },
                  badge: "Plus",
                  selectLabel: isAllowed ? "Select" : "Upgrade to Plus",
                  selectDisabled: false,
                  showSelectButton: true,
                  showTitle: false,
                  previewHeightClassName: "h-44",
                  previewContainerClassName: "bg-transparent p-0",
                  preview: (
                    <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                      <img
                        src={template.image}
                        alt={`${template.label} template`}
                        className="h-full w-full object-contain"
                      />
                      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                        {template.label}
                      </div>
                    </div>
                  ),
                });
              })}
            </div>
          );
        case "image":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Image 1",
                onSelect: () => handleApplyBlockTemplate("image"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/image%201.png"
                      alt="Image 1 template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Image 1
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("image")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Image 2",
                onSelect: () => handleApplyBlockTemplate("image2"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/I%CC%87mage%202.png"
                      alt="Image 2 template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Image 2
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("image2")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "links":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Link list (2 columns)",
                onSelect: () => handleApplyBlockTemplate("links"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/two-columns.png"
                      alt="Link list (2 columns) template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Link list (2 columns)
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("links")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Link list (3 columns)",
                onSelect: () => handleApplyBlockTemplate("links-3"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/3-columns.png"
                      alt="Link list (3 columns) template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Link list (3 columns)
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("links-3")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Easy column",
                onSelect: () => handleApplyBlockTemplate("links-easy"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/easy-column.png"
                      alt="Easy column template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Easy column
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("links-easy")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Columns with icons",
                onSelect: () => handleApplyBlockTemplate("links-icons"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/columns-with-icons.png"
                      alt="Columns with icons template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Columns with icons
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("links-icons")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "product":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Product grid",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("product-grid") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-grid.png"
                      alt="Product grid template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product grid
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("product-grid") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Product",
                onSelect: () => handleApplyBlockTemplate("product"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product.png"
                      alt="Product template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("product")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Product carousel",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("product-carousel") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-carousel.png"
                      alt="Product carousel template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product carousel
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("product-carousel") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Product (Horizontal)",
                onSelect: () => handleApplyBlockTemplate("product-horizontal"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-yatay.png"
                      alt="Product horizontal template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product horizontal
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("product-horizontal")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Product list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("product-list") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-list.png"
                      alt="Product list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("product-list") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Horizontal product grid",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("product-grid-horizontal") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-grid-horizontal.png"
                      alt="Horizontal product grid template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Horizontal product grid
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("product-grid-horizontal") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "collection":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Collection list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("collection") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/collection-list.png"
                      alt="Collection list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Collection list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("collection") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Horizontal collection list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("collection-horizontal") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/horizontal-collection-list.png"
                      alt="Horizontal collection list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Horizontal collection list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("collection-horizontal") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "blogs":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Articles",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("blogs") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/articles-blog.png"
                      alt="Articles template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Articles
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("blogs") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Latest blog",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("blogs-latest") : () => navigate("/app/pricing"),
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to Pro",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/latest-blog.png"
                      alt="Latest blog template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Latest blog
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("blogs-latest") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to Pro"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "contact":
          return renderBlockTemplatePreviewCard({
            title: "Contact form",
            onSelect: selectTemplate,
            showSelectButton: false,
            showTitle: false,
            previewHeightClassName: "h-44",
            previewContainerClassName: "bg-transparent p-0",
            preview: (
              <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                <img
                  src="/contact%20form.png"
                  alt="Contact form template"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                  Contact form
                </div>
                <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <Button
                    fullWidth
                    onClick={selectTemplate}
                    size="slim"
                    variant="primary"
                    style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ),
          });
        case "html":
        default:
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Special HTML",
                onSelect: isPlusPlan ? () => handleApplyBlockTemplate("html-special") : () => navigate("/app/pricing"),
                badge: "Plus",
                selectLabel: isPlusPlan ? "Select" : "Upgrade to Plus",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/custom-html.png"
                      alt="Special HTML template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Special HTML
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isPlusPlan ? () => handleApplyBlockTemplate("html-special") : () => navigate("/app/pricing")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isPlusPlan ? "Select" : "Upgrade to Plus"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
      }
    };

    return (
      <div
        className={`absolute right-80 top-0 z-40 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-xl transition-none ${showPanel ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
          }`}
        aria-hidden={!showPanel}
        onMouseEnter={() => {
          clearBlockTemplateHoverTimeout();
          setBlockTemplatePanelHover(true);
        }}
        onMouseLeave={() => {
          setBlockTemplatePanelHover(false);
          setBlockTemplateHoverId(null);
        }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <Text as="h2" variant="headingSm">
            {previewTitle}
          </Text>
          <button
            type="button"
            aria-label="Close block preview"
            onClick={() => {
              setBlockTemplateHoverId(null);
              setBlockTemplatePanelHover(false);
            }}
            className="text-xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{renderPreviewForTemplate()}</div>
      </div>
    );
}
