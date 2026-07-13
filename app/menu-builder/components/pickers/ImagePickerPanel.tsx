import type { Dispatch, SetStateAction } from "react";
import { Button, DropZone, InlineStack, Text } from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";

import type { BuilderSettings, MenuItem } from "../../types";

type ImagePickerPanelProps = {
  imagePickerOpen: boolean;
  setImagePickerOpen: (open: boolean) => void;
  imagePickerSelection: string | null;
  setImagePickerSelection: (value: string | null) => void;
  builderSettings: BuilderSettings;
  setBuilderSettings: Dispatch<SetStateAction<BuilderSettings>>;
  currentImageUrl: string | null;
  handleImageUpload: (file?: File | null) => void;
  updateEditDraft: <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => void;
};

export function ImagePickerPanel({
  imagePickerOpen,
  setImagePickerOpen,
  imagePickerSelection,
  setImagePickerSelection,
  builderSettings,
  setBuilderSettings,
  currentImageUrl,
  handleImageUpload,
  updateEditDraft,
}: ImagePickerPanelProps) {
  if (!imagePickerOpen) return null;
  const imageLibrary = builderSettings.imageLibrary ?? [];
  const hasSelection = Boolean(imagePickerSelection);
  return (
    <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <InlineStack gap="200" blockAlign="center">
          <Button
            variant="tertiary"
            icon={ArrowLeftIcon}
            onClick={() => setImagePickerOpen(false)}
            accessibilityLabel="Back"
          />
          <Text as="h2" variant="headingSm">
            Images
          </Text>
        </InlineStack>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <DropZone
          accept="image/*"
          allowMultiple={false}
          onDrop={(files) => {
            handleImageUpload(files?.[0]);
          }}
        >
          <DropZone.FileUpload actionTitle="Add image" actionHint="Drag and drop your image" />
        </DropZone>
        {imageLibrary.length === 0 ? (
          <Text as="p" variant="bodySm" tone="subdued" alignment="center" className="mt-4">
            No images uploaded yet.
          </Text>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {imageLibrary.map((image) => {
              const isSelected = imagePickerSelection === image;
              return (
                <button
                  key={image}
                  type="button"
                  onClick={() => setImagePickerSelection(image)}
                  className={`relative overflow-hidden rounded-lg border p-1 text-left transition ${isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"
                    } bg-white shadow-sm group`}
                >
                  {isSelected && (
                    <div className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded bg-gray-900 text-white shadow-sm">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-auto border-t border-gray-200 bg-white px-4 py-3">
        <InlineStack gap="200" align="end">
          <Button
            variant="tertiary"
            disabled={!hasSelection}
            onClick={() => {
              if (!imagePickerSelection) return;
              const nextSelection = imagePickerSelection;
              setBuilderSettings((prev) => ({
                ...prev,
                imageLibrary: (prev.imageLibrary ?? []).filter((image) => image !== nextSelection),
              }));
              if (currentImageUrl === nextSelection) {
                updateEditDraft("imageUrl", "");
              }
              setImagePickerSelection(null);
            }}
          >
            Delete
          </Button>
          <Button
            variant="primary"
            disabled={!hasSelection}
            onClick={() => {
              if (!imagePickerSelection) return;
              updateEditDraft("imageUrl", imagePickerSelection);
              setImagePickerOpen(false);
            }}
          >
            Select
          </Button>
        </InlineStack>
      </div>
    </div>
  );
}
