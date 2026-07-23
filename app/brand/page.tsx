import { BrandLogoShowcase } from "@/components/brand-logo-showcase";

export const metadata = {
  title: "Brand Guidelines & Logo — StoXify",
  description: "Official logo variants and brand color specifications for StoXify.",
};

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-8">
      <BrandLogoShowcase />
    </main>
  );
}
