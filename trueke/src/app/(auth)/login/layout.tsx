import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign In",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="flex flex-col scrollbar-hide h-full w-full scroll-smooth">
      {children}
    </div>
  );
}