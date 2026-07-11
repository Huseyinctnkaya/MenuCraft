import {
  BlockStack,
  Card,
  ColorPicker,
  Divider,
  InlineStack,
  Text,
  TextField,
} from "@shopify/polaris";

import type { BuilderSettings, HsbColor } from "../../types";
import { hexToHsb, hsbToHex, normalizeHexInput } from "../../utils";

type ColorsPanelProps = {
  builderSettings: BuilderSettings;
  updateBuilderSetting: <K extends keyof BuilderSettings>(
    key: K,
    value: BuilderSettings[K]
  ) => void;
  openColorPicker: keyof BuilderSettings | null;
  toggleColorPicker: (key: keyof BuilderSettings) => void;
  colorPickerHsb: HsbColor | null;
  setColorPickerHsb: (color: HsbColor | null) => void;
};

export function ColorsPanel({
  builderSettings,
  updateBuilderSetting,
  openColorPicker,
  toggleColorPicker,
  colorPickerHsb,
  setColorPickerHsb,
}: ColorsPanelProps) {
  const renderColorRow = (label: string, key: keyof BuilderSettings) => {
    const value = builderSettings[key] as string;
    const isOpen = openColorPicker === key;
    const displayColor = isOpen && colorPickerHsb ? hsbToHex(colorPickerHsb) : value;

    return (
      <div className="relative">
        <InlineStack gap="400" blockAlign="center">
          <button
            type="button"
            onClick={() => toggleColorPicker(key)}
            className={`h-10 w-10 rounded-full border-2 shadow-sm ${isOpen ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-300"
              }`}
            style={{ backgroundColor: displayColor }}
            aria-label={label}
          />
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              {label}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {displayColor.toUpperCase()}
            </Text>
          </BlockStack>
        </InlineStack>
        {isOpen && (
          <div
            className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <BlockStack gap="200">
              <ColorPicker
                color={colorPickerHsb ?? hexToHsb(value)}
                onChange={(color) => {
                  setColorPickerHsb({ ...color });
                  updateBuilderSetting(key, hsbToHex(color) as never);
                }}
              />
              <TextField
                label="Hex"
                labelHidden
                value={displayColor}
                onChange={(next) => {
                  const normalized = normalizeHexInput(next);
                  updateBuilderSetting(key, normalized as never);
                  setColorPickerHsb(hexToHsb(normalized));
                }}
                autoComplete="off"
              />
            </BlockStack>
          </div>
        )}
      </div>
    );
  };

  const sections: Array<{ title: string; items: Array<{ label: string; key: keyof BuilderSettings }> }> = [
    {
      title: "Main menu",
      items: [
        { label: "Main menu background", key: "colorMainBackground" },
        { label: "Main menu hover background", key: "colorMainBackgroundHover" },
        { label: "Main menu divider", key: "colorMainDivider" },
        { label: "Main menu text", key: "colorMainText" },
        { label: "Main menu hover text", key: "colorMainTextHover" },
      ],
    },
    {
      title: "Tab menu",
      items: [
        { label: "Tab heading color", key: "colorTabHeading" },
        { label: "Tab active heading color", key: "colorTabHeadingActive" },
        { label: "Tab active background", key: "colorTabBackgroundActive" },
      ],
    },
    {
      title: "Submenu",
      items: [
        { label: "Submenu background", key: "colorSubmenuBackground" },
        { label: "Submenu border", key: "colorSubmenuBorder" },
        { label: "Submenu heading", key: "colorSubmenuHeading" },
        { label: "Submenu text", key: "colorSubmenuText" },
        { label: "Submenu hover text", key: "colorSubmenuTextHover" },
        { label: "Submenu description", key: "colorSubmenuDescription" },
        { label: "Submenu hover description", key: "colorSubmenuDescriptionHover" },
      ],
    },
    {
      title: "Badge",
      items: [
        { label: "Sale badge text", key: "colorBadgeSaleText" },
        { label: "Sale badge background", key: "colorBadgeSaleBackground" },
        { label: "Sold out badge text", key: "colorBadgeSoldOutText" },
        { label: "Sold out badge background", key: "colorBadgeSoldOutBackground" },
        { label: "Default badge text", key: "colorBadgeDefaultText" },
        { label: "Default badge background", key: "colorBadgeDefaultBackground" },
      ],
    },
    {
      title: "Add to cart button",
      items: [
        { label: "Button text", key: "colorButtonText" },
        { label: "Button background", key: "colorButtonBackground" },
        { label: "Button hover background", key: "colorButtonBackgroundHover" },
        { label: "Button hover text", key: "colorButtonTextHover" },
      ],
    },
  ];

  return (
    <Card padding="400">
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Color settings
        </Text>
        <Divider />
        {sections.map((section, index) => (
          <BlockStack key={section.title} gap="300">
            <Text as="h3" variant="headingSm">
              {section.title}
            </Text>
            <BlockStack gap="300">
              {section.items.map((item) => renderColorRow(item.label, item.key))}
            </BlockStack>
            {index < sections.length - 1 ? <Divider /> : null}
          </BlockStack>
        ))}
      </BlockStack>
    </Card>
  );
}
