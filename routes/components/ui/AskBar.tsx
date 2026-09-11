"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUp, ArrowUpLeft, LoaderCircle, MapPin } from "lucide-react";
import type { Language, Place } from "@/lib/types";
import { categories, placeName } from "@/lib/directions";
import { completePlace, completionAt, selectedPlaces, type PlaceSelection, type SelectedPlaces } from "@/lib/autocomplete";

export default function AskBar({ text, setText, onSubmit, onDestinationSelect, language, loading, active }: {
  text: string;
  setText: (text: string) => void;
  onSubmit: (places: SelectedPlaces) => void;
  onDestinationSelect?: (place: Place | null) => void;
  language: Language;
  loading: string | null;
  active: boolean;
}) {
  const so = language === "so", listId = useId();
  const input = useRef<HTMLInputElement>(null), selections = useRef<PlaceSelection[]>([]);
  const [focused, setFocused] = useState(false), [caret, setCaret] = useState(text.length);
  const [dismissed, setDismissed] = useState(false), [highlighted, setHighlighted] = useState(-1);
  const [reply, setReply] = useState<{ query: string; places: Place[]; error?: boolean } | null>(null);
  const completion = completionAt(text, caret), query = completion?.query ?? "";
  const open = focused && !dismissed && !loading && !!query;
  const current = reply?.query === query ? reply : null;
  const matches = current?.places ?? [];
  const option = highlighted >= 0 && highlighted < matches.length ? highlighted : -1;
  useEffect(() => {
    selections.current = selections.current.filter(selection => selectedPlaces(text, [selection])[selection.role]);
    onDestinationSelect?.(selectedPlaces(text, selections.current).destination ?? null);
  }, [text, onDestinationSelect]);
  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}&autocomplete=1`, { signal: abort.signal });
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        if (!abort.signal.aborted) setReply({ query, places: data.places });
      } catch {
        if (!abort.signal.aborted) setReply({ query, places: [], error: true });
      }
    }, 180);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [query, open]);
  const select = (place: Place) => {
    if (!completion) return;
    const label = placeName(place, language), completed = completePlace(text, completion, label);
    selections.current = [...selections.current.filter(s => s.role !== completion.role), { role: completion.role, label, place }];
    if (completion.role === "destination") onDestinationSelect?.(place);
    setText(completed.text);
    setCaret(completed.caret);
    setDismissed(true);
    setHighlighted(-1);
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(completed.caret, completed.caret);
    });
  };
  const submit = () => { setDismissed(true); onSubmit(selectedPlaces(text, selections.current)); };
  return (
    <form className={`ask-form ${active ? "active" : ""} ${open ? "suggesting" : ""}`}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
      onSubmit={event => { event.preventDefault(); submit(); }}>
      <div className="ask-input panel">
        <MapPin size={20} />
        <input ref={input} role="combobox" aria-autocomplete="list" aria-expanded={open}
          aria-controls={listId} aria-activedescendant={open && option >= 0 ? `${listId}-${option}` : undefined}
          aria-label={so ? "Xaggee rabtaa inaad tagto?" : "Where do you need to go?"}
          placeholder={so ? "Xaggee rabtaa inaad tagto?" : "Where do you need to go?"}
          autoComplete="off" spellCheck={false} value={text}
          onChange={event => {
            selections.current = selections.current.filter(selection => selectedPlaces(event.target.value, [selection])[selection.role]);
            setText(event.target.value); setCaret(event.target.selectionStart ?? event.target.value.length); setHighlighted(-1); setDismissed(false); setReply(null);
          }}
          onFocus={event => { setFocused(true); setCaret(event.target.selectionStart ?? text.length); }}
          onSelect={event => setCaret(event.currentTarget.selectionStart ?? text.length)}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Escape") {
              event.preventDefault(); event.stopPropagation(); setDismissed(true); setHighlighted(-1);
            } else if (!open && query && event.key === "ArrowDown") {
              event.preventDefault(); setDismissed(false); setHighlighted(0);
            } else if (open && matches.length && ["ArrowDown", "ArrowUp"].includes(event.key)) {
              event.preventDefault();
              const next = event.key === "ArrowDown" ? (option + 1) % matches.length : (option <= 0 ? matches.length - 1 : option - 1);
              setHighlighted(next);
              document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
            } else if (open && option >= 0 && event.key === "Enter") {
              event.preventDefault(); select(matches[option]);
            } else if (event.key === "Tab") setDismissed(true);
          }} maxLength={500} disabled={!!loading} />
        <button type="submit" aria-label={so ? "Raadi safarka" : "Find journey"} disabled={!!loading || text.trim().length < 2}>
          {loading ? <LoaderCircle className="spin" size={21} /> : <ArrowUp size={22} />}
        </button>
      </div>
      {open && <div className="place-suggestions panel">
        <div className="suggestion-heading">
          <span>{completion?.role === "origin" ? (so ? "HALKA AAD KA BAXAYSO" : "STARTING PLACE") : (so ? "HALKA AAD U SOCOTO" : "DESTINATION")}</span>
          <small>{so ? "↑ ↓ dooro · Enter ku buuxi" : "↑ ↓ choose · Enter to fill"}</small>
        </div>
        <ul id={listId} role="listbox" aria-label={so ? "Goobaha la soo jeediyay" : "Suggested places"}>
          {matches.map((place, index) => <li key={place.id} id={`${listId}-${index}`} role="option" aria-selected={index === option}
            onMouseDown={event => event.preventDefault()} onClick={() => select(place)} onMouseMove={() => setHighlighted(index)}>
            <MapPin size={16} />
            <span><strong>{placeName(place, language)}</strong><small>{categories[language][place.category] ?? place.category} · {place.district || `${place.lat.toFixed(3)}, ${place.lng.toFixed(3)}`}</small></span>
            <ArrowUpLeft size={16} />
          </li>)}
        </ul>
        {!matches.length && <p className="suggestion-status" role="status">
          {!current ? (so ? "Goobaha waa la raadinayaa…" : "Finding places…") : current.error
            ? (so ? "Raadintu hadda ma shaqaynayso. Weli safarka waad qori kartaa." : "Suggestions are unavailable. You can still type your journey.")
            : (so ? "Goob lama helin. Isku day magac kale ama qor safarkaaga." : "No matching places. Try another name or enter your journey.")}
        </p>}
      </div>}
      {loading ? <p className="ask-hint" role="status">{loading}</p> : !active ? <p className="ask-hint">{so ? "Ku qor goob ama safar Soomaali ama English." : "Search a place, or describe your journey in Somali or English."}</p> : null}
    </form>
  );
}
