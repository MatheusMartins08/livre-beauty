"use client";

import Link from "next/link";

export default function PageError({ retry }: { retry: () => void }) {
  return (
    <section className="container section-pad" aria-labelledby="page-error">
      <h1 id="page-error">Não foi possível carregar esta página.</h1>
      <p role="alert">Tente novamente em instantes.</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <button type="button" className="button" onClick={retry}>
          Tentar novamente
        </button>
        <Link href="/" className="button button-secondary">
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
