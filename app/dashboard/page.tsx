import { redirect } from "next/navigation";

export default function DashboardRedirectPage() {
  redirect("/trader/dashboard");
}
