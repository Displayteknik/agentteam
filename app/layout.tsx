import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GripCoaching Agent Team",
  description:
    "Ditt AI-drivna marketing team – 6 specialiserade agenter redo att arbeta för dig dygnet runt.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
