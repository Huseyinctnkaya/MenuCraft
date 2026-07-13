import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BlockStack, Box, Card, Collapsible, Icon, InlineStack, Page, Text } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Documentation() {
  const [openDoc, setOpenDoc] = useState<number | null>(null);

  const documentation = [
    {
      title: "1. Getting started",
      summary: "Install MenuCraft and connect it to your theme.",
      details: [
        "Open Install & Theme Status to verify theme compatibility.",
        "Enable the MenuCraft app embed in Theme Extensions.",
        "Add the MenuCraft block to your header or navigation section.",
      ],
    },
    {
      title: "2. Create your first menu",
      summary: "Start a new menu and open the visual builder.",
      details: [
        "Go to Mega Menus and click Create New Menu.",
        "Name your menu (ex: Main Navigation).",
        "The menu opens in the builder in Draft mode.",
      ],
    },
    {
      title: "3. Builder layout overview",
      summary: "Learn the left rail, preview panel, and settings panels.",
      details: [
        "Left rail: menu items and item controls.",
        "Preview: live menu rendering for desktop and mobile.",
        "Settings: general, typography, colors, and custom CSS.",
      ],
    },
    {
      title: "4. Add and organize items",
      summary: "Build the structure with items and submenus.",
      details: [
        "Use Add item to create top-level menu items.",
        "Click an item to add submenus or link lists beneath it.",
        "Drag items using the six-dot handle to reorder.",
      ],
    },
    {
      title: "5. Link types and sources",
      summary: "Connect items to Shopify resources.",
      details: [
        "Choose from Home, Collections, Products, Pages, Blogs, and custom links.",
        "Search in the link dropdown to find content quickly.",
        "Use the clear button to remove a selected link.",
      ],
    },
    {
      title: "6. Edit an item",
      summary: "Update titles, links, descriptions, and visibility.",
      details: [
        "Open item edit to update label, link, and description.",
        "Use visibility options to show or hide items by device.",
        "Add an optional custom CSS class for advanced styling.",
      ],
    },
    {
      title: "7. Layout, spacing, and sizing",
      summary: "Control how the menu appears across devices.",
      details: [
        "Adjust row height, padding, and dropdown spacing.",
        "Set alignment and maximum width for wide menus.",
        "Use scroll options for tall submenus.",
      ],
    },
    {
      title: "8. Typography",
      summary: "Customize fonts and sizes per menu area.",
      details: [
        "Set fonts for main menu, tabs, submenu titles, and descriptions.",
        "Enable custom fonts per section if needed.",
        "Use the size slider for quick fine-tuning.",
      ],
    },
    {
      title: "9. Colors",
      summary: "Match your brand colors across menu states.",
      details: [
        "Set backgrounds, text colors, and hover states.",
        "Use the color picker for precise brand matching.",
        "Preview changes instantly in the menu preview.",
      ],
    },
    {
      title: "10. Preview on desktop and mobile",
      summary: "Validate your menu before going live.",
      details: [
        "Toggle between desktop and mobile previews.",
        "Check submenu behavior and hover states.",
        "Confirm spacing and alignment on smaller screens.",
      ],
    },
    {
      title: "11. Save vs publish",
      summary: "Draft menus are not live until published.",
      details: [
        "Save stores your changes to the database.",
        "Publish makes the menu live in your theme.",
        "If you edit again, save before leaving to avoid losing changes.",
      ],
    },
    {
      title: "12. Templates and import",
      summary: "Speed up setup with templates or imports.",
      details: [
        "Use Templates to start from a prebuilt layout.",
        "Import existing Shopify menus (Plus plan).",
        "Duplicate menus to reuse structures quickly.",
      ],
    },
    {
      title: "13. Analytics",
      summary: "Track clicks, views, and performance trends.",
      details: [
        "See top performing menus and links.",
        "Use date ranges to compare performance.",
        "Advanced analytics features may require a paid plan.",
      ],
    },
    {
      title: "14. Plans and billing",
      summary: "Understand plan limits and upgrades.",
      details: [
        "Free plan includes one menu and basic styling.",
        "Pro plan unlocks unlimited menus and advanced features.",
        "Plus plan adds Import/Export tools and tabbed menus.",
        "Billing is managed through Shopify when public distribution is enabled.",
      ],
    },
    {
      title: "15. Account settings",
      summary: "Manage preferences and store details.",
      details: [
        "Update language and notification preferences.",
        "Review store and theme information.",
        "Track usage and menu limits by plan.",
      ],
    },
    {
      title: "16. Troubleshooting",
      summary: "Common issues and quick fixes.",
      details: [
        "If the menu does not show, confirm app embed is enabled.",
        "Ensure the MenuCraft block is added to the correct section.",
        "Refresh theme cache after publishing changes.",
      ],
    },
    {
      title: "17. Support",
      summary: "Need help? We are here.",
      details: [
        "Use the Support page for documentation and FAQs.",
        "Live chat and email support will be available soon.",
      ],
    },
  ];

  return (
    <Page title="Documentation" subtitle="Complete guides to set up, build, and manage MenuCraft">
      <Card>
        <BlockStack gap="300">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">MenuCraft Guides</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Follow these steps to build, style, and manage your menus.
            </Text>
          </BlockStack>
          <BlockStack gap="0">
            {documentation.map((doc, index) => (
              <Box key={doc.title} paddingBlock="300" borderBlockEndWidth={index < documentation.length - 1 ? "025" : undefined} borderColor="border">
                <div style={{ cursor: "pointer" }} onClick={() => setOpenDoc(openDoc === index ? null : index)}>
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="050">
                      <Text as="p" variant="bodySm">{doc.title}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">{doc.summary}</Text>
                    </BlockStack>
                    <Icon source={openDoc === index ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
                  </InlineStack>
                </div>
                <Collapsible open={openDoc === index} id={`doc-${index}`}>
                  <Box paddingBlockStart="200">
                    <ul style={{ marginLeft: "20px", listStyle: "disc" }}>
                      {doc.details.map((detail) => (
                        <li key={detail}>
                          <Text as="span" variant="bodySm" tone="subdued">{detail}</Text>
                        </li>
                      ))}
                    </ul>
                  </Box>
                </Collapsible>
              </Box>
            ))}
          </BlockStack>
        </BlockStack>
      </Card>
    </Page>
  );
}
