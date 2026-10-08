"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Panel } from "@/components/admin/ui";
import {
  defaultSiteContent,
  type SiteContent,
  type SiteSectionKey,
} from "@/lib/site-content";
import {
  resetSiteSection,
  saveSiteSection,
  type EditorResult,
} from "@/lib/site-actions";
import { EditorFeedback, useUploads, type Uploads } from "./fields";

const unexpected: EditorResult = {
  ok: false,
  message: "Não foi possível concluir. Suas alterações foram mantidas; tente novamente.",
};

/** One editable section of site_content, saved and published as a whole. */
export function SectionForm<K extends SiteSectionKey>({
  sectionKey,
  title,
  description,
  initial,
  saved,
  children,
}: {
  sectionKey: K;
  title: string;
  description: string;
  initial: SiteContent[K];
  saved: boolean;
  children: (
    value: SiteContent[K],
    update: (next: SiteContent[K]) => void,
    uploads: Uploads,
  ) => ReactNode;
}) {
  const [value, setValue] = useState(initial);
  const [result, setResult] = useState<EditorResult | null>(null);
  const [pending, setPending] = useState(false);
  const uploads = useUploads();

  async function run(action: () => Promise<EditorResult>, after?: () => void) {
    setPending(true);
    setResult(null);
    try {
      const outcome = await action();
      setResult(outcome);
      if (outcome.ok) after?.();
    } catch {
      setResult(unexpected);
    } finally {
      setPending(false);
    }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    void run(
      () => saveSiteSection(sectionKey, value),
      () => uploads.commit(value),
    );
  }
  function restore() {
    if (
      pending ||
      !window.confirm("Voltar ao texto e às fotos originais desta seção?")
    )
      return;
    void run(
      () => resetSiteSection(sectionKey),
      () => {
        uploads.discard();
        setValue(defaultSiteContent[sectionKey]);
      },
    );
  }
  function discard() {
    uploads.discard();
    setValue(initial);
    setResult(null);
  }

  return (
    <Panel
      title={title}
      description={description}
      action={
        <span className="lb-badge lb-badge-neutral">
          {saved ? "Personalizado" : "Texto original"}
        </span>
      }
    >
      <form className="lb-form lb-editor-body" onSubmit={save} aria-busy={pending}>
        {children(value, (next) => setValue(next), uploads)}
        <EditorFeedback result={result} />
        <div className="lb-form-actions">
          {saved && (
            <button
              type="button"
              className="lb-text-button"
              onClick={restore}
              disabled={pending}
            >
              Restaurar original
            </button>
          )}
          <button
            type="button"
            className="lb-button"
            onClick={discard}
            disabled={pending}
          >
            Descartar alterações
          </button>
          <button
            type="submit"
            className="lb-button lb-button-primary"
            disabled={pending}
          >
            {pending ? "Publicando…" : "Salvar e publicar"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
