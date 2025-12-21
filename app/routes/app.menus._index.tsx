import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation
} from "@remix-run/react";
import {
  Button,
  Card,
  Layout,
  Page,
  ResourceItem,
  ResourceList,
  Text,
  TextField
} from "@shopify/polaris";
import { useState } from "react";
import { createMenu, listMenus } from "../models/menu.server";
import { requireShopSession } from "../lib/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShopSession(request);
  const menus = await listMenus(shop.id);
  return json({ menus });
}

export async function action({ request }: ActionFunctionArgs) {
  const shop = await requireShopSession(request);
  const formData = await request.formData();
  const title = formData.get("title");

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return json({ error: "Başlık gerekli" }, { status: 400 });
  }

  await createMenu(shop.id, title.trim());
  return redirect("/app/menus");
}

export default function MenusIndexRoute() {
  const { menus } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [title, setTitle] = useState("");

  const isSubmitting = navigation.state === "submitting";

  return (
    <Page title="Menüler">
      <Layout>
        <Layout.Section>
          <Card title="Yeni menü oluştur" sectioned>
            <Form method="post">
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <TextField
                  name="title"
                  value={title}
                  onChange={setTitle}
                  labelHidden
                  label="Başlık"
                  autoComplete="off"
                  placeholder="Örn: Ana Menü"
                />
                <Button primary submit loading={isSubmitting}>
                  Oluştur
                </Button>
              </div>
              {actionData?.error ? (
                <Text as="p" tone="critical" variant="bodySm">
                  {actionData.error}
                </Text>
              ) : null}
            </Form>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card title="Mevcut menüler">
            <ResourceList
              resourceName={{ singular: "menu", plural: "menüler" }}
              items={menus}
              emptyState={<Text as="p">Henüz menü yok.</Text>}
              renderItem={(menu) => (
                <ResourceItem id={String(menu.id)} url={`/app/menus/${menu.id}`}>
                  <Text variant="bodyMd" as="h3">
                    {menu.title}
                  </Text>
                  <div style={{ color: "#6d7175" }}>
                    {menu.status} · Son güncelleme{" "}
                    {new Date(menu.updatedAt).toLocaleString()}
                  </div>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
