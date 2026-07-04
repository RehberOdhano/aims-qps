import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (and the
// exported function from `middleware` to `proxy`). This is the direct
// equivalent of what used to live in middleware.ts.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
