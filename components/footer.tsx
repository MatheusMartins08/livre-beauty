import Link from "next/link";
import { site, navigation, services } from "@/content/salon";
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
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/faq">Perguntas frequentes</Link>
            </nav>
          </div>
          <div>
            <h2>Cuidado</h2>
            <nav aria-label="Serviços do rodapé">
              {services.map((service) => (
                <Link key={service.id} href={`/servicos/${service.slug}`}>
                  {service.category}
                </Link>
              ))}
            </nav>
          </div>
          <div className="footer-contact">
            <h2>Encontre seu tempo</h2>
            <p>{site.location}</p>
            <p>{site.hours}</p>
            <Link href="/contato" className="text-link">
              Conhecer o espaço
            </Link>
            <Link href="/agendamento" className="text-link">
              Agendar horário
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Livre Beauty. Projeto demonstrativo.
          </p>
          <nav aria-label="Informações legais">
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
            <Link href="/politicas">Políticas do salão</Link>
          </nav>
        </div>
        <p className="footer-demo">
          Marca e equipe fictícias. Imagens ilustrativas. Agendamentos e
          mensagens são simulados.
        </p>
      </div>
    </footer>
  );
}
