import type { MutableRefObject } from "react";
import { Button, Icon, InlineStack, Text, TextField } from "@shopify/polaris";
import { ArrowLeftIcon, SearchIcon } from "@shopify/polaris-icons";

import { ICON_LIBRARY, ICON_PREFIX } from "../../icons";
import type { BuilderSettings, CustomAddItem, IconPickerState, MenuItem } from "../../types";
import { findItemPath } from "../../utils";

type IconLibraryPanelProps = {
  iconPickerState: IconPickerState | null;
  iconPickerSearch: string;
  setIconPickerSearch: (value: string) => void;
  iconPickerScrollRef: MutableRefObject<HTMLDivElement | null>;
  closeIconPicker: () => void;
  menuItems: MenuItem[];
  customItems: CustomAddItem[];
  findEditableItemById: (id: string) => MenuItem | null;
  resolveSettingsIcon: (id: string) => string | undefined;
  accountIconKeyMap: Record<string, keyof BuilderSettings>;
  updateBuilderSetting: <K extends keyof BuilderSettings>(
    key: K,
    value: BuilderSettings[K]
  ) => void;
  updateCustomItem: (id: string, updates: Partial<CustomAddItem>) => void;
  updateEditDraftItemById: (id: string, updater: (item: MenuItem) => MenuItem) => void;
};

export function IconLibraryPanel({
  iconPickerState,
  iconPickerSearch,
  setIconPickerSearch,
  iconPickerScrollRef,
  closeIconPicker,
  menuItems,
  customItems,
  findEditableItemById,
  resolveSettingsIcon,
  accountIconKeyMap,
  updateBuilderSetting,
  updateCustomItem,
  updateEditDraftItemById,
}: IconLibraryPanelProps) {
  if (!iconPickerState || iconPickerState.mode !== "library") return null;
  const editableItem =
    iconPickerState.target === "custom" ? null : findEditableItemById(iconPickerState.itemId);
  const selectedItemIcon =
    iconPickerState.target === "custom"
      ? customItems.find((entry) => entry.id === iconPickerState.itemId)?.icon
      : iconPickerState.target === "settings"
        ? resolveSettingsIcon(iconPickerState.itemId)
        : editableItem?.icon ?? findItemPath(menuItems, iconPickerState.itemId)?.slice(-1)[0]?.icon;
  const selectedIconId = selectedItemIcon?.startsWith(ICON_PREFIX)
    ? selectedItemIcon.slice(ICON_PREFIX.length)
    : null;
  const filteredIcons = ICON_LIBRARY.filter((option) =>
    option.label.toLowerCase().includes(iconPickerSearch.trim().toLowerCase())
  );

  const applyIconSelection = (iconValue: string) => {
    if (iconPickerState.target === "custom") {
      updateCustomItem(iconPickerState.itemId, { icon: iconValue });
    } else if (iconPickerState.target === "settings") {
      const key = accountIconKeyMap[iconPickerState.itemId];
      if (key) {
        updateBuilderSetting(key, iconValue as never);
      }
    } else {
      updateEditDraftItemById(iconPickerState.itemId, (item) => ({ ...item, icon: iconValue }));
    }
  };

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
            Select icon
          </Text>
        </InlineStack>
      </div>
      <div className="px-4 py-3">
        <TextField
          label="Search"
          labelHidden
          value={iconPickerSearch}
          onChange={setIconPickerSearch}
          autoComplete="off"
          placeholder="Search"
          prefix={<Icon source={SearchIcon} tone="subdued" />}
        />
      </div>
      <div className="flex-1 overflow-auto px-4 pb-4" ref={iconPickerScrollRef}>
        <div className="grid grid-cols-6 gap-2">
          {filteredIcons.map((option) => {
            const isSelected = option.id === selectedIconId;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  applyIconSelection(`${ICON_PREFIX}${option.id}`);
                  closeIconPicker();
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-md border ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <option.Icon size={18} strokeWidth={1.6} className="text-gray-700" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
