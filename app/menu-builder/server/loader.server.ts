import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { DEFAULT_BUILDER_SETTINGS, buildDefaultMenuItems } from "../constants";
import type {
  BlogSummary,
  BuilderSettings,
  LatestArticleSummary,
  MenuItem,
  PageSummary,
  ProductSummary,
} from "../types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const menuIdParam = url.searchParams.get("id");
  const menuId = menuIdParam ? Number(menuIdParam) : null;

  let menu = menuId
    ? await prisma.menu.findFirst({ where: { id: menuId, shop } })
    : null;

  if (!menu) {
    // If an ID was provided but no menu was found, return an error instead of crashing
    if (menuId) {
      return json({ ok: false, error: `Menu with ID ${menuId} not found or access denied.` }, { status: 404 });
    }

    // Plan limit check removed for dev override / performance optimization
    // We already check plan in App root loader.

    const created = await prisma.menu.create({
      data: {
        shop,
        name: "Mega menu",
        status: "draft",
        items: buildDefaultMenuItems(),
        settings: DEFAULT_BUILDER_SETTINGS,
      },
    });
    menu = await prisma.menu.update({
      where: { id: created.id },
      data: { name: `Mega menu #${created.id}` },
    });
  }

  // Final check to ensure menu is not null before proceeding
  if (!menu) {
    return json({ ok: false, error: "Could not create or find menu." }, { status: 500 });
  }

  let collections: Array<{
    id: string;
    title: string;
    handle: string;
    image?: { url: string; altText?: string | null } | null;
  }> = [];
  let products: ProductSummary[] = [];
  let blogs: BlogSummary[] = [];
  let latestArticles: LatestArticleSummary[] = [];
  let pages: PageSummary[] = [];
  let menus: Array<{ id: string; title: string; handle?: string | null }> = [];


  try {
    const [pickerResponse, menuResponse] = await Promise.all([
      admin.graphql(
        `query MenuItemPicker($collectionsFirst: Int!, $productsFirst: Int!, $blogsFirst: Int!, $articlesFirst: Int!, $latestArticlesFirst: Int!, $pagesFirst: Int!) {
          collections(first: $collectionsFirst, sortKey: TITLE) {
            nodes {
              id
              title
              handle
              image {
                url
                altText
              }
            }
          }
          products(first: $productsFirst, sortKey: TITLE) {
            nodes {
              id
              title
              handle
              featuredImage {
                url
                altText
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
          blogs(first: $blogsFirst, sortKey: TITLE) {
            nodes {
              id
              title
              handle
              articles(first: $articlesFirst) {
                nodes {
                  id
                  title
                  handle
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
          articles(first: $latestArticlesFirst, sortKey: PUBLISHED_AT, reverse: true) {
            nodes {
              id
              title
              handle
              image {
                url
                altText
              }
              blog {
                handle
              }
            }
          }
          pages(first: $pagesFirst, sortKey: TITLE) {
            nodes {
              id
              title
              handle
            }
          }
        }`,
        {
          variables: {
            collectionsFirst: 20,
            productsFirst: 20,
            blogsFirst: 20,
            articlesFirst: 4,
            latestArticlesFirst: 4,
            pagesFirst: 50,
          },
        }
      ),
      admin.graphql(
        `query MenuList($menusFirst: Int!) {
          menus(first: $menusFirst) {
            nodes {
              id
              title
              handle
            }
          }
        }`,
        { variables: { menusFirst: 50 } }
      ),
    ]);

    const [pickerData, menuListData] = (await Promise.all([
      pickerResponse.json(),
      menuResponse.json(),
    ])) as any[];


    if (pickerData?.errors?.length) {
      console.error("Picker query errors", pickerData.errors);
    }
    if (menuListData?.errors?.length) {
      console.error("Menus query errors", menuListData.errors);
    }

    collections = pickerData?.data?.collections?.nodes ?? [];
    products = pickerData?.data?.products?.nodes ?? [];
    blogs = pickerData?.data?.blogs?.nodes ?? [];
    latestArticles = pickerData?.data?.articles?.nodes ?? [];
    pages = pickerData?.data?.pages?.nodes ?? [];
    menus = menuListData?.data?.menus?.nodes ?? [];

    // DEBUG: Log fetched data counts
    console.log("📊 Menu Builder Loader Data:", {
      collections: collections.length,
      products: products.length,
      pages: pages.length,
      blogs: blogs.length,
      menus: menus.length
    });
  } catch (error) {
    console.error("Failed to fetch builder data", error);
  }

  return json({
    menu: {
      id: menu.id,
      name: menu.name,
      status: menu.status,
    },
    menuItems: menu.items as MenuItem[],
    menuSettingsRaw: menu.settings as BuilderSettings | null,
    menuSettings: (menu.settings as BuilderSettings | null) ?? DEFAULT_BUILDER_SETTINGS,
    collections,
    products,
    blogs,
    latestArticles,
    pages,
    menus,
    shopDomain: shop,
  });
};
