import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AudioProvider } from "@/components/AudioProvider";
import { GlitchOverlay } from "@/components/GlitchOverlay";
import { TutorialOverlay } from "@/components/TutorialOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AURACS — Crônicas da Nebulosa",
  description: "Um jogo narrativo onde você programa em C# para salvar sua nave. Aprenda a programar enquanto desvenda os mistérios da Nebulosa.",
  openGraph: {
    title: "AURACS — Crônicas da Nebulosa",
    description: "Aprenda C# em uma aventura espacial interativa.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AudioProvider>
          <div className="noise-overlay" />
          <GlitchOverlay />
          <TutorialOverlay />
          {children}
          <Toaster 
            position="top-right" 
            theme="dark" 
            toastOptions={{
              style: {
                background: '#0c0c0c',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontFamily: 'monospace'
              }
            }}
          />
        </AudioProvider>
      </body>
    </html>
  );
}
