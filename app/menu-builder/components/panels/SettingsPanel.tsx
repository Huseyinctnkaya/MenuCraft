import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  ActionList,
  BlockStack,
  Button,
  Card,
  Checkbox,
  ChoiceList,
  Divider,
  Icon,
  InlineStack,
  Link,
  Popover,
  RangeSlider,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  ArrowsOutHorizontalIcon,
  DeleteIcon,
  ImageIcon,
  UploadIcon,
} from "@shopify/polaris-icons";

import type { BuilderSettings, IconPickerState } from "../../types";
import { renderSegmentedControl } from "../shared/SegmentedControl";

type SettingsPanelProps = {
  builderSettings: BuilderSettings;
  updateBuilderSetting: <K extends keyof BuilderSettings>(
    key: K,
    value: BuilderSettings[K]
  ) => void;
  menus: Array<{ id: string; title: string; handle?: string | null }>;
  accountIconMenuOpenId: string | null;
  setAccountIconMenuOpenId: Dispatch<SetStateAction<string | null>>;
  iconPickerState: IconPickerState | null;
  openIconPicker: (
    target: IconPickerState["target"],
    itemId: string,
    mode: IconPickerState["mode"]
  ) => void;
  resolveCustomIconPreview: (icon?: string) => ReactNode;
  renderIconLibraryPanel: () => ReactNode;
  renderIconUploadPanel: () => ReactNode;
};

