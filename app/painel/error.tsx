"use client";

export default function PanelError({ retry }: { retry: () => void }) {
  return (
    <section className="lb-access">
      <div className="lb-access-card">
        <h1>Não foi possível abrir o painel.</h1>
        <p role="alert">
          Tente novamente em instantes. Seus dados continuam salvos.
        </p>
        <button className="lb-button lb-button-primary" onClick={retry}>
          Tentar novamente
        </button>
      </div>
    </section>
  );
}
