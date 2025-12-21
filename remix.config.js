/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "cjs",
  serverPlatform: "node",
  appDirectory: "app",
  serverDependenciesToBundle: [
    /^@shopify\/polaris/,
    /^@shopify\/app-bridge-react/,
    /^@shopify\/app-bridge-utils/,
    /^@shopify\/shopify-api/
  ],
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true
  }
};
