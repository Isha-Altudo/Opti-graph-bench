import { runHarness } from "@/lib/timingHarness";
import { sdkFetch } from "@/lib/optimizelySdk";

export async function GET(request: Request) {
  return runHarness(request, sdkFetch, "sdk");
}