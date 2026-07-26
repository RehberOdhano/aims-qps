import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";

export default async function RootPage() {
  const profile = await requireUser();
  redirect(profile.role === "admin" ? "/admin" : "/dashboard");
}
