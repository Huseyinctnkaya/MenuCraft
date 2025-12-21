import { Page, Layout, Card, Text, BlockStack, Button, InlineStack, TextField } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Settings() {
  const [formState, setFormState] = useState({
    storeName: "",
    email: "",
  });

  return (
    <Page>
      <TitleBar title="Settings" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  General Settings
                </Text>
                <BlockStack gap="300">
                  <TextField
                    label="Store Name"
                    value={formState.storeName}
                    onChange={(value) =>
                      setFormState({ ...formState, storeName: value })
                    }
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={formState.email}
                    onChange={(value) =>
                      setFormState({ ...formState, email: value })
                    }
                  />
                  <InlineStack gap="200">
                    <Button variant="primary">Save Changes</Button>
                    <Button variant="secondary">Cancel</Button>
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
