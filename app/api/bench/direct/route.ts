import { runHarness } from "@/lib/timingHarness";
import { directFetch } from "@/lib/optimizelyDirect";

export async function GET(request: Request) {
  return runHarness(request, directFetch, "direct");
}