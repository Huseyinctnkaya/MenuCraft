import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const email = payload.customer?.email as string | undefined;
  if (email) {
    await db.contactSubmission.deleteMany({ where: { shop, email } });
  }

  return new Response();
};
