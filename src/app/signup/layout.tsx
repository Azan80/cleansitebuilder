import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create your account - CleanSiteBuilder",
    description: "Create account for CleanSiteBuilder and start building AI-powered websites.",
};

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
