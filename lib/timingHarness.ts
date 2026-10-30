import { NextResponse } from "next/server";
import { QUERIES, type QueryName } from "@/lib/queries";

type Fetcher = (
  query: string,
  variables: Record<string, unknown>,
) => Promise<{ data: unknown; bytes: number }>;

export async function runHarness(
  request: Request,
  fetcher: Fetcher,
  path: string,
) {
  const name = (new URL(request.url).searchParams.get("query") ??
    "simple") as QueryName;

  const config = QUERIES[name];

  if (!config) {
    return NextResponse.json(
      { error: `Unknown query "${name}"` },
      { status: 400 },
    );
  }

  const start = performance.now();

  try {
    const { bytes, data } = await fetcher(
      config.query,
      config.variables,
    );

    const ms = performance.now() - start;

    return NextResponse.json({
      path,
      query: name,
      ms,
      bytes,
      data,
    });
  } catch (e) {
    return NextResponse.json(
      {
        path,
        query: name,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}