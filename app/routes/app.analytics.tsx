import { useMemo } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import {
  BarChart3,
  Calendar,
  Eye,
  MousePointer,
  TrendingUp,
} from "lucide-react";
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
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

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
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range") ?? "7d";
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

  const [events, prevEvents] = await Promise.all([
    menuEventClient.findMany({
      where: { shop, createdAt: { gte: startDate } },
    }),
    menuEventClient.findMany({
      where: { shop, createdAt: { gte: prevStartDate, lt: startDate } },
    }),
  ]);

  const countByType = (items: typeof events, type: string) =>
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

  const engagementStart = new Date(endDate);
  engagementStart.setDate(endDate.getDate() - 27);
  const engagementPrevStart = new Date(engagementStart);
  engagementPrevStart.setDate(engagementStart.getDate() - 28);

  const [engagementEvents, prevEngagementEvents] = await Promise.all([
    menuEventClient.findMany({
      where: { shop, createdAt: { gte: engagementStart } },
    }),
    menuEventClient.findMany({
      where: { shop, createdAt: { gte: engagementPrevStart, lt: engagementStart } },
    }),
  ]);

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
  const { range, stats, impressionsClicksData, engagementData, avgImpact, topMenus, topLinks } =
    useLoaderData<typeof loader>();
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
        icon: MousePointer,
      },
      {
        label: "Total Views",
        value: stats.views.value.toLocaleString(),
        change: stats.views.change,
        icon: Eye,
      },
      {
        label: "Click-Through Rate",
        value: `${stats.ctr.value.toFixed(1)}%`,
        change: stats.ctr.change,
        icon: TrendingUp,
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Track how MenuCraft impacts navigation engagement
            </p>
          </div>
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-900 cursor-pointer hover:border-gray-400 transition-colors"
              value={currentRange.value}
              onChange={(e) => handleRangeChange(e.target.value)}
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {`${stat.change >= 0 ? "+" : ""}${Math.round(stat.change)}%`} from last period
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg text-gray-900">Menu Impressions & Clicks</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={impressionsClicksData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Impressions"
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Clicks"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Engagement Impact</h2>
              </div>
              <Badge variant="success" className="bg-green-100 text-green-700 text-xs px-2 py-1">
                {`${avgImpact >= 0 ? "+" : ""}${avgImpact.toFixed(1)}% avg`}
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  domain={[0, 30]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => `${value}%`}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                <Bar
                  dataKey="withMenuCraft"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  name="With MenuCraft"
                />
                <Bar
                  dataKey="withoutMenuCraft"
                  fill="#d1d5db"
                  radius={[6, 6, 0, 0]}
                  name="Without MenuCraft"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg text-gray-900 mb-4">Top Performing Menus</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs text-gray-600 pb-3">Menu Name</th>
                    <th className="text-right text-xs text-gray-600 pb-3">Clicks</th>
                    <th className="text-right text-xs text-gray-600 pb-3">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topMenus.map((menu, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm text-gray-900">{menu.name}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        {menu.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 text-sm text-gray-900 text-right">{menu.ctr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg text-gray-900 mb-4">Top Links</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs text-gray-600 pb-3">Link Label</th>
                    <th className="text-right text-xs text-gray-600 pb-3">Clicks</th>
                    <th className="text-right text-xs text-gray-600 pb-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {topLinks.map((link, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm text-gray-900">{link.label}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        {link.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-block text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {link.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Advanced analytics (heatmaps, A/B testing) are available on the Plus plan.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate(pricingHref)}>
              Upgrade to Plus
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
