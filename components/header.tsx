"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, List } from "@phosphor-icons/react";
import { navigation } from "@/content/salon";
import { Dialog } from "@/components/dialog";

export function Header() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";
  useEffect(() => {
    if (!isHome) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCompact(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHome]);
  const closeMenu = () => setMenuOpen(false);
  return (
    <>
      <header
        className={`site-header ${isHome && !compact ? "header-on-hero" : "header-solid"}`}
      >
        <div className="header-inner container">
          <Link href="/" className="wordmark">
            livre<span>BEAUTY ATELIÊ</span>
          </Link>
          <nav className="desktop-nav" aria-label="Navegação principal">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/agendamento" className="header-book">
            Agendar horário
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="menu-trigger icon-button"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
          >
            <List size={27} weight="light" />
          </button>
        </div>
      </header>
      <Dialog
        open={menuOpen}
        onClose={closeMenu}
        label="Menu de navegação"
        className="mobile-menu"
      >
        <p className="wordmark menu-brand">
          livre<span>BEAUTY ATELIÊ</span>
        </p>
        <nav aria-label="Navegação mobile">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
              <ArrowUpRight size={23} aria-hidden="true" />
            </Link>
          ))}
        </nav>
        <Link href="/agendamento" className="button" onClick={closeMenu}>
          Agendar horário
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <p className="fine-print">
          Beleza com liberdade. Cuidado com intenção.
        </p>
      </Dialog>
    </>
  );
}
