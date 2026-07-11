import type { ReactNode } from "react";
import { Badge, BlockStack, Button, Card, Text } from "@shopify/polaris";

export const renderBlockTemplatePreviewCard = ({
  title,
  preview,
  onSelect,
  badge,
  selectLabel = "Select",
  selectDisabled = false,
  showSelectButton = true,
  titleHiddenOnHover = false,
  showTitle = true,
  previewHeightClassName = "h-40",
  previewContainerClassName,
}: {
  title: string;
  preview: ReactNode;
  onSelect: () => void;
  badge?: string;
  selectLabel?: string;
  selectDisabled?: boolean;
  showSelectButton?: boolean;
  titleHiddenOnHover?: boolean;
  showTitle?: boolean;
  previewHeightClassName?: string;
  previewContainerClassName?: string;
}) => (
  <div className="group relative transition-none">
    <Card padding="300" style={{ borderRadius: 0 }} className="rounded-none">
      <BlockStack gap="300">
        <div
          className={`relative overflow-visible ${previewContainerClassName ?? "bg-gray-100 p-3"}`}
        >
          <div className={`${previewHeightClassName} w-full`}>{preview}</div>
          {badge ? (
            <div
              className="absolute right-3 top-3 z-10"
              style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
            >
              <Badge tone="warning">{badge}</Badge>
            </div>
          ) : null}
          {showSelectButton ? (
            <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <Button
                fullWidth
                onClick={selectDisabled ? undefined : onSelect}
                disabled={selectDisabled}
                size="slim"
                variant="primary"
                style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
              >
                {selectLabel}
              </Button>
            </div>
          ) : null}
        </div>
        {showTitle ? (
          <div
            className={`w-full overflow-hidden text-ellipsis whitespace-nowrap ${titleHiddenOnHover ? "transition-none" : ""
              }`}
          >
            <Text
              as="p"
              variant="bodySm"
              alignment="center"
              fontWeight="semibold"
              className="whitespace-nowrap"
            >
              {title}
            </Text>
          </div>
        ) : null}
      </BlockStack>
    </Card>
  </div>
);
