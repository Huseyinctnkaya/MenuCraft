import { Card, Layout, Page, Text } from "@shopify/polaris";

export default function SettingsRoute() {
  return (
    <Page title="Ayarlar">
      <Layout>
        <Layout.Section>
          <Card title="Tema entegrasyonu" sectioned>
            <Text as="p" variant="bodyMd">
              Tema app embed / block konfigürasyonunu buraya ekleyebilirsin.
              Theme app extension ile eşleştirmek için JSON şemasını burada
              tutacağız.
            </Text>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card title="API & erişim" sectioned>
            <Text as="p" variant="bodyMd">
              Shopify API anahtarı, izinler ve webhook doğrulama ayarları bu
              bölümde toplanacak. .env dosyasındaki değerleri güncellemeyi
              unutma.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
