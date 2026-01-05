type ContactEmailPayload = {
  shop: string;
  menuId?: number | null;
  menuName?: string | null;
  menuItemId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
};

const buildContactEmailText = (payload: ContactEmailPayload) => {
  const lines = [
    `Shop: ${payload.shop}`,
    payload.menuName ? `Menu: ${payload.menuName} (#${payload.menuId ?? "?"})` : null,
    payload.menuItemId ? `Menu item: ${payload.menuItemId}` : null,
    payload.name ? `Name: ${payload.name}` : null,
    payload.email ? `Email: ${payload.email}` : null,
    payload.phone ? `Phone: ${payload.phone}` : null,
    "",
    "Message:",
    payload.message || "",
  ];
  return lines.filter(Boolean).join("\n");
};

export const sendContactEmail = async (payload: ContactEmailPayload) => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.warn("Contact email skipped: RESEND_API_KEY or CONTACT_TO_EMAIL is missing.");
    return { ok: false, skipped: true };
  }

  const from = process.env.CONTACT_FROM_EMAIL || to;
  const subjectPrefix = process.env.CONTACT_EMAIL_SUBJECT_PREFIX || "MenuCraft contact";
  const subject = `${subjectPrefix} - ${payload.shop}`;
  const text = buildContactEmailText(payload);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send contact email: ${response.status} ${body}`);
  }

  return { ok: true };
};
