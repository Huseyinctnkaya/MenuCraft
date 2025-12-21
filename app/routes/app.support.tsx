import { Page, Layout, Card, Text, BlockStack, Button, InlineStack, Link } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Support() {
  return (
    <Page>
      <TitleBar title="Support" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Support & Help
                </Text>
                <BlockStack gap="300">
                  <div>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Need help? Get in touch with our support team.
                    </Text>
                  </div>
                  <InlineStack gap="200">
                    <Button variant="secondary">Documentation</Button>
                    <Button variant="secondary">Contact Support</Button>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
