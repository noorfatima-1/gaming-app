/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["shared"],
  experimental: {
    instrumentationHook: true,
  },
};

// Only wrap with Sentry if the DSN is configured
let config = nextConfig;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = await import("@sentry/nextjs");
  config = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  }, {
    hideSourceMaps: true,
    disableLogger: true,
  });
}

export default config;
