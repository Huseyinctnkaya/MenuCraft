import { Button, DropZone, InlineStack, Text } from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";

import type { BuilderSettings, MenuItem } from "../../types";

type SubmenuImagePickerPanelProps = {
  submenuImagePickerOpen: boolean;
  setSubmenuImagePickerOpen: (open: boolean) => void;
  editDraft: MenuItem | null;
  selectedItem: MenuItem | null;
  builderSettings: BuilderSettings;
  menuView: "list" | "edit" | "add-root";
  handleSubmenuBackgroundUpload: (file?: File | null) => void;
  updateEditDraft: <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => void;
  handleUpdateSelected: <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => void;
};

export function SubmenuImagePickerPanel({
  submenuImagePickerOpen,
  setSubmenuImagePickerOpen,
  editDraft,
  selectedItem,
  builderSettings,
  menuView,
  handleSubmenuBackgroundUpload,
  updateEditDraft,
  handleUpdateSelected,
}: SubmenuImagePickerPanelProps) {
  const editingItem = editDraft ?? selectedItem;
  if (!submenuImagePickerOpen) return null;
  return (
    <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <InlineStack gap="200" blockAlign="center">
          <Button
            variant="tertiary"
            icon={ArrowLeftIcon}
            onClick={() => setSubmenuImagePickerOpen(false)}
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
            handleSubmenuBackgroundUpload(files?.[0]);
            setSubmenuImagePickerOpen(false);
          }}
        >
          <DropZone.FileUpload actionTitle="Add image" actionHint="Drag and drop your image" />
        </DropZone>
        {builderSettings.imageLibrary && builderSettings.imageLibrary.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {builderSettings.imageLibrary.map((image) => {
              const isSelected = editingItem?.submenuBackgroundImage === image;
              return (
                <button
                  key={image}
                  type="button"
                  onClick={() => {
                    if (menuView === "edit") {
                      updateEditDraft("submenuBackgroundImage", image);
                    } else {
                      handleUpdateSelected("submenuBackgroundImage", image);
                    }
                    setSubmenuImagePickerOpen(false);
                  }}
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
    </div>
  );
}
