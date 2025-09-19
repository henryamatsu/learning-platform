import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MainLayout } from "../components/layout/MainLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LearnAI - AI-Powered Learning App",
  description:
    "Transform YouTube videos into structured learning experiences with AI-generated lessons and quizzes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
