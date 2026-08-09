import { createClient } from "@nhost/nhost-js";

const nhostSubdomain = import.meta.env.VITE_NHOST_SUBDOMAIN;
const nhostRegion = import.meta.env.VITE_NHOST_REGION;

if (!nhostSubdomain) {
  throw new Error(
    "Missing required environment variable: VITE_NHOST_SUBDOMAIN",
  );
}

if (!nhostRegion) {
  throw new Error("Missing required environment variable: VITE_NHOST_REGION");
}

let nhost: ReturnType<typeof createClient>;

try {
  nhost = createClient({
    subdomain: nhostSubdomain,
    region: nhostRegion,
  });
} catch (error) {
  throw new Error(
    `Failed to initialize Nhost client: ${
      error instanceof Error ? error.message : String(error)
    }`,
    { cause: error },
  );
}

export { nhost };
