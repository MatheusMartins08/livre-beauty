import Link from "next/link";
import { site, navigation } from "@/content/salon";
import { ActionContent, ButtonLink } from "@/components/ui";
import { DemoChannel } from "@/components/demo-channel";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="wordmark">
              livre<span>BEAUTY ATELIÊ</span>
            </Link>
            <p>{site.tagline}</p>
            <div className="footer-socials">
              <DemoChannel channel="instagram" />
              <DemoChannel channel="whatsapp" />
            </div>
          </div>
          <div>
            <h2>Explore</h2>
            <nav aria-label="Navegação do rodapé">
              {navigation.slice(1).map((item) => (
                <ButtonLink key={item.href} href={item.href}>{item.label}</ButtonLink>
              ))}
              <ButtonLink href="/#faq-title">Perguntas frequentes</ButtonLink>
            </nav>
          </div>
          <div className="footer-contact">
            <h2>Encontre seu tempo</h2>
            <p>{site.location}</p>
            <p>{site.hours}</p>
            <ButtonLink href="/#visite-title">Conhecer o espaço</ButtonLink>
            <ButtonLink href="/agendamento">Agendar horário</ButtonLink>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Livre Beauty.
          </p>
          <nav aria-label="Informações legais">
            <Link href="/privacidade" className="action-link"><ActionContent>Privacidade</ActionContent></Link>
            <Link href="/termos" className="action-link"><ActionContent>Termos</ActionContent></Link>
            <Link href="/politicas" className="action-link"><ActionContent>Políticas do salão</ActionContent></Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
