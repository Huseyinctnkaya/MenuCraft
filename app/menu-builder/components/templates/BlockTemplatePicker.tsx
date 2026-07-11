import { BlockStack, Icon, Text } from "@shopify/polaris";

import { BLOCK_TEMPLATES } from "../../constants";
import type { BlockTemplateId } from "../../types";

type BlockTemplatePickerProps = {
  blockTemplateTargetId: string | null;
  setBlockTemplateTargetId: (id: string | null) => void;
  blockTemplateHoverId: BlockTemplateId | null;
  setBlockTemplateHoverId: (id: BlockTemplateId | null) => void;
  clearBlockTemplateHoverTimeout: () => void;
  scheduleBlockTemplateHover: (templateId: BlockTemplateId) => void;
  scheduleBlockTemplateHoverClear: () => void;
};

export function BlockTemplatePicker({
  blockTemplateTargetId,
  setBlockTemplateTargetId,
  blockTemplateHoverId,
  setBlockTemplateHoverId,
  clearBlockTemplateHoverTimeout,
  scheduleBlockTemplateHover,
  scheduleBlockTemplateHoverClear,
}: BlockTemplatePickerProps) {
  const isOpen = Boolean(blockTemplateTargetId);
  return (
    <div
      className={`absolute right-0 top-0 z-40 flex h-full w-80 min-h-0 flex-col border-l border-gray-200 bg-white shadow-xl transition-none ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <Text as="h2" variant="headingSm">
          Select block
        </Text>
        <button
          type="button"
          aria-label="Close block picker"
          onClick={() => setBlockTemplateTargetId(null)}
          className="text-xl text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3"
        onMouseEnter={() => clearBlockTemplateHoverTimeout()}
        onMouseLeave={() => scheduleBlockTemplateHoverClear()}
      >
        <BlockStack gap="0">
          {BLOCK_TEMPLATES.map((template) => {
            const isHovered = blockTemplateHoverId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  clearBlockTemplateHoverTimeout();
                  setBlockTemplateHoverId(template.id);
                }}
                onMouseEnter={() => {
                  scheduleBlockTemplateHover(template.id);
                }}
                onMouseLeave={() => scheduleBlockTemplateHoverClear()}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 transition-colors ${isHovered ? "bg-gray-100" : "hover:bg-gray-100"
                  }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-50 text-gray-600">
                  <Icon source={template.icon} tone="subdued" />
                </span>
                <span className="font-medium text-gray-800">{template.label}</span>
              </button>
            );
          })}
        </BlockStack>
      </div>
    </div>
  );
}
