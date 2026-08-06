import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await db.contactSubmission.deleteMany({ where: { shop } });
  await db.menuEvent.deleteMany({ where: { shop } });
  await db.menu.deleteMany({ where: { shop } });
  await db.billingSubscription.deleteMany({ where: { shop } });
  await db.shopPreference.deleteMany({ where: { shop } });
  await db.session.deleteMany({ where: { shop } });

  return new Response();
};
