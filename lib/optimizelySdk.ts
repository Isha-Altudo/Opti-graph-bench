import { GraphClient } from "@optimizely/cms-sdk";

let client: GraphClient | null = null;

function getClient() {
  if (client) return client;

  const key = process.env.OPTIMIZELY_SINGLE_KEY;
  if (!key) {
    throw new Error("Missing OPTIMIZELY_SINGLE_KEY");
  }

  const base = process.env.OPTIMIZELY_API_URL;

  client = new GraphClient(
    key,
    base ? { graphUrl: base } : undefined,
  );

  return client;
}

export async function sdkFetch(
  query: string,
  variables: Record<string, unknown> = {},
) {
  const data = await getClient().request(
    query,
    variables,
    undefined,
    false
  );

  return {
    data,
    bytes: Buffer.byteLength(JSON.stringify(data), "utf8"),
  };
}