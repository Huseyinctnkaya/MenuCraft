import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`, {
    customerEmail: payload.customer?.email,
  });

  // We don't have an automated export pipeline; this request is logged
  // for manual fulfillment (contact submissions tied to the customer's
  // email, if any, are looked up in ContactSubmission by shop + email).

  return new Response();
};
