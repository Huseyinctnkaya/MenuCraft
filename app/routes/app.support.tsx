import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLocation, useNavigate } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  Icon,
  InlineGrid,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import { ChatIcon, ChevronDownIcon, ChevronUpIcon, EmailIcon, FileIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const withSearch = (path: string) => ({ pathname: path, search: location.search });

  const faqs = [
    {
      q: "How do I create my first mega menu?",
      a: "Navigate to the Mega Menus page, click 'Create New Menu', and use the visual editor to add items and configure your layout.",
    },
    {
      q: "Can I use MenuCraft with my custom theme?",
      a: "Yes. MenuCraft works with all Shopify 2.0 themes and most legacy themes. Check the Install & Theme Status page for compatibility.",
    },
    {
      q: "How do I upgrade to Pro?",
      a: "Go to Pricing & Plans and select your desired plan. You can upgrade anytime with a few clicks.",
    },
    {
      q: "Is there a limit on menu items?",
      a: "Free plan allows one menu. Pro and Plus plans include unlimited menus and more advanced styling options.",
    },
    {
      q: "Can I import my existing Shopify menu?",
      a: "Yes. Plus plan includes menu import functionality. Go to the Menu Builder and choose Import.",
    },
  ];

  return (
    <Page title="Support & Help" subtitle="Get help and find answers to common questions">
      <BlockStack gap="400">
        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          <Card>
            <BlockStack gap="300" inlineAlign="center">
              <Icon source={FileIcon} tone="info" />
              <Text as="h3" variant="headingSm">Documentation</Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">Detailed guides and tutorials</Text>
              <Button fullWidth onClick={() => navigate(withSearch("/app/documentation"))}>View Docs</Button>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300" inlineAlign="center">
              <Icon source={ChatIcon} tone="success" />
              <Text as="h3" variant="headingSm">Live Chat</Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">Chat with us in real-time</Text>
              <Button
                fullWidth
                onClick={() => {
                  if (typeof window !== "undefined" && window.$crisp) {
                    window.$crisp.push(["do", "chat:open"]);
                  }
                }}
              >
                Start Chat
              </Button>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300" inlineAlign="center">
              <Icon source={EmailIcon} tone="info" />
              <InlineStack gap="150" blockAlign="center">
                <Text as="h3" variant="headingSm">Email Support</Text>
                <Badge tone="info">Soon</Badge>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">We will add email support shortly</Text>
              <Button fullWidth disabled>Send Email</Button>
            </BlockStack>
          </Card>
        </InlineGrid>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Frequently Asked Questions</Text>
            <BlockStack gap="0">
              {faqs.map((faq, index) => (
                <Box key={faq.q} paddingBlock="300" borderBlockEndWidth={index < faqs.length - 1 ? "025" : undefined} borderColor="border">
                  <div style={{ cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="span" variant="bodySm">{faq.q}</Text>
                      <Icon source={openFaq === index ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
                    </InlineStack>
                  </div>
                  <Collapsible open={openFaq === index} id={`support-faq-${index}`}>
                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodySm" tone="subdued">{faq.a}</Text>
                    </Box>
                  </Collapsible>
                </Box>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
