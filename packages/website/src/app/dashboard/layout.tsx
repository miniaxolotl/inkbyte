import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Dashboard",
  "Manage your InkByte links and review private click reports in your account.",
);
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
