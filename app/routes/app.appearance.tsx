import { Page, Layout, Card, Text, BlockStack, Button, InlineStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Appearance() {
  return (
    <Page>
      <TitleBar title="Appearance" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Appearance Settings
                  </Text>
                  <Button variant="primary">Customize</Button>
                </InlineStack>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Customize the look and feel of your menus.
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
