import "../../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Marketplace",
    description: "Marketplace",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-background scroll-smooth">
      {children}
    </div>
  )
}
