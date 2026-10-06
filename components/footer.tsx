import Link from "next/link";
import { site, navigation } from "@/content/salon";
import { ButtonLink, TextLink } from "@/components/ui";
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
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
              <Link href="/#faq-title" className="nav-link">
                Perguntas frequentes
              </Link>
            </nav>
          </div>
          <div className="footer-contact">
            <h2>Encontre seu tempo</h2>
            <p>{site.location}</p>
            <p>{site.hours}</p>
            <TextLink href="/#visite-title">Conhecer o espaço</TextLink>
            <ButtonLink href="/agendamento" light compact>
              Agendar horário
            </ButtonLink>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Livre Beauty.
          </p>
          <nav aria-label="Informações legais">
            <Link href="/privacidade" className="nav-link">Privacidade</Link>
            <Link href="/termos" className="nav-link">Termos</Link>
            <Link href="/politicas" className="nav-link">Políticas do salão</Link>
            <Link href="/painel/entrar" className="nav-link">Área da equipe</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
