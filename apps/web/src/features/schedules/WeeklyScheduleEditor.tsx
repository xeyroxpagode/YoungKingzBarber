"use client";

import { useMemo, useState } from "react";
import { Button } from "@youngkingz/ui";
import { CalendarCheck, Check, Copy, Plus, Trash2 } from "lucide-react";
import { weekdays, type WeeklyScheduleWeek, type Weekday } from "@youngkingz/contracts";
import { useDirtyGuard } from "../catalog/useDirtyGuard";
import type { WeekDraft } from "./api";

const dayLabels: Record<string, string> = { MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles", THURSDAY: "Jueves", FRIDAY: "Viernes", SATURDAY: "Sábado", SUNDAY: "Domingo" };
const order = [...weekdays] as Weekday[];

type DraftInterval = { key: string; start: string; end: string };
type Draft = Record<string, DraftInterval[]>;

const TIME = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
const toMinutes = (value: string) => { const match = TIME.exec(value); return match ? Number(match[1]) * 60 + Number(match[2]) : NaN; };

function fromWeek(week: WeeklyScheduleWeek): Draft {
  const draft: Draft = {};
  for (const day of order) draft[day] = (week[day] ?? []).map((interval) => ({ key: Math.random().toString(36).slice(2), start: interval.start, end: interval.end }));
  return draft;
}

// Canonical (sorted, no client keys) representation for semantic dirty + validation.
function canonical(draft: Draft): Record<string, { start: number; end: number }[]> {
  const result: Record<string, { start: number; end: number }[]> = {};
  for (const day of order) {
    result[day] = draft[day]
      .map((interval) => ({ start: toMinutes(interval.start), end: toMinutes(interval.end) }))
      .filter((interval) => Number.isFinite(interval.start) && Number.isFinite(interval.end) && interval.start < interval.end)
      .sort((a, b) => a.start - b.start || a.end - b.end)
      .map((interval) => ({ start: interval.start, end: interval.end }));
  }
  return result;
}

function validate(draft: Draft): string[] {
  const issues: string[] = [];
  for (const day of order) {
    const parsed = draft[day]
      .map((interval) => ({ key: interval.key, start: toMinutes(interval.start), end: toMinutes(interval.end) }))
      .sort((a, b) => a.start - b.start || a.end - b.end);
    for (const interval of parsed) {
      if (!Number.isFinite(interval.start) || !Number.isFinite(interval.end)) { issues.push(`${dayLabels[day]}: usá horarios con formato HH:mm.`); continue; }
      if (interval.start >= interval.end) { issues.push(`${dayLabels[day]}: el inicio debe ser anterior al fin (no se admiten horarios que cruzan la medianoche).`); }
    }
    for (let index = 1; index < parsed.length; index += 1) {
      if (parsed[index]!.start < parsed[index - 1]!.end) { issues.push(`${dayLabels[day]}: los bloques se superponen.`); break; }
    }
  }
  return issues;
}

export function WeeklyScheduleEditor({ initial, canManage, busy, onSave }: { initial: WeeklyScheduleWeek; canManage: boolean; busy?: boolean; onSave?: (week: WeekDraft) => void | Promise<void> }) {
  const [draft, setDraft] = useState<Draft>(() => fromWeek(initial));
  const [copySource, setCopySource] = useState<string>("MONDAY");
  const [copyTargets, setCopyTargets] = useState<string[]>([]);

  const baseline = useMemo(() => JSON.stringify(canonical(fromWeek(initial))), [initial]);
  const current = useMemo(() => JSON.stringify(canonical(draft)), [draft]);
  const dirty = baseline !== current;
  const issues = useMemo(() => validate(draft), [draft]);
  useDirtyGuard(dirty && canManage);

  function updateInterval(day: string, key: string, field: "start" | "end", value: string) {
    setDraft((value0) => ({ ...value0, [day]: value0[day]!.map((interval) => (interval.key === key ? { ...interval, [field]: value } : interval)) }));
  }
  function addInterval(day: string) {
    setDraft((value) => ({ ...value, [day]: [...value[day]!, { key: Math.random().toString(36).slice(2), start: "09:00", end: "17:00" }] }));
  }
  function removeInterval(day: string, key: string) {
    setDraft((value) => ({ ...value, [day]: value[day]!.filter((interval) => interval.key !== key) }));
  }
  function copyTo(source: string, targets: string[]) {
    if (!targets.length) return;
    const sourceIntervals = draft[source] ?? [];
    setDraft((value) => {
      const next = { ...value };
      for (const target of targets) next[target] = sourceIntervals.map((interval) => ({ key: Math.random().toString(36).slice(2), start: interval.start, end: interval.end }));
      return next;
    });
  }
  function copyMondayToWeekdays() { copyTo("MONDAY", ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]); }

  async function submit() {
    if (!canManage || !onSave || issues.length || !dirty) return;
    const week: WeekDraft = {};
    for (const day of order) week[day] = draft[day]!.map((interval) => ({ start: interval.start, end: interval.end }));
    await onSave(week);
  }

  return (
    <section className="panel-section stack week-editor" aria-label="Editor de horario semanal">
      <div className="section-head"><div><h2>Semana</h2><p className="muted">Horario semanal habitual. Guardá la semana completa de una sola vez.</p></div>{dirty && <span className="yk-pill yk-pill-warning">Sin guardar</span>}</div>
      {issues.length > 0 && <div className="notice error" role="alert"><strong>Revisá el horario:</strong><ul>{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul></div>}
      <div className="week-toolbar">
        <label className="inline"><span className="muted">Copiar</span>
          <select value={copySource} onChange={(event) => setCopySource(event.target.value)} aria-label="Día origen para copiar">{order.map((day) => <option key={day} value={day}>{dayLabels[day]}</option>)}</select>
          <span className="muted">a</span>
          {order.filter((day) => day !== copySource).map((day) => (
            <label key={day} className="check-row compact"><input type="checkbox" checked={copyTargets.includes(day)} onChange={(event) => setCopyTargets((value) => (event.target.checked ? [...value, day] : value.filter((item) => item !== day)))} /><span>{dayLabels[day]}</span></label>
          ))}
          <Button className="ghost" disabled={!canManage || busy || !copyTargets.length} onClick={() => copyTo(copySource, copyTargets)}><Copy size={15} /> Aplicar copia</Button>
        </label>
        <Button className="ghost" disabled={!canManage || busy || !draft.MONDAY?.length} onClick={copyMondayToWeekdays}><CalendarCheck size={15} /> Lunes a Lun–Vie</Button>
      </div>
      <div className="week-grid">
        {order.map((day) => (
          <div className={`day-block ${draft[day]!.length ? "" : "day-off"}`} key={day}>
            <div className="day-head"><h3>{dayLabels[day]}</h3>{!draft[day]!.length && <span className="muted">No trabaja</span>}</div>
            <div className="stack">
              {draft[day]!.map((interval) => (
                <div className="interval-row" key={interval.key}>
                  <input className="yk-input time-input" type="time" step={900} aria-label={`${dayLabels[day]} inicio`} value={interval.start} disabled={!canManage || busy} onChange={(event) => updateInterval(day, interval.key, "start", event.target.value)} />
                  <span className="interval-sep">–</span>
                  <input className="yk-input time-input" type="time" step={900} aria-label={`${dayLabels[day]} fin`} value={interval.end} disabled={!canManage || busy} onChange={(event) => updateInterval(day, interval.key, "end", event.target.value)} />
                  {canManage && <button type="button" className="icon-button" aria-label={`Quitar bloque de ${dayLabels[day]}`} disabled={busy} onClick={() => removeInterval(day, interval.key)}><Trash2 size={15} /></button>}
                </div>
              ))}
            </div>
            {canManage && <button type="button" className="link-button" disabled={busy} onClick={() => addInterval(day)}><Plus size={15} /> Agregar bloque</button>}
          </div>
        ))}
      </div>
      {canManage && <div className="form-actions"><Button disabled={!dirty || busy || issues.length > 0} onClick={submit}>{busy ? "Guardando…" : dirty ? "Guardar horarios" : <><Check size={16} /> Guardado</>}</Button>{dirty && <button type="button" className="button ghost" disabled={busy} onClick={() => setDraft(fromWeek(initial))}>Descartar cambios</button>}</div>}
    </section>
  );
}
