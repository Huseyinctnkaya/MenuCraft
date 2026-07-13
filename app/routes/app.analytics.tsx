import { useMemo } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  Icon,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
} from "@shopify/polaris";
import {
  CalendarIcon,
} from "@shopify/polaris-icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";

const rangeOptions = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
];

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const percentChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);

  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
  const { appSubscriptions } = await billing.check({
    plans: [...ALL_BILLING_PLAN_NAMES],
    isTest: billingTestMode,
  });
  const activeSubscription = appSubscriptions.find((subscription) =>
    ["ACTIVE", "ACCEPTED"].includes(subscription.status)
  );

  const planSelection = getPlanSelection(activeSubscription?.name) ?? {
    id: "free" as const,
  };

  let rangeParam = url.searchParams.get("range") ?? "7d";

  // Enforce plan limit for historical data
  if (planSelection.id === "free" && (rangeParam === "30d" || rangeParam === "90d")) {
    rangeParam = "7d";
  }

  const range = rangeOptions.find((option) => option.value === rangeParam) ?? rangeOptions[0];

  const now = new Date();
  const endDate = startOfDay(now);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (range.days - 1));
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(startDate.getDate() - range.days);
  const menuEventClient = (
    prisma as typeof prisma & { menuEvent?: typeof prisma.menuEvent }
  ).menuEvent;

  if (!menuEventClient) {
    console.warn(
      "[analytics] Prisma client is missing menuEvent. Run `npx prisma generate` and restart."
    );

    const emptyBuckets = Array.from({ length: range.days }, (_, index) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + index);
      return {
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        impressions: 0,
        clicks: 0,
      };
    });

    const engagementData = Array.from({ length: 4 }, (_, index) => ({
      week: `Week ${index + 1}`,
      withMenuCraft: 0,
      withoutMenuCraft: 0,
    }));

    return json({
      range: range.value,
      stats: {
        clicks: { value: 0, change: 0 },
        views: { value: 0, change: 0 },
        ctr: { value: 0, change: 0 },
      },
      impressionsClicksData: emptyBuckets,
      engagementData,
      avgImpact: 0,
      topMenus: [],
      topLinks: [],
    });
  }

  const engagementStart = new Date(endDate);
  engagementStart.setDate(endDate.getDate() - 27);
  const engagementPrevStart = new Date(engagementStart);
  engagementPrevStart.setDate(engagementStart.getDate() - 28);

  const [
    [events, prevEvents],
    [engagementEvents, prevEngagementEvents]
  ] = await Promise.all([
    Promise.all([
      menuEventClient.findMany({
        where: { shop, createdAt: { gte: startDate } },
      }),
      menuEventClient.findMany({
        where: { shop, createdAt: { gte: prevStartDate, lt: startDate } },
      }),
    ]),
    Promise.all([
      menuEventClient.findMany({
        where: { shop, createdAt: { gte: engagementStart } },
      }),
      menuEventClient.findMany({
        where: { shop, createdAt: { gte: engagementPrevStart, lt: engagementStart } },
      }),
    ])
  ]);

  const countByType = (items: any[], type: string) =>
    items.filter((event) => event.eventType === type).length;

  const clicks = countByType(events, "click");
  const impressions = countByType(events, "impression");
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  const prevClicks = countByType(prevEvents, "click");
  const prevImpressions = countByType(prevEvents, "impression");
  const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;

  const stats = {
    clicks: {
      value: clicks,
      change: percentChange(clicks, prevClicks),
    },
    views: {
      value: impressions,
      change: percentChange(impressions, prevImpressions),
    },
    ctr: {
      value: ctr,
      change: percentChange(ctr, prevCtr),
    },
  };

  const buckets = Array.from({ length: range.days }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      impressions: 0,
      clicks: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  events.forEach((event) => {
    const key = event.createdAt.toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (!bucket) return;
    if (event.eventType === "impression") {
      bucket.impressions += 1;
    } else if (event.eventType === "click") {
      bucket.clicks += 1;
    }
  });

  const impressionsClicksData = buckets.map((bucket) => ({
    day: bucket.label,
    impressions: bucket.impressions,
    clicks: bucket.clicks,
  }));

  // Date calculations moved up

  const prevEngagementClicks = countByType(prevEngagementEvents, "click");
  const prevEngagementImpressions = countByType(prevEngagementEvents, "impression");
  const baselineCtr =
    prevEngagementImpressions > 0 ? (prevEngagementClicks / prevEngagementImpressions) * 100 : 0;

  const engagementBuckets = Array.from({ length: 4 }, (_, index) => {
    const bucketStart = new Date(engagementStart);
    bucketStart.setDate(engagementStart.getDate() + index * 7);
    return {
      label: `Week ${index + 1}`,
      start: bucketStart,
      end: new Date(bucketStart.getTime() + 6 * 24 * 60 * 60 * 1000),
      impressions: 0,
      clicks: 0,
    };
  });

  engagementEvents.forEach((event) => {
    const eventDate = event.createdAt;
    const bucket = engagementBuckets.find(
      (item) => eventDate >= item.start && eventDate <= item.end
    );
    if (!bucket) return;
    if (event.eventType === "impression") {
      bucket.impressions += 1;
    } else if (event.eventType === "click") {
      bucket.clicks += 1;
    }
  });

  const engagementData = engagementBuckets.map((bucket) => {
    const bucketCtr = bucket.impressions > 0 ? (bucket.clicks / bucket.impressions) * 100 : 0;
    return {
      week: bucket.label,
      withMenuCraft: Number(bucketCtr.toFixed(1)),
      withoutMenuCraft: Number(Math.max(bucketCtr - Math.max(0, baselineCtr), 0).toFixed(1)),
    };
  });

  const avgWith =
    engagementData.reduce((sum, item) => sum + item.withMenuCraft, 0) / engagementData.length;
  const avgWithout =
    engagementData.reduce((sum, item) => sum + item.withoutMenuCraft, 0) / engagementData.length;
  const avgImpact = avgWith - avgWithout;

  const menuStats = new Map<number | string, { clicks: number; impressions: number }>();
  events.forEach((event) => {
    const key =
      typeof event.menuId === "number"
        ? event.menuId
        : event.menuName
          ? `name:${event.menuName}`
          : null;
    if (key === null) return;
    if (!menuStats.has(key)) {
      menuStats.set(key, { clicks: 0, impressions: 0 });
    }
    const entry = menuStats.get(key)!;
    if (event.eventType === "click") {
      entry.clicks += 1;
    } else if (event.eventType === "impression") {
      entry.impressions += 1;
    }
  });

  const menuIds = Array.from(menuStats.keys())
    .filter((key): key is number => typeof key === "number")
    .filter((id) => Number.isInteger(id));
  const menus = menuIds.length
    ? await prisma.menu.findMany({
      where: { shop, id: { in: menuIds } },
      select: { id: true, name: true },
    })
    : [];
  const menuNameMap = new Map(menus.map((menu) => [menu.id, menu.name]));

  const topMenus = Array.from(menuStats.entries())
    .map(([key, value]) => {
      const name =
        typeof key === "number"
          ? menuNameMap.get(key) ?? `Menu #${key}`
          : key.replace("name:", "");
      const ctrValue = value.impressions > 0 ? (value.clicks / value.impressions) * 100 : 0;
      return {
        name,
        clicks: value.clicks,
        ctr: `${ctrValue.toFixed(1)}%`,
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  const linkStats = new Map<string, { clicks: number; type: string }>();
  events.forEach((event) => {
    if (event.eventType !== "click") return;
    const label = event.itemLabel ?? event.itemId ?? "Unknown link";
    const type = event.itemType ?? "Link";
    const key = `${label}::${type}`;
    if (!linkStats.has(key)) {
      linkStats.set(key, { clicks: 0, type });
    }
    linkStats.get(key)!.clicks += 1;
  });

  const topLinks = Array.from(linkStats.entries())
    .map(([key, value]) => {
      const label = key.split("::")[0];
      return {
        label,
        clicks: value.clicks,
        type: value.type,
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return json({
    planTier: planSelection.id,
    range: range.value,
    stats,
    impressionsClicksData,
    engagementData,
    avgImpact,
    topMenus,
    topLinks,
  });
};

export default function Analytics() {
  const { planTier, range, stats, impressionsClicksData, engagementData, avgImpact, topMenus, topLinks } =
    useLoaderData<any>();
  const isFreePlan = planTier === "free";
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pricingHref = searchParams.toString()
    ? `/app/pricing?${searchParams.toString()}`
    : "/app/pricing";
  const currentRange =
    rangeOptions.find((option) => option.value === range) ?? rangeOptions[0];
  const statCards = useMemo(
    () => [
      {
        label: "Total Clicks",
        value: stats.clicks.value.toLocaleString(),
        change: stats.clicks.change,
      },
      {
        label: "Total Views",
        value: stats.views.value.toLocaleString(),
        change: stats.views.change,
      },
      {
        label: "Click-Through Rate",
        value: `${stats.ctr.value.toFixed(1)}%`,
        change: stats.ctr.change,
      },
    ],
    [stats]
  );

  const handleRangeChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("range", value);
    setSearchParams(next);
  };

  return (
    <Page title="Analytics" subtitle="Track how MenuCraft impacts navigation engagement">
      <BlockStack gap="400">
        {isFreePlan && (
          <Card>
            <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
              <InlineStack gap="300" blockAlign="center">
                <Box>
                  <Icon source={CalendarIcon} tone="info" />
                </Box>
                <Text as="p" variant="bodyMd">
                  You are on the <strong>Free plan</strong>. Analytics history is limited to the last{" "}
                  <strong>7 days</strong>. Upgrade to Pro to see 30 and 90-day history.
                </Text>
              </InlineStack>
              <Button variant="primary" onClick={() => navigate("/app/pricing")}>
                Upgrade to Pro
              </Button>
            </InlineStack>
          </Card>
        )}

        <InlineStack align="end">
          <Select
            label="Date range"
            labelHidden
            options={rangeOptions.map((option) => ({
              label: `${option.label}${isFreePlan && option.value !== "7d" ? " (Pro)" : ""}`,
              value: option.value,
              disabled: isFreePlan && option.value !== "7d",
            }))}
            value={currentRange.value}
            onChange={handleRangeChange}
          />
        </InlineStack>

        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <InlineStack align="space-between" blockAlign="start">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">{stat.label}</Text>
                  <Text as="p" variant="heading2xl">{stat.value}</Text>
                  <Text as="p" variant="bodySm" tone="success">
                    {`${stat.change >= 0 ? "+" : ""}${Math.round(stat.change)}%`} from last period
                  </Text>
                </BlockStack>
              </InlineStack>
            </Card>
          ))}
        </InlineGrid>

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Menu Impressions &amp; Clicks</Text>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={impressionsClicksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} iconType="line" />
                    <Line type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Impressions" />
                    <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Clicks" />
                  </LineChart>
                </ResponsiveContainer>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">Engagement Impact</Text>
                  <Badge tone="success">
                    {`${avgImpact >= 0 ? "+" : ""}${avgImpact.toFixed(1)}% avg`}
                  </Badge>
                </InlineStack>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} domain={[0, 30]} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => `${value}%`} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                    <Bar dataKey="withMenuCraft" fill="#6366f1" radius={[6, 6, 0, 0]} name="With MenuCraft" />
                    <Bar dataKey="withoutMenuCraft" fill="#d1d5db" radius={[6, 6, 0, 0]} name="Without MenuCraft" />
                  </BarChart>
                </ResponsiveContainer>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card padding="0">
              <Box padding="400" paddingBlockEnd="0">
                <Text as="h2" variant="headingMd">Top Performing Menus</Text>
              </Box>
              <DataTable
                columnContentTypes={["text", "numeric", "text"]}
                headings={["Menu Name", "Clicks", "CTR"]}
                rows={topMenus.map((menu) => [menu.name, menu.clicks.toLocaleString(), menu.ctr])}
              />
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card padding="0">
              <Box padding="400" paddingBlockEnd="0">
                <Text as="h2" variant="headingMd">Top Links</Text>
              </Box>
              <DataTable
                columnContentTypes={["text", "numeric", "text"]}
                headings={["Link Label", "Clicks", "Type"]}
                rows={topLinks.map((link) => [link.label, link.clicks.toLocaleString(), link.type])}
              />
            </Card>
          </Layout.Section>
        </Layout>

        {planTier === "plus" ? (
          <Layout>
            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">Menu Heatmap</Text>
                    <Badge tone="info">Plus Feature</Badge>
                  </InlineStack>
                  <Box background="bg-surface-secondary" borderRadius="200" padding="800" minHeight="240px">
                    <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                      Visualizing most clicked areas on your mega menus
                    </Text>
                  </Box>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">A/B Testing Experiments</Text>
                    <Badge tone="info">Plus Feature</Badge>
                  </InlineStack>
                  <Box background="bg-surface-info" borderRadius="200" padding="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text as="p" variant="bodySm" tone="subdued">Current Test</Text>
                        <Text as="h3" variant="headingSm">Tabs vs Simple Grid Layout</Text>
                      </BlockStack>
                      <Badge tone="success">Running</Badge>
                    </InlineStack>
                  </Box>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        { name: "Variant A (Tabs)", ctr: 18.5, fill: "#6366f1" },
                        { name: "Variant B (Grid)", ctr: 12.2, fill: "#94a3b8" },
                      ]}
                      layout="vertical"
                      margin={{ left: 20, right: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} width={100} />
                      <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="ctr" radius={[0, 4, 4, 0]} barSize={24} name="Click Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                  <InlineGrid columns={2} gap="400">
                    <Box background="bg-surface-secondary" borderRadius="200" padding="300">
                      <Text as="p" variant="bodySm" tone="subdued">Best Performer</Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">Variant A</Text>
                      <Text as="p" variant="bodySm" tone="success">+51.6% higher CTR</Text>
                    </Box>
                    <Box background="bg-surface-secondary" borderRadius="200" padding="300">
                      <Text as="p" variant="bodySm" tone="subdued">Significance</Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">98.2%</Text>
                      <Text as="p" variant="bodySm" tone="subdued">Mathematically certain</Text>
                    </Box>
                  </InlineGrid>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        ) : (
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodyMd">
                Advanced analytics (heatmaps, A/B testing) are available on the Plus plan.
              </Text>
              <Button variant="primary" onClick={() => navigate(pricingHref)}>
                Upgrade to Plus
              </Button>
            </InlineStack>
          </Card>
        )}
        <Box paddingBlockEnd="1200" />
      </BlockStack>
    </Page>
  );
}
