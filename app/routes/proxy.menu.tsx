import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import crypto from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import prisma from "../db.server";
import shopify from "../shopify.server";
import { ICON_LIBRARY_BY_ID } from "../menu-builder/icons";



export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, shop } = (await shopify.authenticate.public.appProxy(request)) as any;

    const url = new URL(request.url);

    const menu = await prisma.menu.findFirst({
      where: { shop, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
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

      // Icon Collection - render the same lucide-react icons the builder uses
      // so the storefront matches the admin exactly instead of guessing a
      // lucide-static filename over an unpinned CDN.
      const iconMap: Record<string, string> = {};
      const traverseIcons = (list: any[]) => {
        for (const item of list) {
          if (item.icon && item.icon.startsWith("lucide:") && !iconMap[item.icon]) {
            const id = item.icon.slice("lucide:".length);
            const option = ICON_LIBRARY_BY_ID[id];
            iconMap[item.icon] = option
              ? renderToStaticMarkup(React.createElement(option.Icon, { strokeWidth: 1.6 }))
              : `https://unpkg.com/lucide-static@latest/icons/${id}.svg`;
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
