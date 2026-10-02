"use client";
import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, MapPin } from "@phosphor-icons/react";
type Fields = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};
const empty: Fields = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};
export function ContactForm() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>(
    {},
  );
  const [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false),
    [submitError, setSubmitError] = useState("");
  const guard = useRef(false),
    form = useRef<HTMLFormElement>(null);
  const update = (key: keyof Fields, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.current) return;
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!values.name.trim()) next.name = "Informe seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "Informe um e-mail válido.";
    if (!values.subject) next.subject = "Escolha um assunto.";
    if (!values.message.trim()) next.message = "Escreva sua mensagem.";
    if (Object.keys(next).length) {
      setErrors(next);
      form.current
        ?.querySelector<HTMLElement>(`#contact-${Object.keys(next)[0]}`)
        ?.focus();
      return;
    }
    guard.current = true;
    setBusy(true);
    setSubmitError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setSuccess(true);
    } catch {
      setSubmitError("Não foi possível concluir a simulação. Tente novamente.");
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="contact-success surface-panel" role="status">
        <Check size={36} weight="light" aria-hidden="true" />
        <h2
          tabIndex={-1}
          ref={(element) => {
            element?.focus();
          }}
        >
          Mensagem simulada
        </h2>
        <p>Obrigada por experimentar o contato do Livre Beauty.</p>
        <p>Nenhuma mensagem foi enviada e seus dados não foram armazenados.</p>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            setSuccess(false);
            setValues(empty);
            requestAnimationFrame(() =>
              document.getElementById("contact-name")?.focus(),
            );
          }}
        >
          Escrever outra mensagem
          <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </div>
    );
  const field = (
    key: "name" | "phone" | "email",
    label: string,
    type = "text",
    autoComplete?: string,
  ) => (
    <div className="field">
      <label htmlFor={`contact-${key}`}>
        {label}
        {key === "phone" && <span> (opcional)</span>}
      </label>
      <input
        id={`contact-${key}`}
        type={type}
        autoComplete={autoComplete}
        value={values[key]}
        onChange={(event) => update(key, event.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `contact-${key}-error` : undefined}
        disabled={busy}
      />
      {errors[key] && (
        <p className="form-error" id={`contact-${key}-error`}>
          {errors[key]}
        </p>
      )}
    </div>
  );
  return (
    <form
      className="contact-form"
      ref={form}
      onSubmit={submit}
      noValidate
      aria-busy={busy}
    >
      <div className="form-grid">
        {field("name", "Nome", "text", "name")}
        {field("email", "E-mail", "email", "email")}
        {field("phone", "Telefone", "tel", "tel")}
        <div className="field">
          <label htmlFor="contact-subject">Assunto</label>
          <select
            id="contact-subject"
            value={values.subject}
            onChange={(event) => update("subject", event.target.value)}
            aria-invalid={!!errors.subject}
            aria-describedby={
              errors.subject ? "contact-subject-error" : undefined
            }
            disabled={busy}
          >
            <option value="">Selecione um assunto</option>
            <option value="servicos">Serviços e cuidados</option>
            <option value="agendamento">Agendamento</option>
            <option value="outros">Outros assuntos</option>
          </select>
          {errors.subject && (
            <p className="form-error" id="contact-subject-error">
              {errors.subject}
            </p>
          )}
        </div>
      </div>
      <div className="field">
        <label htmlFor="contact-message">Mensagem</label>
        <textarea
          id="contact-message"
          rows={5}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          disabled={busy}
        />
        {errors.message && (
          <p className="form-error" id="contact-message-error">
            {errors.message}
          </p>
        )}
      </div>
      <p className="demo-note">
        Este formulário é demonstrativo. Nenhuma mensagem será enviada ou
        armazenada.
      </p>
      {submitError && (
        <p role="alert" className="form-error">
          {submitError}
        </p>
      )}
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Concluindo simulação…" : "Enviar mensagem"}
        <ArrowUpRight size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
export function LocationMap() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="location-map">
      {loaded ? (
        <iframe
          title="Mapa ilustrativo da região dos Jardins, São Paulo"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-46.678%2C-23.578%2C-46.655%2C-23.555&layer=mapnik"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="map-preview">
          <MapPin size={36} weight="light" aria-hidden="true" />
          <p className="map-place">Jardins, São Paulo</p>
          <p>O cuidado tem seu lugar.</p>
          <button
            type="button"
            className="text-link"
            onClick={() => setLoaded(true)}
          >
            Explorar a região
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      <p className="demo-note">
        Localização ilustrativa. O mapa mostra a região, sem endereço de um
        estabelecimento real.
      </p>
      {loaded && (
        <a
          className="text-link"
          href="https://www.openstreetmap.org/#map=15/-23.5665/-46.6665"
          target="_blank"
          rel="noopener noreferrer"
        >
          Como chegar à região
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
