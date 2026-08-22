import { GoogleAnalytics } from "@next/third-parties/google";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalyticsBeacon() {
  if (!gaId || !gaId.startsWith("G-")) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
