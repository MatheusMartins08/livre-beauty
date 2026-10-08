"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import {
  formatCurrencyInput,
  formatCurrencyValue,
  formatPhoneInput,
  parseCurrencyInput,
} from "@/lib/input-masks";

type MaskedInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "value" | "defaultValue" | "onChange" | "maxLength"
> & {
  mask: "phone" | "currency";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function MaskedInput({
  mask,
  value,
  defaultValue = "",
  onValueChange,
  onKeyDown,
  onBlur,
  ...props
}: MaskedInputProps) {
  const format = mask === "phone" ? formatPhoneInput : formatCurrencyInput;
  const [internalValue, setInternalValue] = useState(() => format(defaultValue));
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const displayedValue = format(value ?? internalValue);
  const isEditable = (character: string) =>
    (mask === "phone" ? /\d/ : /[\d,-]/).test(character);

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  });

  function update(input: HTMLInputElement, raw: string, caret: number) {
    const formatted = format(raw);
    const count = [...format(raw.slice(0, caret))].filter(isEditable).length;
    let position = 0;
    let seen = 0;
    while (position < formatted.length && seen < count) {
      if (isEditable(formatted[position])) seen++;
      position++;
    }
    // Keep typing at the end when the user appends or pastes a complete value.
    if (caret === raw.length) position = formatted.length;
    pendingCaret.current = position;
    input.value = formatted;
    input.setSelectionRange(position, position);
    setInternalValue(formatted);
    onValueChange?.(formatted);
  }

  return (
    <input
      {...props}
      ref={inputRef}
      type={mask === "phone" ? "tel" : "text"}
      inputMode={mask === "phone" ? "tel" : "decimal"}
      value={displayedValue}
      onChange={(event) => {
        const input = event.currentTarget;
        let raw = input.value;
        let caret = input.selectionStart ?? raw.length;
        const inputType = (event.nativeEvent as InputEvent).inputType;
        // Virtual keyboards may delete separators without firing a keydown event.
        if (
          raw.length < displayedValue.length &&
          format(raw) === displayedValue &&
          (inputType === "deleteContentBackward" || inputType === "deleteContentForward")
        ) {
          const direction = inputType === "deleteContentBackward" ? -1 : 1;
          let index = direction === -1 ? caret - 1 : caret;
          while (index >= 0 && index < raw.length && !isEditable(raw[index])) index += direction;
          if (index >= 0 && index < raw.length) {
            raw = raw.slice(0, index) + raw.slice(index + 1);
            if (direction === -1) caret = index;
          }
        }
        update(input, raw, caret);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || (event.key !== "Backspace" && event.key !== "Delete")) return;
        const input = event.currentTarget;
        const start = input.selectionStart ?? 0;
        if (start !== input.selectionEnd) return;
        const direction = event.key === "Backspace" ? -1 : 1;
        let index = direction === -1 ? start - 1 : start;
        // Skip mask separators so deletion never gets stuck on a parenthesis or dash.
        if (index < 0 || index >= input.value.length || isEditable(input.value[index])) return;
        while (index >= 0 && index < input.value.length && !isEditable(input.value[index])) index += direction;
        if (index < 0 || index >= input.value.length) return;
        event.preventDefault();
        update(input, input.value.slice(0, index) + input.value.slice(index + 1), direction === -1 ? index : start);
      }}
      onBlur={(event) => {
        if (mask === "currency") {
          const amount = parseCurrencyInput(event.currentTarget.value);
          if (Number.isFinite(amount)) {
            const formatted = formatCurrencyValue(amount);
            setInternalValue(formatted);
            onValueChange?.(formatted);
          }
        }
        pendingCaret.current = null;
        onBlur?.(event);
      }}
    />
  );
}
