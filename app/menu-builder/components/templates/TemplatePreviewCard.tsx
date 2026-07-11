import type { ReactNode } from "react";
import { BlockStack, Button, Card, Text } from "@shopify/polaris";

export const renderTemplatePreviewCard = ({
  title,
  preview,
  onSelect,
  showSelectButton = true,
  titleHiddenOnHover = false,
  showTitle = true,
  previewHeightClassName = "h-36",
  previewContainerClassName,
}: {
  title: string;
  preview: ReactNode;
  onSelect: () => void;
  showSelectButton?: boolean;
  titleHiddenOnHover?: boolean;
  showTitle?: boolean;
  previewHeightClassName?: string;
  previewContainerClassName?: string;
}) => (
  <div className="group relative transition-none">
    <Card padding="300">
      <BlockStack gap="300">
        <div
          className={
            previewContainerClassName ?? "relative rounded-xl bg-gray-100 p-3"
          }
        >
          <div className={`${previewHeightClassName} w-full`}>{preview}</div>
          {showSelectButton ? (
            <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <Button
                fullWidth
                onClick={onSelect}
                size="slim"
                variant="primary"
                style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
              >
                Select
              </Button>
            </div>
          ) : null}
        </div>
        {showTitle ? (
          <div
            className={
              titleHiddenOnHover ? "transition-none" : undefined
            }
          >
            <Text as="p" variant="bodySm" alignment="center" fontWeight="semibold">
              {title}
            </Text>
          </div>
        ) : null}
      </BlockStack>
    </Card>
  </div>
);
