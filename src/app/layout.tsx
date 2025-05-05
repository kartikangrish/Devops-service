import { Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DevOps Service",
  description: "Manage your GitHub workflows and cron jobs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 