import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

import prisma from "../db.server";
import shopify from "../shopify.server";



export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, shop } = (await shopify.authenticate.public.appProxy(request)) as any;

    const menu = await prisma.menu.findFirst({
      where: { shop, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        items: true,
        settings: true,
      },
    });

    if (!menu) {
      return json({ ok: false, error: "No active menu found." });
    }

    // Resource Enrichment
    const resources: any = {
      products: {},
      collections: {},
      blogs: {},
    };

    try {
      const items = (menu.items as any[]) || [];
      const productIds = new Set<string>();
      const collectionIds = new Set<string>();
      const blogIds = new Set<string>();

      const traverse = (list: any[]) => {
        for (const item of list) {
          if (item.productIds?.length) item.productIds.forEach((id: string) => productIds.add(id));
          if (item.collectionIds?.length)
            item.collectionIds.forEach((id: string) => collectionIds.add(id));
          if (item.blogIds?.length) item.blogIds.forEach((id: string) => blogIds.add(id));
          if (item.children?.length) traverse(item.children);
        }
      };
      traverse(items);

      if (productIds.size > 0 || collectionIds.size > 0 || blogIds.size > 0) {

        // Fetch Products
        if (productIds.size > 0) {
          const query = `
          query GetProducts($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                title
                handle
                featuredImage {
                  url
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        `;
          const response = await admin.graphql(query, {
            variables: { ids: Array.from(productIds) },
          });
          const data: any = await response.json();
          (data.data?.nodes || []).forEach((p: any) => {
            if (p) resources.products[p.id] = p;
          });
        }

        // Fetch Collections
        if (collectionIds.size > 0) {
          const query = `
          query GetCollections($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Collection {
                id
                title
                handle
                image {
                  url
                }
              }
            }
          }
        `;
          const response = await admin.graphql(query, {
            variables: { ids: Array.from(collectionIds) },
          });
          const data: any = await response.json();
          (data.data?.nodes || []).forEach((c: any) => {
            if (c) resources.collections[c.id] = c;
          });
        }

        // Fetch Blogs & Articles
        if (blogIds.size > 0) {
          const query = `
          query GetBlogs($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Blog {
                id
                title
                handle
                articles(first: 3) {
                  nodes {
                    id
                    title
                    handle
                    image {
                      url
                    }
                  }
                }
              }
            }
          }
        `;
          const response = await admin.graphql(query, {
            variables: { ids: Array.from(blogIds) },
          });
          const data: any = await response.json();
          (data.data?.nodes || []).forEach((b: any) => {
            if (b) resources.blogs[b.id] = b;
          });
        }
      }

      // Icon Collection
      const iconMap: Record<string, string> = {};
      const traverseIcons = (list: any[]) => {
        for (const item of list) {
          if (item.icon && (item.icon.startsWith("lucide:") || item.icon.startsWith("polaris:"))) {
            const id = item.icon.split(":")[1];
            if (item.icon.startsWith("lucide:")) {
              iconMap[item.icon] = `https://unpkg.com/lucide-static@latest/icons/${id}.svg`;
            } else {
              // Polaris fallback - they don't have a simple static icon CDN like Lucide
              // We'll use a placeholder or handle it in the script
            }
          }
          if (item.children?.length) traverseIcons(item.children);
        }
      };
      traverseIcons(items);
      resources.icons = iconMap;
    } catch (error) {
      console.error("Resource enrichment failed:", error);
    }

    return json({ ok: true, menu, resources });
  } catch (error: any) {
    console.error("App Proxy Loader Error:", error);
    return json({ ok: false, error: error.message || "Unknown proxy error" }, { status: 401 });
  }
};
