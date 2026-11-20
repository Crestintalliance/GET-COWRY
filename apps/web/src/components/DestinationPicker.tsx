import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Country } from "../api";
import { countryName } from "../i18n";
import { Flag } from "./Flag";
import { useLang } from "../layout";

interface Props {
  countries: Country[];
  selected: string[];
  onChange: (codes: string[]) => void;
  /** Shows a submit button next to the box when given. */
  onSubmit?: () => void;
  submitLabel?: string;
}

/**
 * Search box with a dropdown of destinations. Type to filter, or open the full list
 * with the arrow button. Pick as many countries as you like; each appears as a chip.
 */
export function DestinationPicker({ countries, selected, onChange, onSubmit, submitLabel }: Props) {
  const { lang, t } = useLang();
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const labelled = useMemo(
    () =>
      countries
        .map((c) => ({ ...c, label: countryName(c.countryCode, c.countryName, lang) }))
        .sort((a, b) => a.label.localeCompare(b.label, lang)),
    [countries, lang],
  );
  const byCode = useMemo(() => new Map(labelled.map((c) => [c.countryCode, c])), [labelled]);

  const q = query.trim().toLowerCase();
  const options = labelled.filter(
    (c) =>
      !selected.includes(c.countryCode) &&
      (!q ||
        c.label.toLowerCase().includes(q) ||
        c.countryName.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase() === q),
  );

  function add(code: string) {
    if (!selected.includes(code)) onChange([...selected, code]);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  }

  function remove(code: string) {
    onChange(selected.filter((c) => c !== code));
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = open && q ? options[active] : undefined;
      if (pick) add(pick.countryCode);
      else if (selected.length && onSubmit) onSubmit();
      else if (options[0] && q) add(options[0].countryCode);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !query && selected.length) {
      remove(selected[selected.length - 1]!);
    }
  }

  const activeId = open && options[active] ? `${id}-opt-${options[active]!.countryCode}` : undefined;

  return (
    <div className="picker" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <div className="picker-box">
        {selected.map((code) => {
          const c = byCode.get(code);
          const label = c?.label ?? code;
          return (
            <span className="chip" key={code}>
              {label}
              <button type="button" onClick={() => remove(code)} aria-label={`${t.picker.remove} ${label}`}>
                ×
              </button>
            </span>
          );
        })}
        <label htmlFor={`${id}-input`} className="sr-only">
          {t.hero.searchLabel}
        </label>
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected.length ? "" : t.hero.searchPlaceholder}
          autoComplete="off"
        />
        <button
          type="button"
          className="picker-toggle"
          aria-label={t.picker.showAll}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
        >
          ▾
        </button>
        {onSubmit && submitLabel && (
          <button className="btn btn-lime" type="button" onClick={onSubmit}>
            {submitLabel}
          </button>
        )}
      </div>
      {open && (
        <ul className="picker-list" id={listId} role="listbox" aria-multiselectable="true">
          {options.length === 0 && <li className="picker-empty">{t.picker.noMatch}</li>}
          {options.map((c, i) => (
            <li
              key={c.countryCode}
              id={`${id}-opt-${c.countryCode}`}
              role="option"
              aria-selected={false}
              className={i === active ? "active" : undefined}
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(c.countryCode)}
              onMouseEnter={() => setActive(i)}
            >
              <Flag code={c.countryCode} size={32} />
              <span className="name">{c.label}</span>
              <small>
                {c.planCount} {c.planCount === 1 ? t.countries.plan : t.countries.plans}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
