import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

type AppSubscriptionPayload = {
  id?: string | number;
  admin_graphql_api_id?: string;
  name?: string;
  status?: string;
  test?: boolean;
  trial_days?: number;
  trialDays?: number;
  current_period_end?: string;
  currentPeriodEnd?: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const subscription =
    (payload as { app_subscription?: AppSubscriptionPayload }).app_subscription ??
    (payload as { appSubscription?: AppSubscriptionPayload }).appSubscription ??
    (payload as AppSubscriptionPayload);

  if (!subscription) {
    return new Response();
  }

  const subscriptionId = subscription.admin_graphql_api_id ?? subscription.id?.toString();
  const planName = subscription.name ?? null;
  const status = subscription.status ?? null;
  const test = subscription.test ?? false;
  const trialDays = subscription.trial_days ?? subscription.trialDays ?? null;
  const currentPeriodEndRaw = subscription.current_period_end ?? subscription.currentPeriodEnd;
  const currentPeriodEnd = currentPeriodEndRaw ? new Date(currentPeriodEndRaw) : null;

  await prisma.billingSubscription.upsert({
    where: { shop },
    update: {
      subscriptionId,
      planName,
      status,
      test,
      trialDays,
      currentPeriodEnd,
    },
    create: {
      shop,
      subscriptionId,
      planName,
      status,
      test,
      trialDays,
      currentPeriodEnd,
    },
  });

  return new Response();
};
