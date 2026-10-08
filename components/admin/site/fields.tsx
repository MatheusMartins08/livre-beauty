"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, Trash, UploadSimple } from "@phosphor-icons/react";
import type { EditorialTitle } from "@/content/home";
import { discardUploads, uploadSiteImage } from "@/lib/image-upload";
import {
  acceptedImageTypes,
  DEFAULT_POSITION,
  splitPosition,
  type MediaFolder,
} from "@/lib/media";
import type { EditorResult } from "@/lib/site-actions";

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object")
    return Object.values(value).flatMap(stringsIn);
  return [];
}

/** Uploads not saved yet; they are removed if the owner discards the change. */
export function useUploads() {
  const pending = useRef(new Set<string>());
  useEffect(() => {
    const uploads = pending.current;
    return () => {
      if (uploads.size) void discardUploads([...uploads]);
    };
  }, []);
  return {
    add(url: string, replaced?: string) {
      if (replaced && pending.current.delete(replaced))
        void discardUploads([replaced]);
      pending.current.add(url);
    },
    /** After a save, uploads that did not end up in the saved value are removed. */
    commit(saved: unknown) {
      const used = new Set(stringsIn(saved));
      const unused = [...pending.current].filter((url) => !used.has(url));
      pending.current.clear();
      void discardUploads(unused);
    },
    discard() {
      const urls = [...pending.current];
      pending.current.clear();
      void discardUploads(urls);
    },
  };
}
export type Uploads = ReturnType<typeof useUploads>;

export function EditorFeedback({ result }: { result: EditorResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p className="lb-feedback" role="status">
      {result.message}
    </p>
  ) : (
    <p className="lb-form-error" role="alert">
      {result.message}
    </p>
  );
}

export function TextField({
  label,
  value,
  onChange,
  max,
  required = true,
  multiline = false,
  rows = 3,
  help,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  help?: string;
  type?: "text" | "url" | "tel";
  placeholder?: string;
}) {
  const helpId = useId();
  const props = {
    value,
    required,
    maxLength: max,
    placeholder,
    "aria-describedby": help ? helpId : undefined,
  };
  return (
    <label className="lb-field">
      <span>
        {label}
        {!required && <span className="lb-optional"> · opcional</span>}
      </span>
      {multiline ? (
        <textarea
          {...props}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...props}
          type={type}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {help && (
        <small id={helpId} className="lb-help">
          {help}
        </small>
      )}
    </label>
  );
}

/** Editorial titles: opening, optional middle words and the italic emphasis. */
export function TitleField({
  label,
  value,
  onChange,
  withLeading = true,
}: {
  label: string;
  value: EditorialTitle;
  onChange: (value: EditorialTitle) => void;
  withLeading?: boolean;
}) {
  return (
    <fieldset className="lb-fieldset">
      <legend>{label}</legend>
      <div className="lb-form-grid lb-form-grid-3">
        <TextField
          label="Início"
          value={value.opening}
          max={60}
          onChange={(opening) => onChange({ ...value, opening })}
        />
        {withLeading && (
          <TextField
            label="Meio"
            required={false}
            value={value.leading ?? ""}
            max={40}
            onChange={(leading) =>
              onChange({ ...value, leading: leading || undefined })
            }
          />
        )}
        <TextField
          label="Destaque em itálico"
          value={value.emphasis}
          max={60}
          onChange={(emphasis) => onChange({ ...value, emphasis })}
        />
      </div>
    </fieldset>
  );
}

export interface PhotoValue {
  src: string;
  alt: string;
  position: string;
}

/**
 * Upload, framing and description of one photo. position "" means the layout's
 * own framing; fields without that option always store a position.
 */
export function PhotoField({
  label,
  value,
  onChange,
  folder,
  uploads,
  alt = "required",
  allowLayoutPosition = false,
  aspect = "4 / 3",
}: {
  label: string;
  value: PhotoValue;
  onChange: (value: PhotoValue) => void;
  folder: MediaFolder;
  uploads: Uploads;
  alt?: "required" | "optional" | "none";
  allowLayoutPosition?: boolean;
  aspect?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputId = useId();
  const [x, y] = splitPosition(value.position || DEFAULT_POSITION);
  const setPosition = (nextX: number, nextY: number) =>
    onChange({ ...value, position: `${nextX}% ${nextY}%` });

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadSiteImage(file, folder);
      uploads.add(url, value.src);
      onChange({ ...value, src: url });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a imagem.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="lb-fieldset lb-photo-field">
      <legend>{label}</legend>
      <div className="lb-photo-layout">
        <div
          className="lb-photo-preview"
          style={{
            aspectRatio: aspect,
            backgroundImage: value.src ? `url("${value.src}")` : undefined,
            backgroundPosition: value.position || DEFAULT_POSITION,
          }}
          role="img"
          aria-label={value.src ? `Prévia: ${value.alt || label}` : "Sem foto"}
        >
          {!value.src && <span>Envie uma foto</span>}
        </div>
        <div className="lb-photo-controls">
          <label htmlFor={inputId} className="lb-button lb-upload-button">
            <UploadSimple size={17} aria-hidden="true" />
            {busy ? "Enviando…" : value.src ? "Trocar foto" : "Enviar foto"}
          </label>
          <input
            id={inputId}
            className="lb-sr-only"
            type="file"
            accept={acceptedImageTypes.join(",")}
            disabled={busy}
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <small className="lb-help">
            JPG, PNG, WebP ou AVIF. Fotos grandes são reduzidas antes do envio.
          </small>
          {error && (
            <p className="lb-form-error" role="alert">
              {error}
            </p>
          )}
          {alt !== "none" && (
            <TextField
              label="Descrição da foto"
              required={alt === "required"}
              value={value.alt}
              max={200}
              onChange={(nextAlt) => onChange({ ...value, alt: nextAlt })}
              help="Lida por leitores de tela. Descreva o que aparece na imagem."
            />
          )}
          {allowLayoutPosition && (
            <Checkbox
              label="Usar o enquadramento do layout"
              checked={!value.position}
              onChange={(checked) =>
                onChange({ ...value, position: checked ? "" : DEFAULT_POSITION })
              }
            />
          )}
          {(!allowLayoutPosition || value.position) && (
            <div className="lb-form-grid lb-form-grid-2">
              <label className="lb-field">
                Enquadramento horizontal
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={x}
                  onChange={(event) => setPosition(Number(event.target.value), y)}
                />
              </label>
              <label className="lb-field">
                Enquadramento vertical
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={y}
                  onChange={(event) => setPosition(x, Number(event.target.value))}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </fieldset>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  note,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <label className={`lb-check${disabled ? " lb-check-disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        {label}
        {note && <small>{note}</small>}
      </span>
    </label>
  );
}

/** Move and remove controls for one item of an ordered list. */
export function ListItemActions({
  label,
  index,
  length,
  onMove,
  onRemove,
  disabled = false,
}: {
  label: string;
  index: number;
  length: number;
  onMove: (from: number, to: number) => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="lb-item-actions">
      <button
        type="button"
        className="lb-icon-button"
        aria-label={`Subir ${label}`}
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUp size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="lb-icon-button"
        aria-label={`Descer ${label}`}
        disabled={disabled || index === length - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDown size={17} aria-hidden="true" />
      </button>
      {onRemove && (
        <button
          type="button"
          className="lb-icon-button"
          aria-label={`Remover ${label}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash size={17} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
