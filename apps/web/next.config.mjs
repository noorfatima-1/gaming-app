import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["shared"],
  experimental: {
    instrumentationHook: true,
  },
};

export default withSentryConfig(nextConfig, {
  // Only upload source maps if Sentry auth token is set
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
}, {
  hideSourceMaps: true,
  disableLogger: true,
});
