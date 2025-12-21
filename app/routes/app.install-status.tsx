import { Page, Layout, Card, Text, BlockStack, Badge } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function InstallStatus() {
  return (
    <Page>
      <TitleBar title="Install & Theme Status" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Install & Theme Status
                </Text>
                <BlockStack gap="300">
                  <div>
                    <Text as="p" variant="bodyMd">
                      Theme Installation Status
                    </Text>
                    <Badge tone="info">Not Installed</Badge>
                  </div>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
