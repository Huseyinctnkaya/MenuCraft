import { Badge, Button, Text } from "@shopify/polaris";
import type { NavigateFunction } from "@remix-run/react";

import { SUBMENU_TEMPLATES } from "../../constants";
import type { BlockTemplateId, SubmenuTemplateId } from "../../types";
import { renderTemplatePreviewCard } from "./TemplatePreviewCard";
import { renderBlockTemplatePreviewCard } from "./BlockTemplatePreviewCard";

type SubmenuTemplatePreviewPanelProps = {
  submenuTemplateTargetId: string | null;
  submenuTemplateHoverId: SubmenuTemplateId | null;
  setSubmenuTemplateHoverId: (id: SubmenuTemplateId | null) => void;
  submenuTemplatePanelHover: boolean;
  setSubmenuTemplatePanelHover: (hover: boolean) => void;
  clearSubmenuTemplateHoverTimeout: () => void;
  handleApplySubmenuTemplate: (templateId: SubmenuTemplateId) => void;
  handleApplyMegaMenuPreset: (templateId: BlockTemplateId) => void;
  isPlusPlan: boolean;
  isProPlan: boolean;
  navigate: NavigateFunction;
};

export function SubmenuTemplatePreviewPanel({
  submenuTemplateTargetId,
  submenuTemplateHoverId,
  setSubmenuTemplateHoverId,
  submenuTemplatePanelHover,
  setSubmenuTemplatePanelHover,
  clearSubmenuTemplateHoverTimeout,
  handleApplySubmenuTemplate,
  handleApplyMegaMenuPreset,
  isPlusPlan,
  isProPlan,
  navigate,
}: SubmenuTemplatePreviewPanelProps) {
    const isOpen = Boolean(submenuTemplateTargetId);
    const activeTemplate = SUBMENU_TEMPLATES.find((template) => template.id === submenuTemplateHoverId);
    const showPanel = isOpen && Boolean(activeTemplate || submenuTemplatePanelHover);
    const previewTitle = activeTemplate?.label ?? "Template preview";

    const renderPreviewForTemplate = () => {
      if (!activeTemplate) return null;
      const selectTemplate = () => handleApplySubmenuTemplate(activeTemplate.id);
      switch (activeTemplate.id) {
        case "dropdown":
          return (
            <div className="flex flex-col gap-0">
              {renderTemplatePreviewCard({
                title: "Vertical Dropdown",
                onSelect: () => handleApplySubmenuTemplate("dropdown"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/vertical-dropdown.png"
                      alt="Vertical Dropdown template"
                      className="h-full w-full object-contain pb-6"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Vertical Dropdown
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplySubmenuTemplate("dropdown")}
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
              {renderTemplatePreviewCard({
                title: "Horizontal Dropdown",
                onSelect: () => handleApplySubmenuTemplate("horizontal-dropdown"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/horizantal-dropdown.png"
                      alt="Horizontal Dropdown template"
                      className="h-full w-full object-contain pb-6"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Horizontal Dropdown
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplySubmenuTemplate("horizontal-dropdown")}
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
              {renderTemplatePreviewCard({
                title: "Simple Left Tabs",
                onSelect: () => handleApplySubmenuTemplate("simple-left-tabs"),
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                showSelectButton: false,
                showTitle: false,
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/simple-left-tabs.png"
                      alt="Simple Left Tabs template"
                      className="h-full w-full object-contain"
                    />
                    <div
                      className="absolute right-3 top-3 z-10"
                      style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
                    >
                      <Badge tone="warning">Plus</Badge>
                    </div>
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Simple Left Tabs
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isPlusPlan ? () => handleApplySubmenuTemplate("simple-left-tabs") : () => navigate("/app/pricing")}
                        disabled={false}
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
              {renderTemplatePreviewCard({
                title: "Simple Top Tabs",
                onSelect: () => handleApplySubmenuTemplate("simple-top-tabs"),
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                showSelectButton: false,
                showTitle: false,
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/simple-top-tabs.png"
                      alt="Simple Top Tabs template"
                      className="h-full w-full object-contain"
                    />
                    <div
                      className="absolute right-3 top-3 z-10"
                      style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
                    >
                      <Badge tone="warning">Plus</Badge>
                    </div>
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Simple Top Tabs
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isPlusPlan ? () => handleApplySubmenuTemplate("simple-top-tabs") : () => navigate("/app/pricing")}
                        disabled={false}
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
              {renderTemplatePreviewCard({
                title: "Two Top Tabs",
                onSelect: () => handleApplySubmenuTemplate("two-top-tabs"),
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                showSelectButton: false,
                showTitle: false,
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/two-top-tabs.png"
                      alt="Two Top Tabs template"
                      className="h-full w-full object-contain"
                    />
                    <div
                      className="absolute right-3 top-3 z-10"
                      style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
                    >
                      <Badge tone="warning">Plus</Badge>
                    </div>
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Two Top Tabs
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isPlusPlan ? () => handleApplySubmenuTemplate("two-top-tabs") : () => navigate("/app/pricing")}
                        disabled={false}
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
              {renderTemplatePreviewCard({
                title: "Three Top Tabs",
                onSelect: () => handleApplySubmenuTemplate("three-top-tabs"),
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                showSelectButton: false,
                showTitle: false,
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/three-top-tabs.png"
                      alt="Three Top Tabs template"
                      className="h-full w-full object-contain"
                    />
                    <div
                      className="absolute right-3 top-3 z-10"
                      style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
                    >
                      <Badge tone="warning">Plus</Badge>
                    </div>
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Three Top Tabs
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isPlusPlan ? () => handleApplySubmenuTemplate("three-top-tabs") : () => navigate("/app/pricing")}
                        disabled={false}
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
              {renderTemplatePreviewCard({
                title: "Two Level Tabs",
                onSelect: () => handleApplySubmenuTemplate("two-level-tabs"),
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                showSelectButton: false,
                showTitle: false,
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/two-level-tabs.png"
                      alt="Two Level Tabs template"
                      className="h-full w-full object-contain"
                    />
                    <div
                      className="absolute right-3 top-3 z-10"
                      style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
                    >
                      <Badge tone="warning">Plus</Badge>
                    </div>
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Two Level Tabs
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isPlusPlan ? () => handleApplySubmenuTemplate("two-level-tabs") : () => navigate("/app/pricing")}
                        disabled={false}
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
              {renderTemplatePreviewCard({
                title: "Three Level Tabs",
                onSelect: () => handleApplySubmenuTemplate("three-level-tabs"),
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                showSelectButton: false,
                showTitle: false,
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/three-level-tabs.png"
                      alt="Three Level Tabs template"
                      className="h-full w-full object-contain"
                    />
                    <div
                      className="absolute right-3 top-3 z-10"
                      style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
                    >
                      <Badge tone="warning">Plus</Badge>
                    </div>
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Three Level Tabs
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isPlusPlan ? () => handleApplySubmenuTemplate("three-level-tabs") : () => navigate("/app/pricing")}
                        disabled={false}
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
        case "mega":
          return (
            <div className="flex flex-col gap-0">
              {renderTemplatePreviewCard({
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
              })}
              <div className="flex flex-col gap-0">
                {(
                  [
                    {
                      id: "multi-4-product-list",
                      label: "4 product list",
                      image: "/4-product-list.png",
                      plan: "pro",
                    },
                    { id: "multi", label: "4 link list", image: "/link-list-multiblock.png" },
                    {
                      id: "multi-1-column-3-product-list",
                      label: "1 link list + 3 product list",
                      image: "/1link-list+3product-columns.png",
                      plan: "pro",
                    },
                    { id: "multi-3-photo", label: "3 link list + 1 image", image: "/3columns+1photo.png" },
                    {
                      id: "multi-product-carousel",
                      label: "Product carousel",
                      image: "/product-carousel.png",
                      plan: "pro",
                    },
                    { id: "multi-2-photos", label: "2 link + 2 image", image: "/2columns+2photos.png" },
                    {
                      id: "multi-link-list-product-carousel",
                      label: "1 link list + product carousel",
                      image: "/1link-list+product-carousel.png",
                      plan: "pro",
                    },
                    { id: "multi-1-3-photos", label: "1 link + 3 image", image: "/1column%20+%203photos.png" },
                    {
                      id: "multi-image-product-carousel",
                      label: "Image + product carousel",
                      image: "/image+product-carousel.png",
                      plan: "pro",
                    },
                    { id: "multi-4-images", label: "4 images", image: "/4images.png" },
                    { id: "multi-4-products", label: "4 product", image: "/4products.png" },
                    {
                      id: "multi-map-contact-address",
                      label: "Map + contact + address",
                      image: "/map-contact-adres.png",
                    },
                  ] as Array<{
                    id: BlockTemplateId;
                    label: string;
                    image: string;
                    plan?: "pro" | "plus";
                  }>
                ).map((preset) => {
                  const requiredPlan = preset.plan;
                  const isAllowed =
                    preset.plan === "pro"
                      ? isProPlan
                      : preset.plan === "plus"
                        ? isPlusPlan
                        : true;
                  return renderBlockTemplatePreviewCard({
                    title: preset.label,
                    onSelect: isAllowed ? () => handleApplyMegaMenuPreset(preset.id) : () => navigate("/app/pricing"),
                    badge: preset.plan ? (preset.plan === "plus" ? "Plus" : "Pro") : undefined,
                    selectLabel: isAllowed ? "Select" : (requiredPlan === "plus" ? "Upgrade to Plus" : "Upgrade to Pro"),
                    selectDisabled: false,
                    showTitle: false,
                    previewHeightClassName: "h-44",
                    previewContainerClassName: "bg-transparent p-0",
                    preview: (
                      <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                        <img
                          src={preset.image}
                          alt={`${preset.label} template`}
                          className="h-full w-full object-contain"
                        />
                        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                          {preset.label}
                        </div>
                      </div>
                    ),
                  });
                })}
              </div>
            </div>
          );
        case "custom":
          return renderTemplatePreviewCard({
            title: "Custom menu",
            onSelect: () => isPlusPlan ? handleApplySubmenuTemplate("custom-normal-dropdown") : undefined,
            previewHeightClassName: "h-44",
            previewContainerClassName: "bg-transparent p-0",
            showSelectButton: false,
            showTitle: false,
            preview: (
              <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                <img
                  src="/custom menu image.png"
                  alt="Custom menu template"
                  className="h-full w-full object-contain"
                />
                <div
                  className="absolute right-3 top-3 z-10"
                  style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
                >
                  <Badge tone="warning">Plus</Badge>
                </div>
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                  Custom menu
                </div>
                <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <Button
                    fullWidth
                    onClick={isPlusPlan ? () => handleApplySubmenuTemplate("custom-normal-dropdown") : () => navigate("/app/pricing")}
                    disabled={false}
                    size="slim"
                    variant="primary"
                    style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                  >
                    {isPlusPlan ? "Select" : "Upgrade to Plus"}
                  </Button>
                </div>
              </div>
            ),
          });
        default:
          return renderTemplatePreviewCard({
            title: "Custom menu",
            onSelect: selectTemplate,
            preview: (
              <div className="h-28 rounded-lg bg-[#a7b2c0] p-2">
                <div className="h-6 rounded-md bg-white/80" />
                <div className="mt-2 h-4 w-2/3 rounded-md bg-white/70" />
                <div className="mt-2 h-4 w-1/2 rounded-md bg-white/70" />
              </div>
            ),
          });
      }
    };

    return (
      <div
        className={`absolute right-80 top-0 z-40 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-xl transition-none ${showPanel ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
          }`}
        aria-hidden={!showPanel}
        onMouseEnter={() => {
          clearSubmenuTemplateHoverTimeout();
          setSubmenuTemplatePanelHover(true);
        }}
        onMouseLeave={() => {
          setSubmenuTemplatePanelHover(false);
          setSubmenuTemplateHoverId(null);
        }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <Text as="h2" variant="headingSm">
            {previewTitle}
          </Text>
          <button
            type="button"
            aria-label="Close template preview"
            onClick={() => {
              setSubmenuTemplateHoverId(null);
              setSubmenuTemplatePanelHover(false);
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
