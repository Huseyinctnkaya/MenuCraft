import { Button, DropZone, InlineStack, Text } from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";

import type { IconPickerState } from "../../types";

type IconUploadPanelProps = {
  iconPickerState: IconPickerState | null;
  closeIconPicker: () => void;
  handleIconUploadFile: (
    itemId: string,
    file: File | null | undefined,
    target: IconPickerState["target"]
  ) => void;
};

export function IconUploadPanel({
  iconPickerState,
  closeIconPicker,
  handleIconUploadFile,
}: IconUploadPanelProps) {
  if (!iconPickerState || iconPickerState.mode !== "upload") return null;

  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="border-b border-gray-200 px-4 py-3">
        <InlineStack gap="200" blockAlign="center">
          <Button
            variant="tertiary"
            icon={ArrowLeftIcon}
            onClick={closeIconPicker}
            accessibilityLabel="Back"
          />
          <Text as="h2" variant="headingSm">
            Images
          </Text>
        </InlineStack>
      </div>
      <div className="flex-1 px-4 py-4">
        <DropZone
          allowMultiple={false}
          accept="image/*"
          onDrop={(_files, acceptedFiles) => {
            const file = acceptedFiles[0] ?? null;
            handleIconUploadFile(iconPickerState.itemId, file, iconPickerState.target);
          }}
        >
          <DropZone.FileUpload actionTitle="Add image" actionHint="Drag and drop your image" />
        </DropZone>
      </div>
    </div>
  );
}
