import type { Metadata } from "next";
import localFont from "next/font/local";
import { site } from "@/content/salon";
import { siteUrl, salonStructuredData } from "@/lib/metadata";
import { SiteShell } from "@/components/site-shell";
import { Footer } from "@/components/footer";
import { ContactProvider } from "@/components/contact-provider";
import "./globals.css";

const geistSans = localFont({
  src: "../public/fonts/geist.woff2",
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
});
const editorial = localFont({
  src: [
    {
      path: "../public/fonts/cormorant-garamond.woff2",
      weight: "300 700",
      style: "normal",
    },
    {
      path: "../public/fonts/cormorant-garamond-italic.woff2",
      weight: "300 700",
      style: "italic",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Livre Beauty · A beleza de ser você",
    template: "%s | Livre Beauty",
  },
  description: site.description,
  robots: { index: !site.isDemo, follow: !site.isDemo },
  applicationName: site.name,
  openGraph: {
    title: site.name,
    description: site.description,
    locale: "pt_BR",
    type: "website",
    images: ["/images/hero-salon.jpg"],
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = salonStructuredData();
  const digits = process.env.WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  const recipient = /^[1-9]\d{9,14}$/.test(digits) ? digits : "";
  const whatsappHref = `https://wa.me/${recipient}?text=${encodeURIComponent(
    "Olá, equipe Livre Beauty! Vim pelo site e gostaria de conversar sobre os cuidados e os horários disponíveis.",
  )}`;
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${editorial.variable} antialiased`}
    >
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <ContactProvider href={whatsappHref}>
          <SiteShell footer={<Footer />}>
            <main id="conteudo">{children}</main>
          </SiteShell>
        </ContactProvider>
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
            }}
          />
        )}
      </body>
    </html>
  );
}
