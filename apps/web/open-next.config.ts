import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// The whole site is prerendered (SSG) with no runtime revalidation, so serve the
// cached pages straight from the Workers static assets — no R2/KV binding needed.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
