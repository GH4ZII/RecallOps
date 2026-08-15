import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { DemoProvider } from "@/lib/demo/store";

export const metadata: Metadata = {
  title: "RecallOps",
  description: "AI incident-response agent with persistent operational memory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DemoProvider>
          <AppShell>{children}</AppShell>
        </DemoProvider>
      </body>
    </html>
  );
}