export function SettingsPanel({
  builderSettings,
  updateBuilderSetting,
  menus,
  accountIconMenuOpenId,
  setAccountIconMenuOpenId,
  iconPickerState,
  openIconPicker,
  resolveCustomIconPreview,
  renderIconLibraryPanel,
  renderIconUploadPanel,
}: SettingsPanelProps) {
    if (iconPickerState?.target === "settings") {
      return (
        <Card padding="0">
          {iconPickerState.mode === "library" ? renderIconLibraryPanel() : renderIconUploadPanel()}
        </Card>
      );
    }
    const toNumber = (value: string) => {
      const next = Number(value);
      return Number.isFinite(next) ? next : 0;
    };

    const renderSpacingControl = (
      label: string,
      value: number,
      onChange: (next: number) => void,
      min: number,
      max: number
    ) => (
      <InlineStack gap="200" blockAlign="center">
        <div style={{ flex: 1 }}>
          <RangeSlider
            label={label}
            value={value}
            min={min}
            max={max}
            onChange={onChange}
          />
        </div>
        <div style={{ width: 90 }}>
          <TextField
            type="number"
            value={String(value)}
            onChange={(next) => onChange(toNumber(next))}
            suffix="px"
            autoComplete="off"
          />
        </div>
      </InlineStack>
    );
    const renderAccountIconWidthControls = (
      modeKey: keyof BuilderSettings,
      valueKey: keyof BuilderSettings,
      unitKey: keyof BuilderSettings
    ) => {
      const mode = (builderSettings[modeKey] as string) || "auto";
      return (
        <BlockStack gap="200">
          <Select
            label="Icon width"
            options={[
              { label: "Automatic", value: "auto" },
              { label: "Custom", value: "custom" },
            ]}
            value={mode}
            onChange={(value) => updateBuilderSetting(modeKey, value as never)}
          />
          {mode === "custom" ? (
            <InlineStack gap="200" blockAlign="center">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Width"
                  type="number"
                  value={String(builderSettings[valueKey] ?? 50)}
                  onChange={(value) => {
                    const next = Number(value);
                    if (!Number.isFinite(next)) return;
                    updateBuilderSetting(valueKey, Math.max(1, next) as never);
                  }}
                  autoComplete="off"
                />
              </div>
              <div style={{ width: 110 }}>
                <Select
                  label="Unit"
                  options={[
                    { label: "%", value: "%" },
                    { label: "px", value: "px" },
                  ]}
                  value={(builderSettings[unitKey] as string) || "%"}
                  onChange={(value) => updateBuilderSetting(unitKey, value as never)}
                />
              </div>
            </InlineStack>
          ) : null}
        </BlockStack>
      );
    };

    return (
      <Card padding="400">
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            General settings
          </Text>
          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Location
            </Text>
            <ChoiceList
              choices={[
                { label: "Automatic", value: "auto" },
                { label: "Replace navigation", value: "replaceNavigation" },
              ]}
              selected={[builderSettings.layoutLocation]}
              onChange={(value) =>
                updateBuilderSetting("layoutLocation", value[0] as BuilderSettings["layoutLocation"])
              }
            />
            {builderSettings.layoutLocation === "replaceNavigation" ? (
              <BlockStack gap="300">
                <Select
                  label="Select your main menu"
                  options={
                    menus.length
                      ? menus.map((menuOption) => ({
                        label: menuOption.title,
                        value: menuOption.id,
                      }))
                      : [{ label: "No menus found", value: "" }]
                  }
                  value={builderSettings.layoutReplaceDesktopMenuId}
                  onChange={(value) => updateBuilderSetting("layoutReplaceDesktopMenuId", value)}
                />
                <Select
                  label="Select your mobile menu"
                  options={
                    menus.length
                      ? menus.map((menuOption) => ({
                        label: menuOption.title,
                        value: menuOption.id,
                      }))
                      : [{ label: "No menus found", value: "" }]
                  }
                  value={builderSettings.layoutReplaceMobileMenuId}
                  onChange={(value) => updateBuilderSetting("layoutReplaceMobileMenuId", value)}
                />
              </BlockStack>
            ) : null}
            <ChoiceList
              choices={[
                {
                  label: "Show menu in this CSS selector",
                  value: "cssSelector",
                  helpText: (
                    <Text as="span" variant="bodyMd" tone="subdued">
                      Use this option only if you're a developer or the options above don't work.
                    </Text>
                  ),
                },
              ]}
              selected={[builderSettings.layoutLocation]}
              onChange={(value) =>
                updateBuilderSetting("layoutLocation", value[0] as BuilderSettings["layoutLocation"])
              }
            />
            {builderSettings.layoutLocation === "cssSelector" ? (
              <BlockStack gap="300">
                <TextField
                  label="CSS Selector for your main menu"
                  value={builderSettings.layoutCssSelectorDesktop}
                  onChange={(value) => updateBuilderSetting("layoutCssSelectorDesktop", value)}
                  autoComplete="off"
                  placeholder="#SiteNav"
                />
                <TextField
                  label="CSS Selector for your mobile menus"
                  value={builderSettings.layoutCssSelectorMobile}
                  onChange={(value) => updateBuilderSetting("layoutCssSelectorMobile", value)}
                  autoComplete="off"
                  placeholder="#AccessibleNav"
                />
                <div>
                  <Link url="#" target="_blank">
                    How to find your menu's CSS selector?
                  </Link>
                </div>
              </BlockStack>
            ) : null}
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Layout
            </Text>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Orientation
              </Text>
              {renderSegmentedControl(
                [
                  { label: "Horizontal", value: "horizontal" },
                  { label: "Vertical", value: "vertical" },
                ],
                builderSettings.layoutOrientation,
                (next) =>
                  updateBuilderSetting(
                    "layoutOrientation",
                    next as BuilderSettings["layoutOrientation"]
                  )
              )}
            </BlockStack>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Alignment
              </Text>
              {renderSegmentedControl(
                [
                  { label: "Left", value: "left" },
                  { label: "Right", value: "right" },
                  { label: "Center", value: "center" },
                ],
                builderSettings.layoutAlignment,
                (next) =>
                  updateBuilderSetting(
                    "layoutAlignment",
                    next as BuilderSettings["layoutAlignment"]
                  )
              )}
            </BlockStack>
            <TextField
              label="Menu max width"
              value={builderSettings.layoutMaxWidth}
              onChange={(value) => updateBuilderSetting("layoutMaxWidth", value)}
              prefix={<Icon source={ArrowsOutHorizontalIcon} tone="subdued" />}
              suffix="px"
              autoComplete="off"
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Animation
            </Text>
            <Select
              label="Trigger - Desktop"
              options={[
                { label: "Hover", value: "hover" },
                { label: "Click", value: "click" },
              ]}
              value={builderSettings.animationDesktopTrigger}
              onChange={(value) =>
                updateBuilderSetting(
                  "animationDesktopTrigger",
                  value as BuilderSettings["animationDesktopTrigger"]
                )
              }
            />
            <Select
              label="Trigger - Mobile"
              options={[
                { label: "Click toggle button", value: "toggle" },
                { label: "Tap", value: "tap" },
              ]}
              value={builderSettings.animationMobileTrigger}
              onChange={(value) =>
                updateBuilderSetting(
                  "animationMobileTrigger",
                  value as BuilderSettings["animationMobileTrigger"]
                )
              }
            />
            <Select
              label="Effect"
              options={[
                { label: "Fade", value: "fade" },
                { label: "Slide", value: "slide" },
                { label: "Scale", value: "scale" },
              ]}
              value={builderSettings.animationEffect}
              onChange={(value) =>
                updateBuilderSetting(
                  "animationEffect",
                  value as BuilderSettings["animationEffect"]
                )
              }
            />
            <InlineStack gap="200" blockAlign="center">
              <TextField
                label="Transition duration"
                type="number"
                value={String(builderSettings.animationDuration)}
                onChange={(value) =>
                  updateBuilderSetting("animationDuration", toNumber(value))
                }
                suffix="ms"
                autoComplete="off"
              />
              <TextField
                label="Transition delay"
                type="number"
                value={String(builderSettings.animationDelay)}
                onChange={(value) =>
                  updateBuilderSetting("animationDelay", toNumber(value))
                }
                suffix="ms"
                autoComplete="off"
              />
            </InlineStack>
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Spacing
            </Text>
            {renderSpacingControl(
              "Main menu padding",
              builderSettings.spacingMainPadding,
              (value) => updateBuilderSetting("spacingMainPadding", value),
              0,
              60
            )}
            {renderSpacingControl(
              "Main menu row height",
              builderSettings.spacingMainRowHeight,
              (value) => updateBuilderSetting("spacingMainRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Dropdown row height",
              builderSettings.spacingDropdownRowHeight,
              (value) => updateBuilderSetting("spacingDropdownRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Tab row height",
              builderSettings.spacingTabRowHeight,
              (value) => updateBuilderSetting("spacingTabRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Link list row height",
              builderSettings.spacingLinkListRowHeight,
              (value) => updateBuilderSetting("spacingLinkListRowHeight", value),
              20,
              60
            )}
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Carousel
            </Text>
            <Checkbox
              label="Autoplay"
              checked={builderSettings.carouselAutoPlay}
              onChange={(value) => updateBuilderSetting("carouselAutoPlay", value)}
            />
            <Checkbox
              label="Infinite loop"
              checked={builderSettings.carouselLoop}
              onChange={(value) => updateBuilderSetting("carouselLoop", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Advanced
            </Text>
            <TextField
              label="Mobile menu when width is below"
              type="number"
              value={String(builderSettings.advancedMobileBreakpoint)}
              onChange={(value) =>
                updateBuilderSetting("advancedMobileBreakpoint", toNumber(value))
              }
              suffix="px"
              autoComplete="off"
            />
            <Checkbox
              label="Hide link list submenus"
              checked={builderSettings.advancedHideLinkListSubmenu}
              onChange={(value) => updateBuilderSetting("advancedHideLinkListSubmenu", value)}
            />
            <Checkbox
              label="Show Add to cart button"
              checked={builderSettings.advancedShowAddToCart}
              onChange={(value) => updateBuilderSetting("advancedShowAddToCart", value)}
            />
            <Checkbox
              label="Enable lazy loading placeholder"
              checked={builderSettings.advancedEnableLazyLoading}
              onChange={(value) => updateBuilderSetting("advancedEnableLazyLoading", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Elements
            </Text>
            <Checkbox
              label="Show search bar"
              checked={builderSettings.elementsShowSearch}
              onChange={(value) => updateBuilderSetting("elementsShowSearch", value)}
            />
            <Checkbox
              label="Show divider on desktop"
              checked={builderSettings.elementsShowDesktopDivider}
              onChange={(value) => updateBuilderSetting("elementsShowDesktopDivider", value)}
            />
            <Checkbox
              label="Show divider on mobile"
              checked={builderSettings.elementsShowMobileDivider}
              onChange={(value) => updateBuilderSetting("elementsShowMobileDivider", value)}
            />
            <Checkbox
              label="Show indicators (down arrow)"
              checked={builderSettings.elementsShowIndicators}
              onChange={(value) => updateBuilderSetting("elementsShowIndicators", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Account links
            </Text>
            <Checkbox
              label="Show login link"
              checked={builderSettings.accountShowLogin}
              helpText="When logged out"
              onChange={(value) => updateBuilderSetting("accountShowLogin", value)}
            />
            {builderSettings.accountShowLogin ? (
              <BlockStack gap="200">
                <div className="flex flex-col gap-0">
                  <Text as="h4" variant="headingSm">
                    Icon
                  </Text>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center w-full">
                    <div className="flex flex-col items-center gap-2">
                      {builderSettings.accountLoginIcon ? (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white shadow-sm">
                            {resolveCustomIconPreview(builderSettings.accountLoginIcon)}
                          </div>
                          <Popover
                            active={accountIconMenuOpenId === "account-login"}
                            onClose={() => setAccountIconMenuOpenId(null)}
                            activator={
                              <Button
                                variant="secondary"
                                disclosure
                                onClick={() =>
                                  setAccountIconMenuOpenId((prev) =>
                                    prev === "account-login" ? null : "account-login"
                                  )
                                }
                              >
                                Change
                              </Button>
                            }
                          >
                            <ActionList
                              items={[
                                {
                                  content: "Select icon",
                                  icon: ImageIcon,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    openIconPicker("settings", "account-login", "library");
                                  },
                                },
                                {
                                  content: "Upload icon",
                                  icon: UploadIcon,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    openIconPicker("settings", "account-login", "upload");
                                  },
                                },
                                {
                                  content: "Remove",
                                  icon: DeleteIcon,
                                  destructive: true,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    updateBuilderSetting("accountLoginIcon", "");
                                  },
                                },
                              ]}
                            />
                          </Popover>
                        </>
                      ) : (
                        <InlineStack align="center" blockAlign="center" gap="200" wrap={false}>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => openIconPicker("settings", "account-login", "library")}
                          >
                            Select icon
                          </button>
                          <Text as="span" variant="bodySm" tone="subdued">
                            or
                          </Text>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => openIconPicker("settings", "account-login", "upload")}
                          >
                            Upload icon
                          </button>
                        </InlineStack>
                      )}
                    </div>
                  </div>
                </div>
                {renderAccountIconWidthControls(
                  "accountLoginIconWidthMode",
                  "accountLoginIconWidthValue",
                  "accountLoginIconWidthUnit"
                )}
                <TextField
                  label="Login icon and title"
                  value={builderSettings.accountLoginLabel}
                  onChange={(value) => updateBuilderSetting("accountLoginLabel", value)}
                  autoComplete="off"
                />
              </BlockStack>
            ) : null}
            <Checkbox
              label="Show register link"
              checked={builderSettings.accountShowRegister}
              helpText="When logged out"
              onChange={(value) => updateBuilderSetting("accountShowRegister", value)}
            />
            {builderSettings.accountShowRegister ? (
              <BlockStack gap="200">
                <div className="flex flex-col gap-0">
                  <Text as="h4" variant="headingSm">
                    Icon
                  </Text>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center w-full">
                    <div className="flex flex-col items-center gap-2">
                      {builderSettings.accountRegisterIcon ? (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white shadow-sm">
                            {resolveCustomIconPreview(builderSettings.accountRegisterIcon)}
                          </div>
                          <Popover
                            active={accountIconMenuOpenId === "account-register"}
                            onClose={() => setAccountIconMenuOpenId(null)}
                            activator={
                              <Button
                                variant="secondary"
                                disclosure
                                onClick={() =>
                                  setAccountIconMenuOpenId((prev) =>
                                    prev === "account-register" ? null : "account-register"
                                  )
                                }
                              >
                                Change
                              </Button>
                            }
                          >
                            <ActionList
                              items={[
                                {
                                  content: "Select icon",
                                  icon: ImageIcon,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    openIconPicker("settings", "account-register", "library");
                                  },
                                },
                                {
                                  content: "Upload icon",
                                  icon: UploadIcon,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    openIconPicker("settings", "account-register", "upload");
                                  },
                                },
                                {
                                  content: "Remove",
                                  icon: DeleteIcon,
                                  destructive: true,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    updateBuilderSetting("accountRegisterIcon", "");
                                  },
                                },
                              ]}
                            />
                          </Popover>
                        </>
                      ) : (
                        <InlineStack align="center" blockAlign="center" gap="200" wrap={false}>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => openIconPicker("settings", "account-register", "library")}
                          >
                            Select icon
                          </button>
                          <Text as="span" variant="bodySm" tone="subdued">
                            or
                          </Text>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => openIconPicker("settings", "account-register", "upload")}
                          >
                            Upload icon
                          </button>
                        </InlineStack>
                      )}
                    </div>
                  </div>
                </div>
                {renderAccountIconWidthControls(
                  "accountRegisterIconWidthMode",
                  "accountRegisterIconWidthValue",
                  "accountRegisterIconWidthUnit"
                )}
                <TextField
                  label="Register icon and title"
                  value={builderSettings.accountRegisterLabel}
                  onChange={(value) => updateBuilderSetting("accountRegisterLabel", value)}
                  autoComplete="off"
                />
              </BlockStack>
            ) : null}
            <Checkbox
              label="Show account link"
              checked={builderSettings.accountShowAccount}
              helpText="When logged in"
              onChange={(value) => updateBuilderSetting("accountShowAccount", value)}
            />
            {builderSettings.accountShowAccount ? (
              <BlockStack gap="200">
                <div className="flex flex-col gap-0">
                  <Text as="h4" variant="headingSm">
                    Icon
                  </Text>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center w-full">
                    <div className="flex flex-col items-center gap-2">
                      {builderSettings.accountAccountIcon ? (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white shadow-sm">
                            {resolveCustomIconPreview(builderSettings.accountAccountIcon)}
                          </div>
                          <Popover
                            active={accountIconMenuOpenId === "account-account"}
                            onClose={() => setAccountIconMenuOpenId(null)}
                            activator={
                              <Button
                                variant="secondary"
                                disclosure
                                onClick={() =>
                                  setAccountIconMenuOpenId((prev) =>
                                    prev === "account-account" ? null : "account-account"
                                  )
                                }
                              >
                                Change
                              </Button>
                            }
                          >
                            <ActionList
                              items={[
                                {
                                  content: "Select icon",
                                  icon: ImageIcon,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    openIconPicker("settings", "account-account", "library");
                                  },
                                },
                                {
                                  content: "Upload icon",
                                  icon: UploadIcon,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    openIconPicker("settings", "account-account", "upload");
                                  },
                                },
                                {
                                  content: "Remove",
                                  icon: DeleteIcon,
                                  destructive: true,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    updateBuilderSetting("accountAccountIcon", "");
                                  },
                                },
                              ]}
                            />
                          </Popover>
                        </>
                      ) : (
                        <InlineStack align="center" blockAlign="center" gap="200" wrap={false}>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => openIconPicker("settings", "account-account", "library")}
                          >
                            Select icon
                          </button>
                          <Text as="span" variant="bodySm" tone="subdued">
                            or
                          </Text>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => openIconPicker("settings", "account-account", "upload")}
                          >
                            Upload icon
                          </button>
                        </InlineStack>
                      )}
                    </div>
                  </div>
                </div>
                {renderAccountIconWidthControls(
                  "accountAccountIconWidthMode",
                  "accountAccountIconWidthValue",
                  "accountAccountIconWidthUnit"
                )}
                <TextField
                  label="Account icon and title"
                  value={builderSettings.accountAccountLabel}
                  onChange={(value) => updateBuilderSetting("accountAccountLabel", value)}
                  autoComplete="off"
                />
              </BlockStack>
            ) : null}
            <Checkbox
              label="Show logout link"
              checked={builderSettings.accountShowLogout}
              helpText="When logged in"
              onChange={(value) => updateBuilderSetting("accountShowLogout", value)}
            />
            {builderSettings.accountShowLogout ? (
              <BlockStack gap="200">
                <div className="flex flex-col gap-0">
                  <Text as="h4" variant="headingSm">
                    Icon
                  </Text>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center w-full">
                    <div className="flex flex-col items-center gap-2">
                      {builderSettings.accountLogoutIcon ? (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white shadow-sm">
                            {resolveCustomIconPreview(builderSettings.accountLogoutIcon)}
                          </div>
                          <Popover
                            active={accountIconMenuOpenId === "account-logout"}
                            onClose={() => setAccountIconMenuOpenId(null)}
                            activator={
                              <Button
                                variant="secondary"
                                disclosure
                                onClick={() =>
                                  setAccountIconMenuOpenId((prev) =>
                                    prev === "account-logout" ? null : "account-logout"
                                  )
                                }
                              >
                                Change
                              </Button>
                            }
                          >
                            <ActionList
                              items={[
                                {
                                  content: "Select icon",
                                  icon: ImageIcon,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    openIconPicker("settings", "account-logout", "library");
                                  },
                                },
                                {
                                  content: "Upload icon",
                                  icon: UploadIcon,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    openIconPicker("settings", "account-logout", "upload");
                                  },
                                },
                                {
                                  content: "Remove",
                                  icon: DeleteIcon,
                                  destructive: true,
                                  onAction: () => {
                                    setAccountIconMenuOpenId(null);
                                    updateBuilderSetting("accountLogoutIcon", "");
                                  },
                                },
                              ]}
                            />
                          </Popover>
                        </>
                      ) : (
                        <InlineStack align="center" blockAlign="center" gap="200" wrap={false}>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => openIconPicker("settings", "account-logout", "library")}
                          >
                            Select icon
                          </button>
                          <Text as="span" variant="bodySm" tone="subdued">
                            or
                          </Text>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => openIconPicker("settings", "account-logout", "upload")}
                          >
                            Upload icon
                          </button>
                        </InlineStack>
                      )}
                    </div>
                  </div>
                </div>
                {renderAccountIconWidthControls(
                  "accountLogoutIconWidthMode",
                  "accountLogoutIconWidthValue",
                  "accountLogoutIconWidthUnit"
                )}
                <TextField
                  label="Logout icon and title"
                  value={builderSettings.accountLogoutLabel}
                  onChange={(value) => updateBuilderSetting("accountLogoutLabel", value)}
                  autoComplete="off"
                />
              </BlockStack>
            ) : null}
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Submenu
            </Text>
            <Checkbox
              label="Show border"
              checked={builderSettings.submenuShowBorder}
              onChange={(value) => updateBuilderSetting("submenuShowBorder", value)}
            />
            <Checkbox
              label="Enable desktop scrollbar"
              checked={builderSettings.submenuEnableDesktopScroll}
              onChange={(value) => updateBuilderSetting("submenuEnableDesktopScroll", value)}
            />
            <Checkbox
              label="Enable mobile scrollbar"
              checked={builderSettings.submenuEnableMobileScroll}
              onChange={(value) => updateBuilderSetting("submenuEnableMobileScroll", value)}
            />
            <TextField
              label="Submenu max width"
              value={builderSettings.submenuMaxWidth}
              onChange={(value) => updateBuilderSetting("submenuMaxWidth", value)}
              suffix="px"
              autoComplete="off"
            />
            <Select
              label="Mobile style"
              options={[
                { label: "Collapse", value: "collapse" },
                { label: "Drawer", value: "drawer" },
              ]}
              value={builderSettings.submenuMobileStyle}
              onChange={(value) =>
                updateBuilderSetting(
                  "submenuMobileStyle",
                  value as BuilderSettings["submenuMobileStyle"]
                )
              }
            />
          </BlockStack>
        </BlockStack >
      </Card >
    );
}
