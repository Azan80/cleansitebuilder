import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - CleanSiteBuilder",
    description: "Log in to your CleanSiteBuilder account to continue building.",
    alternates: {
        canonical: '/login',
    },
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
