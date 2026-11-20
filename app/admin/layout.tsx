import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NutBytes admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
