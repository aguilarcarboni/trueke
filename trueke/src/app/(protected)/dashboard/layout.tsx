import "../../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Dashboard",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="bg-background flex text-background p-5 h-full w-full scroll-smooth">
    {children}
    </div>
  )
}