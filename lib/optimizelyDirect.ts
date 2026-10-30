export async function directFetch(
  query: string,
  variables: Record<string, unknown> = {},
) {
  const url = process.env.OPTIMIZELY_API_URL;
  const key = process.env.OPTIMIZELY_SINGLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Graph configuration");
  }

  const endpoint = new URL(url);

  endpoint.searchParams.set("cache", "false");

  const res = await fetch(endpoint.toString(), {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `epi-single ${key}`,
    },

    body: JSON.stringify({
      query,
      variables,
    }),

    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Graph ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = JSON.parse(text);

  if (json.errors) {
    throw new Error(
      `GraphQL errors: ${JSON.stringify(json.errors).slice(0, 300)}`
    );
  }

  return {
    data: json.data,
    bytes: Buffer.byteLength(JSON.stringify(json.data), "utf8"),
  };
}