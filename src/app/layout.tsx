import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "./components/ThemeProvider";
import BackgroundSwitcher from "./components/BackgroundSwitcher";
import { SidebarProvider } from "./context/SidebarContext";

import { UserProvider } from "./context/UserContext";
import { TokenProvider } from "./context/TokenContext";
import { ToastProvider } from "./components/toast/Notify";
import NotificationListener from "./components/toast/NotificationListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NYC ERP",
  description: "NYC ERP Service Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TokenProvider>
          <UserProvider>
            <ThemeProvider>
              <BackgroundSwitcher />
              <SidebarProvider>
                <ToastProvider>
                  <NotificationListener />
                  {children}
                  <div id="react-datepicker-portal" className="fixed inset-0 z-[9999] pointer-events-none" />
                </ToastProvider>
              </SidebarProvider>
            </ThemeProvider>
          </UserProvider>
        </TokenProvider>
      </body>
    </html>
  );
}