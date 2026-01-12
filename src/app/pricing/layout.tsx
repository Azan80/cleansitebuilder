import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing - CleanSiteBuilder",
    description: "Start for free. Upgrade to get the capacity that exactly matches your needs.",
    alternates: {
        canonical: '/pricing',
    },
};

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
