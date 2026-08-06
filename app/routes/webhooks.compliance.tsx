import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST": {
      // We don't have an automated export pipeline; this request is
      // logged for manual fulfillment (contact submissions tied to the
      // customer's email, if any, are looked up in ContactSubmission by
      // shop + email).
      console.log(`Data request for customer email: ${payload.customer?.email}`);
      break;
    }
    case "CUSTOMERS_REDACT": {
      const email = payload.customer?.email as string | undefined;
      if (email) {
        await db.contactSubmission.deleteMany({ where: { shop, email } });
      }
      break;
    }
    case "SHOP_REDACT": {
      await db.contactSubmission.deleteMany({ where: { shop } });
      await db.menuEvent.deleteMany({ where: { shop } });
      await db.menu.deleteMany({ where: { shop } });
      await db.billingSubscription.deleteMany({ where: { shop } });
      await db.shopPreference.deleteMany({ where: { shop } });
      await db.session.deleteMany({ where: { shop } });
      break;
    }
  }

  return new Response();
};
