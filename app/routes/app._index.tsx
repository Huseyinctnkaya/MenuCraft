import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <Page>
      <TitleBar title="Dashboard" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <div style={{ textAlign: "center", paddingTop: "40px" }}>
                <Text as="h1" variant="heading2xl" tone="base">
                  Welcome to MenuCraft
                </Text>
                <Text as="p" variant="headingMd" tone="subdued" style={{ marginTop: "16px" }}>
                  Create stunning mega menus that boost navigation and increase
                  conversions for your Shopify store
                </Text>
              </div>

              <div style={{ paddingTop: "40px" }}>
                <InlineStack gap="400" wrap>
                  {/* Create Mega Menu Card */}
                  <div style={{ flex: "1", minWidth: "280px" }}>
                    <Card>
                      <BlockStack gap="300">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            paddingTop: "20px",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "50%",
                              backgroundColor: "#E0E7FF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "40px",
                            }}
                          >
                            ☰
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <Text as="h3" variant="headingMd">
                            Create Mega Menu
                          </Text>
                        </div>
                        <Text
                          as="p"
                          variant="bodyMd"
                          tone="subdued"
                          style={{ textAlign: "center" }}
                        >
                          Build powerful navigation menus with unlimited depth
                          and customization
                        </Text>
                        <div style={{ textAlign: "center", paddingBottom: "20px" }}>
                          <Button variant="primary" fullWidth size="large">
                            Get Started
                          </Button>
                        </div>
                      </BlockStack>
                    </Card>
                  </div>

                  {/* Mobile Menu Card */}
                  <div style={{ flex: "1", minWidth: "280px" }}>
                    <Card>
                      <BlockStack gap="300">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            paddingTop: "20px",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "50%",
                              backgroundColor: "#E0E7FF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "40px",
                            }}
                          >
                            📱
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <InlineStack gap="200" align="center" distribution="center">
                            <Text as="h3" variant="headingMd">
                              Mobile Menu
                            </Text>
                            <Badge tone="info">Pro</Badge>
                          </InlineStack>
                        </div>
                        <Text
                          as="p"
                          variant="bodyMd"
                          tone="subdued"
                          style={{ textAlign: "center" }}
                        >
                          Responsive mobile-first menus optimized for all
                          devices
                        </Text>
                        <div style={{ textAlign: "center", paddingBottom: "20px" }}>
                          <Button variant="primary" fullWidth size="large">
                            Explore
                          </Button>
                        </div>
                      </BlockStack>
                    </Card>
                  </div>

                  {/* Import Menu Card */}
                  <div style={{ flex: "1", minWidth: "280px" }}>
                    <Card>
                      <BlockStack gap="300">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            paddingTop: "20px",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "50%",
                              backgroundColor: "#E0E7FF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "40px",
                            }}
                          >
                            ⬇️
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <InlineStack gap="200" align="center" distribution="center">
                            <Text as="h3" variant="headingMd">
                              Import Menu
                            </Text>
                            <Badge tone="info">Pro</Badge>
                          </InlineStack>
                        </div>
                        <Text
                          as="p"
                          variant="bodyMd"
                          tone="subdued"
                          style={{ textAlign: "center" }}
                        >
                          Import existing menus from your Shopify store
                          instantly
                        </Text>
                        <div style={{ textAlign: "center", paddingBottom: "20px" }}>
                          <Button variant="primary" fullWidth size="large">
                            Import Now
                          </Button>
                        </div>
                      </BlockStack>
                    </Card>
                  </div>
                </InlineStack>
              </div>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
