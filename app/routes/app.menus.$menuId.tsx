import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Badge,
  Card,
  Layout,
  Page,
  ResourceItem,
  ResourceList,
  Text
} from "@shopify/polaris";
import { getMenuWithItems } from "../models/menu.server";
import { requireShopSession } from "../lib/shopify.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const shop = await requireShopSession(request);
  const menuId = Number(params.menuId);

  if (!menuId) {
    throw new Response("Menu not found", { status: 404 });
  }

  const menu = await getMenuWithItems(menuId, shop.id);

  if (!menu) {
    throw new Response("Menu not found", { status: 404 });
  }

  return json({ menu });
}

export default function MenuDetailRoute() {
  const { menu } = useLoaderData<typeof loader>();

  return (
    <Page title={menu.title} subtitle="Menü öğelerini düzenle ve yayınla">
      <Layout>
        <Layout.Section>
          <Card title="Menü öğeleri">
            <ResourceList
              resourceName={{ singular: "öğe", plural: "öğeler" }}
              items={menu.items}
              emptyState={<Text as="p">Henüz öğe yok.</Text>}
              renderItem={(item) => (
                <ResourceItem id={String(item.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <Text as="h3" variant="bodyMd">
                        {item.title}
                      </Text>
                      <div style={{ color: "#6d7175" }}>
                        {item.type} · {item.url ?? "Bağlı değil"}
                      </div>
                    </div>
                    <Badge>{item.parentId ? `Alt öğe #${item.parentId}` : "Kök"}</Badge>
                  </div>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card title="Versiyonlar" sectioned>
            {menu.versions.length === 0 ? (
              <Text as="p">Versiyon bulunamadı.</Text>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                {menu.versions.map((version) => (
                  <li key={version.id}>
                    <Text as="span" variant="bodyMd">
                      {version.label}
                    </Text>{" "}
                    {version.isPublished ? <Badge tone="success">Yayında</Badge> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
