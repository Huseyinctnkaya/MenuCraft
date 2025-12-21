import { Link } from "@remix-run/react";
import { Card, Layout, Page, Text } from "@shopify/polaris";

export default function Index() {
  return (
    <Page title="MenuCraft">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="p" variant="bodyLg">
              Shopify mağazan için mega menüleri kolayca oluştur ve yayınla.
            </Text>
            <div style={{ marginTop: "16px" }}>
              <Link to="/auth">Uygulamayı mağazanda aç</Link>
            </div>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card title="Stack" sectioned>
            <Text as="p" variant="bodyMd">
              Remix + Polaris + App Bridge + Prisma. Aşağıdaki /app rotasında
              yönetim paneli çalışır.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
