import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { getSessionUser } from "@/lib/auth";
import SideNav from "@/components/SideNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Studio",
  description: "AI-powered generation platform",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} dark h-full antialiased`}
    >
      <head>
        {/* FOUC prevention: remove `dark` class before first paint if user chose light mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.remove('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              error: "!bg-red-950 !border-red-800/50 !text-red-200",
              success: "!bg-zinc-900 !border-white/[.08] !text-zinc-100",
            },
          }}
        />
        {user ? (
          <div className="flex min-h-screen">
            <SideNav user={user} />
            <main className="flex-1 ml-56 min-h-screen">
              {children}
            </main>
          </div>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}
