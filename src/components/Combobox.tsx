import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";

export type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string; // "" = sin filtro
  options: Option[];
  onChange: (value: string) => void;
  allLabel: string; // texto de la opción que quita el filtro, por ejemplo "Todas"
  maxLength?: number;
};

// Quita acentos y mayúsculas para que "mexico" encuentre "México".
const norm = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Lista desplegable que se puede usar solo con el teclado: escribe para buscar, ↑ ↓ para moverte,
// Enter para elegir y Esc para cerrar. La "×" quita el filtro.
export default function Combobox({ label, value, options, onChange, allLabel, maxLength = 30 }: Props) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value);

  const items = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [{ value: "", label: allLabel }, ...options];
    return options
      .filter((o) => norm(o.label).includes(q))
      .sort((a, b) => Number(!norm(a.label).startsWith(q)) - Number(!norm(b.label).startsWith(q))); // primero las que empiezan igual
  }, [options, query, allLabel]);

  useEffect(() => {
    if (open) document.getElementById(`${uid}-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, open, uid]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, items.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const close = () => { setOpen(false); setQuery(""); };
  const choose = (option: Option) => { onChange(option.value); close(); };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openList(); else setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openList(); else setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && items[active]) { e.preventDefault(); choose(items[active]); }
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); close(); }
    }
  };

  return (
    <div
      className="filter-field"
      ref={wrapRef}
      onBlur={(e) => { if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) close(); }}
    >
      <span id={`${uid}-label`}>{label}</span>
      <div className="combo-box">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-labelledby={`${uid}-label`}
          aria-activedescendant={open && items[active] ? `${uid}-${active}` : undefined}
          autoComplete="off"
          maxLength={maxLength}
          value={open ? query : selected?.label ?? ""}
          placeholder={open ? "Escribe para buscar…" : allLabel}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKeyDown}
        />
        {value && (
          <button type="button" className="combo-clear" aria-label={`Quitar filtro de ${label}`} title="Quitar filtro" onClick={() => { onChange(""); close(); inputRef.current?.focus(); }}>×</button>
        )}
      </div>

      {open && (
        <ul className="combo-list" id={`${uid}-list`} role="listbox" aria-labelledby={`${uid}-label`}>
          {items.length === 0 ? (
            <li className="combo-empty" role="presentation">Sin resultados</li>
          ) : items.map((o, i) => (
            <li
              key={o.value || "all"}
              id={`${uid}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={i === active ? "active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
            >{o.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
