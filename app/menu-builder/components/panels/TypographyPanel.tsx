import {
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  Icon,
  InlineStack,
  RangeSlider,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { ArrowLeftIcon, SearchIcon } from "@shopify/polaris-icons";

import { FONT_OPTIONS } from "../../constants";
import type { BuilderSettings, FontPickerState } from "../../types";

type TypographyPanelProps = {
  builderSettings: BuilderSettings;
  updateBuilderSetting: <K extends keyof BuilderSettings>(
    key: K,
    value: BuilderSettings[K]
  ) => void;
  fontPickerState: FontPickerState | null;
  fontPickerSearch: string;
  setFontPickerSearch: (value: string) => void;
  fontPickerFont: string;
  setFontPickerFont: (value: string) => void;
  fontPickerWeight: string;
  setFontPickerWeight: (value: string) => void;
  openFontPickerFor: (
    id: string,
    fontKey: keyof BuilderSettings,
    weightKey: keyof BuilderSettings
  ) => void;
  closeFontPicker: () => void;
};

export function TypographyPanel({
  builderSettings,
  updateBuilderSetting,
  fontPickerState,
  fontPickerSearch,
  setFontPickerSearch,
  fontPickerFont,
  setFontPickerFont,
  fontPickerWeight,
  setFontPickerWeight,
  openFontPickerFor,
  closeFontPicker,
}: TypographyPanelProps) {
  const weightOptions = [
    { label: "Regular", value: "400" },
    { label: "Medium", value: "500" },
    { label: "Semi Bold", value: "600" },
    { label: "Bold", value: "700" },
  ];

  const renderFontPickerPanel = () => {
    if (!fontPickerState) {
      return null;
    }

    const filteredFonts = FONT_OPTIONS.filter((option) =>
      option.label.toLowerCase().includes(fontPickerSearch.trim().toLowerCase())
    );
    const selectedFont =
      FONT_OPTIONS.find((option) => option.value === fontPickerFont) ?? FONT_OPTIONS[0];

    return (
      <div className="flex min-h-full flex-col">
        <div className="border-b border-gray-200 px-4 py-3">
          <InlineStack gap="200" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              onClick={closeFontPicker}
              accessibilityLabel="Back"
            />
            <Text as="h2" variant="headingSm">
              Select font
            </Text>
          </InlineStack>
        </div>
        <div className="px-4 py-3">
          <TextField
            label="Search"
            labelHidden
            value={fontPickerSearch}
            onChange={setFontPickerSearch}
            autoComplete="off"
            placeholder="Search"
            prefix={<Icon source={SearchIcon} tone="subdued" />}
          />
        </div>
        <div className="flex-1 overflow-auto px-3 pb-3">
          <BlockStack gap="100">
            {filteredFonts.map((option) => {
              const isSelected = option.value === fontPickerFont;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFontPickerFont(option.value)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${isSelected ? "bg-gray-100" : "hover:bg-gray-100"
                    }`}
                  style={{ fontFamily: option.value }}
                >
                  {option.label}
                </button>
              );
            })}
          </BlockStack>
        </div>
        <div className="border-t border-gray-200 px-4 py-3">
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" tone="subdued">
              {selectedFont?.label || "Work Sans"}
            </Text>
            <Select
              label="Weight"
              labelHidden
              options={weightOptions}
              value={fontPickerWeight}
              onChange={setFontPickerWeight}
            />
            <InlineStack align="end" gap="200">
              <Button variant="tertiary" onClick={closeFontPicker}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!fontPickerState) return;
                  const nextFont = fontPickerFont || selectedFont?.value || "";
                  updateBuilderSetting(fontPickerState.fontKey, nextFont as never);
                  updateBuilderSetting(fontPickerState.weightKey, Number(fontPickerWeight) as never);
                  closeFontPicker();
                }}
              >
                Select
              </Button>
            </InlineStack>
          </BlockStack>
        </div>
      </div>
    );
  };

  if (fontPickerState) {
    return renderFontPickerPanel();
  }

  const renderTypographySection = (
    id: string,
    title: string,
    useCustomKey: keyof BuilderSettings,
    fontKey: keyof BuilderSettings,
    weightKey: keyof BuilderSettings,
    sizeKey: keyof BuilderSettings
  ) => {
    const fontValue = (builderSettings[fontKey] as string) || "Work Sans, system-ui, sans-serif";
    const weightValue = Number(builderSettings[weightKey] || 400);
    const isCustom = Boolean(builderSettings[useCustomKey]);
    const weightLabel =
      weightOptions.find((option) => Number(option.value) === weightValue)?.label ?? "Regular";
    const fontLabel =
      FONT_OPTIONS.find((option) => option.value === fontValue)?.label ??
      (fontValue ? fontValue.split(",")[0] : "Work Sans");

    const fontCard = (
      <button
        type="button"
        onClick={() => openFontPickerFor(id, fontKey, weightKey)}
        className="w-full overflow-hidden rounded-lg border border-gray-300 bg-white text-left"
      >
        <div className="px-4 py-3">
          <Text as="p" variant="headingMd" fontWeight="medium" style={{ fontFamily: fontValue }}>
            {fontLabel}
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            {weightLabel}
          </Text>
        </div>
        <div className="border-t border-gray-200 px-4 py-2 text-center text-sm text-gray-700">
          Change
        </div>
      </button>
    );

    return (
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        <Checkbox
          label="Use custom font"
          checked={builderSettings[useCustomKey] as boolean}
          onChange={(value) => updateBuilderSetting(useCustomKey, value as never)}
        />
        <Text as="p" variant="bodySm" tone="subdued">
          Font
        </Text>
        {isCustom ? (
          <InlineStack gap="200" blockAlign="center">
            <div style={{ flex: 1 }}>
              <TextField
                label="Font"
                labelHidden
                value={fontLabel}
                readOnly
                autoComplete="off"
                onFocus={() => openFontPickerFor(id, fontKey, weightKey)}
                onClick={() => openFontPickerFor(id, fontKey, weightKey)}
              />
            </div>
            <div style={{ width: 120 }}>
              <Select
                label="Weight"
                labelHidden
                options={weightOptions}
                value={String(builderSettings[weightKey])}
                onChange={(value) => updateBuilderSetting(weightKey, Number(value) as never)}
              />
            </div>
          </InlineStack>
        ) : (
          fontCard
        )}
        <InlineStack gap="200" blockAlign="center">
          <div style={{ flex: 1 }}>
            <RangeSlider
              label="Size"
              value={builderSettings[sizeKey] as number}
              min={10}
              max={24}
              onChange={(value) => updateBuilderSetting(sizeKey, value as never)}
            />
          </div>
          <div style={{ width: 90 }}>
            <TextField
              type="number"
              value={String(builderSettings[sizeKey])}
              onChange={(value) => updateBuilderSetting(sizeKey, Number(value) as never)}
              suffix="px"
              autoComplete="off"
            />
          </div>
        </InlineStack>
      </BlockStack>
    );
  };

  return (
    <Card padding="400">
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Typography settings
        </Text>
        <Divider />
        {renderTypographySection(
          "main",
          "Main menu",
          "typographyMainUseCustom",
          "typographyMainFont",
          "typographyMainWeight",
          "typographyMainSize"
        )}
        <Divider />
        {renderTypographySection(
          "tab",
          "Tab",
          "typographyTabUseCustom",
          "typographyTabFont",
          "typographyTabWeight",
          "typographyTabSize"
        )}
        <Divider />
        {renderTypographySection(
          "subheading",
          "Submenu heading",
          "typographySubheadingUseCustom",
          "typographySubheadingFont",
          "typographySubheadingWeight",
          "typographySubheadingSize"
        )}
        <Divider />
        {renderTypographySection(
          "subtext",
          "Submenu text",
          "typographySubtextUseCustom",
          "typographySubtextFont",
          "typographySubtextWeight",
          "typographySubtextSize"
        )}
        <Divider />
        {renderTypographySection(
          "description",
          "Submenu description",
          "typographyDescriptionUseCustom",
          "typographyDescriptionFont",
          "typographyDescriptionWeight",
          "typographyDescriptionSize"
        )}
      </BlockStack>
    </Card>
  );
}
