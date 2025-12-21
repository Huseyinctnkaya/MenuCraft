import { useRouteLoaderData } from "@remix-run/react";
import { Card, Layout, Page, Text } from "@shopify/polaris";
import type { AppLoaderData } from "./app";

export default function DashboardRoute() {
  const data = useRouteLoaderData<AppLoaderData>("routes/app");

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">
              Hoş geldin {data?.shop.shopDomain ?? "Shop"}
            </Text>
            <Text as="p" variant="bodyMd">
              Menüleri oluştur, düzenle ve temaya gönder. Menüler sekmesinden
              başlayabilirsin.
            </Text>
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card title="Hızlı bağlantılar" sectioned>
            <ul style={{ margin: 0, paddingLeft: "1rem" }}>
              <li>
                <a href="/app/menus">Menü listesi</a>
              </li>
              <li>
                <a href="/app/settings">Ayarlar</a>
              </li>
            </ul>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
