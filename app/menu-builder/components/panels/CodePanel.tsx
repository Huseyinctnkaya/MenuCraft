import { BlockStack, Card, Divider, Text, TextField } from "@shopify/polaris";

import type { BuilderSettings } from "../../types";

type CodePanelProps = {
  builderSettings: BuilderSettings;
  updateBuilderSetting: <K extends keyof BuilderSettings>(
    key: K,
    value: BuilderSettings[K]
  ) => void;
};

export function CodePanel({ builderSettings, updateBuilderSetting }: CodePanelProps) {
  return (
    <Card padding="400">
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Custom code
        </Text>
        <Divider />
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            Stylesheet / CSS
          </Text>
          <TextField
            label="Custom CSS"
            labelHidden
            value={builderSettings.customCss}
            placeholder="// enter custom CSS here"
            onChange={(value) => updateBuilderSetting("customCss", value)}
            multiline={8}
            autoComplete="off"
            className="rounded-xl bg-white"
          />
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
