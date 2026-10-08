"use client";

import { useState } from "react";
import type { EditorResult } from "@/lib/site-actions";

/** Runs one editor action at a time and keeps its message. */
export function useEditorAction() {
  const [result, setResult] = useState<EditorResult | null>(null);
  const [pending, setPending] = useState(false);
  async function run(
    action: () => Promise<EditorResult>,
    onSuccess?: (result: EditorResult) => void,
  ) {
    setPending(true);
    setResult(null);
    try {
      const outcome = await action();
      if (outcome.ok && onSuccess) onSuccess(outcome);
      else setResult(outcome);
    } catch {
      setResult({
        ok: false,
        message:
          "Não foi possível concluir. Suas alterações foram mantidas; tente novamente.",
      });
    } finally {
      setPending(false);
    }
  }
  return { result, setResult, pending, run };
}
