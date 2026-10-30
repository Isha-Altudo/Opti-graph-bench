
import { mkdirSync, writeFileSync } from "node:fs";

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};

const base = arg("base", "http://localhost:3000");
const runs = Number(arg("runs", 40));
const warmup = Number(arg("warmup", 3));
const rounds = Number(arg("rounds", 3));

const paths = ["direct", "sdk"];
const queries = ["simple", "complex"];

if (
  !Number.isInteger(runs) || runs < 1 ||
  !Number.isInteger(warmup) || warmup < 0 ||
  !Number.isInteger(rounds) || rounds < 1
) {
  throw new Error("Invalid benchmark configuration");
}

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(
      sorted.length - 1,
      Math.ceil((p / 100) * sorted.length) - 1
    )
  ];
}

function stats(values) {
  if (!values.length) return null;

  return {
    min: Math.min(...values),
    median: percentile(values, 50),
    p95: percentile(values, 95),
    max: Math.max(...values),
    mean: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

async function once(path, query) {
  const start = performance.now();

  const res = await fetch(
    `${base}/api/bench/${path}?query=${query}`,
    { cache: "no-store" }
  );

  const body = await res.json();
  const total = performance.now() - start;

  if (!res.ok) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return {
    upstream: body.ms,
    total,
    bytes: body.bytes,
  };
}

const results = [];

for (const query of queries) {
  const samples = {
    direct: [],
    sdk: [],
  };

  const errors = {
    direct: [],
    sdk: [],
  };

  // Warm up both implementations
  for (let i = 0; i < warmup; i++) {
    for (const path of paths) {
      try {
        await once(path, query);
      } catch (e) {
        errors[path].push(e.message);
      }
    }
  }

  // Multiple benchmark rounds
  for (let round = 0; round < rounds; round++) {
    // Alternate which implementation runs first
    const order =
      round % 2 === 0
        ? ["direct", "sdk"]
        : ["sdk", "direct"];

    for (let i = 0; i < runs; i++) {
      // Alternate request order within each round
      const iterationOrder =
        i % 2 === 0 ? order : [...order].reverse();

      for (const path of iterationOrder) {
        try {
          const result = await once(path, query);

          samples[path].push(result);

        } catch (e) {
          errors[path].push(e.message);
        }
      }

      // Small pause between iterations
      await sleep(50);
    }
  }

  for (const path of paths) {
    const entries = samples[path];

    results.push({
      path,
      query,
      expectedRuns: runs * rounds,
      successfulRuns: entries.length,
      failedRuns: errors[path].length,

      bytes: entries.length
        ? entries[0].bytes
        : null,

      bytesConsistent: entries.every(
        (r) => r.bytes === entries[0]?.bytes
      ),

      upstreamMs: stats(
        entries.map((r) => r.upstream)
      ),

      totalMs: stats(
        entries.map((r) => r.total)
      ),

      errors: errors[path],
    });
  }
}

console.table(
  results.map((r) => ({
    path: r.path,
    query: r.query,
    success: r.successfulRuns,
    failed: r.failedRuns,
    bytes: r.bytes,
    median: r.upstreamMs?.median.toFixed(2),
    p95: r.upstreamMs?.p95.toFixed(2),
    mean: r.upstreamMs?.mean.toFixed(2),
    totalMedian: r.totalMs?.median.toFixed(2),
  }))
);

mkdirSync("results", { recursive: true });

const file =
  `results/bench-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

writeFileSync(
  file,
  JSON.stringify(
    {
      base,
      runs,
      warmup,
      rounds,
      results,
    },
    null,
    2
  )
);

console.log(`Saved ${file}`);
