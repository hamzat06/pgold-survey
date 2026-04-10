"use client";

import { useState, useCallback, useEffect } from "react";
import { generateResultsPDF } from "@/lib/generatePDF";

// ── Types ────────────────────────────────────────────────────────────────────

interface RatingQuestion {
  id: number; text: string; type: "rating";
  totalAnswers: number; average: number | null; distribution: Record<string, number>;
}
interface MultipleChoiceQuestion {
  id: number; text: string; type: "multiple_choice";
  totalAnswers: number; tally: Record<string, number>;
}
interface TextQuestion {
  id: number; text: string; type: "text";
  totalAnswers: number; responses: string[];
}
type AggregatedQuestion = RatingQuestion | MultipleChoiceQuestion | TextQuestion;

interface ResultsData { totalResponses: number; questions: AggregatedQuestion[] }

interface ManagedQuestion {
  id: number; text: string; type: "rating" | "multiple_choice" | "text";
  options: string[] | null; sort_order: number; is_active: boolean;
}

// ── Small shared components ───────────────────────────────────────────────────

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 text-sm font-semibold text-gray-500 dark:text-gray-400 text-right">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-[#0052FF] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-400 dark:text-gray-500 w-8 text-right">{count}</span>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={`w-5 h-5 ${n <= Math.round(value) ? "text-[#0052FF]" : "text-gray-200 dark:text-gray-700"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ── Question form (create / edit) ─────────────────────────────────────────────

interface QuestionFormProps {
  initial?: ManagedQuestion;
  onSave: (q: ManagedQuestion) => void;
  onCancel: () => void;
  password: string;
}

function QuestionForm({ initial, onSave, onCancel, password }: QuestionFormProps) {
  const [text, setText] = useState(initial?.text ?? "");
  const [type, setType] = useState<ManagedQuestion["type"]>(initial?.type ?? "rating");
  const [optionsRaw, setOptionsRaw] = useState(initial?.options ? initial.options.join("\n") : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!text.trim()) { setError("Question text is required."); return; }
    if (type === "multiple_choice" && !optionsRaw.trim()) { setError("Add at least one option."); return; }
    setSaving(true); setError("");
    const options = type === "multiple_choice"
      ? optionsRaw.split("\n").map((o) => o.trim()).filter(Boolean)
      : null;
    const url = initial ? `/api/admin/questions/${initial.id}` : "/api/admin/questions";
    try {
      const res = await fetch(url, {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
        body: JSON.stringify({ text: text.trim(), type, options }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error); }
      onSave(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-[#EEF4FF] dark:bg-gray-800 border-2 border-[#99BBFF] dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-gray-800 dark:text-white">{initial ? "Edit Question" : "New Question"}</h3>

      <div className="flex gap-2 flex-wrap">
        {(["rating", "multiple_choice", "text"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
              type === t
                ? "bg-[#0052FF] border-[#0052FF] text-white"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#80AAFF]"
            }`}
          >
            {t === "multiple_choice" ? "Multiple Choice" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter your question…" rows={2}
        className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#0052FF] dark:focus:border-[#80AAFF] resize-none transition-colors"
      />

      {type === "multiple_choice" && (
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Options (one per line)</label>
          <textarea value={optionsRaw} onChange={(e) => setOptionsRaw(e.target.value)} placeholder={"Option A\nOption B\nOption C"} rows={4}
            className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#0052FF] dark:focus:border-[#80AAFF] resize-none transition-colors font-mono text-sm"
          />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={handleSave} disabled={saving}
          className="bg-[#0052FF] hover:bg-[#0041CC] disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
          {saving ? "Saving…" : "Save Question"}
        </button>
        <button type="button" onClick={onCancel}
          className="border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Questions manager tab ─────────────────────────────────────────────────────

function QuestionsManager({ password }: { password: string }) {
  const [questions, setQuestions] = useState<ManagedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions", { headers: { Authorization: `Bearer ${password}` } });
      if (!res.ok) throw new Error();
      setQuestions(await res.json());
    } catch { setError("Could not load questions."); }
    finally { setLoading(false); }
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (q: ManagedQuestion) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === q.id);
      return idx >= 0 ? prev.map((x) => (x.id === q.id ? q : x)) : [...prev, q];
    });
    setShowForm(false); setEditingId(null);
  };

  const handleToggleActive = async (q: ManagedQuestion) => {
    const res = await fetch(`/api/admin/questions/${q.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
      body: JSON.stringify({ is_active: !q.is_active }),
    });
    if (res.ok) { const u: ManagedQuestion = await res.json(); setQuestions((p) => p.map((x) => x.id === q.id ? u : x)); }
  };

  const swap = async (a: ManagedQuestion, b: ManagedQuestion) => {
    await Promise.all([
      fetch(`/api/admin/questions/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` }, body: JSON.stringify({ sort_order: b.sort_order }) }),
      fetch(`/api/admin/questions/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` }, body: JSON.stringify({ sort_order: a.sort_order }) }),
    ]);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${password}` } });
    setQuestions((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <p className="text-gray-400 py-8 text-center">Loading questions…</p>;
  if (error) return <p className="text-red-500 py-8 text-center">{error}</p>;

  const typeLabel: Record<ManagedQuestion["type"], string> = { rating: "Rating 1–5", multiple_choice: "Multiple Choice", text: "Open Text" };

  return (
    <div className="flex flex-col gap-4">
      {!showForm && !editingId && (
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 self-start bg-[#0052FF] hover:bg-[#0041CC] text-white font-semibold px-5 py-2.5 rounded-2xl transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </button>
      )}

      {showForm && <QuestionForm password={password} onSave={handleSaved} onCancel={() => setShowForm(false)} />}

      {questions.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400">
          No questions yet. Add your first one above.
        </div>
      ) : (
        questions.map((q, i) => (
          <div key={q.id} className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-5 transition-opacity ${q.is_active ? "border-gray-100 dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-700 opacity-60"}`}>
            {editingId === q.id ? (
              <QuestionForm initial={q} password={password} onSave={handleSaved} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1 pt-0.5 shrink-0">
                  <button type="button" onClick={() => swap(q, questions[i - 1])} disabled={i === 0}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20 transition-colors" title="Move up">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button type="button" onClick={() => swap(q, questions[i + 1])} disabled={i === questions.length - 1}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20 transition-colors" title="Move down">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-[#0052FF] bg-[#EEF4FF] dark:bg-gray-800 dark:text-[#80AAFF] px-2 py-0.5 rounded-full">{typeLabel[q.type]}</span>
                    {!q.is_active && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 font-medium leading-snug">{q.text}</p>
                  {q.type === "multiple_choice" && q.options && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{q.options.join(" · ")}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => handleToggleActive(q)} title={q.is_active ? "Deactivate" : "Activate"}
                    className="text-gray-400 hover:text-[#0052FF] dark:hover:text-[#80AAFF] transition-colors p-1">
                    {q.is_active ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                  </button>
                  <button type="button" onClick={() => setEditingId(q.id)} title="Edit"
                    className="text-gray-400 hover:text-[#0052FF] dark:hover:text-[#80AAFF] transition-colors p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button type="button" onClick={() => handleDelete(q.id)} title="Delete"
                    className="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ── Results tab ───────────────────────────────────────────────────────────────

function ResultsTab({ data }: { data: ResultsData }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 50));
    generateResultsPDF(data);
    setDownloading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button type="button" onClick={handleDownload} disabled={downloading || data.totalResponses === 0}
          className="flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-[#0052FF] dark:hover:border-[#80AAFF] text-gray-700 dark:text-gray-300 hover:text-[#0052FF] dark:hover:text-[#80AAFF] font-semibold px-5 py-2.5 rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {downloading ? "Generating…" : "Download PDF"}
        </button>
      </div>

      {data.questions.map((q, i) => (
        <div key={q.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-7">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <span className="text-xs font-semibold text-[#0052FF] dark:text-[#80AAFF] uppercase tracking-wide">
                Q{i + 1} · {q.type.replace("_", " ")}
              </span>
              <h2 className="text-gray-900 dark:text-white font-semibold mt-1 leading-snug">{q.text}</h2>
            </div>
            <span className="shrink-0 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
              {q.totalAnswers} {q.totalAnswers === 1 ? "response" : "responses"}
            </span>
          </div>

          {q.type === "rating" && (
            <div>
              {q.average !== null && (
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{q.average}</span>
                  <div><Stars value={q.average} /><p className="text-xs text-gray-400 mt-0.5">out of 5</p></div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {[5, 4, 3, 2, 1].map((n) => (
                  <RatingBar key={n} label={String(n)} count={q.distribution[String(n)] ?? 0} total={q.totalAnswers} />
                ))}
              </div>
            </div>
          )}

          {q.type === "multiple_choice" && (
            <div className="flex flex-col gap-2">
              {Object.entries(q.tally).sort((a, b) => b[1] - a[1]).map(([option, count]) => {
                const pct = q.totalAnswers > 0 ? Math.round((count / q.totalAnswers) * 100) : 0;
                return (
                  <div key={option}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{option}</span>
                      <span className="text-gray-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0052FF] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {q.type === "text" && (
            <div className="flex flex-col gap-3">
              {q.responses.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No responses yet.</p>
              ) : (
                q.responses.map((r, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-5 py-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed border-l-4 border-[#80AAFF]">
                    {r}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"results" | "questions">("results");

  const login = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/results", { headers: { Authorization: `Bearer ${password}` } });
      if (res.status === 401) { setAuthError("Incorrect password."); return; }
      if (!res.ok) throw new Error();
      setResultsData(await res.json());
      setAuthed(true);
    } catch { setAuthError("Could not connect. Please try again."); }
    finally { setLoading(false); }
  }, [password]);

  // ── Login gate ───────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#EEF4FF] to-[#E0EEFF] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0052FF] mb-6">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Admin Access</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Pgold survey dashboard</p>
          <form onSubmit={login} className="flex flex-col gap-4">
            <input type="password" placeholder="Enter admin password" value={password}
              onChange={(e) => setPassword(e.target.value)} autoFocus
              className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#0052FF] dark:focus:border-[#80AAFF] transition-colors"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" disabled={loading || !password}
              className="bg-[#0052FF] hover:bg-[#0041CC] disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-3 rounded-2xl transition-colors">
              {loading ? "Loading…" : "Enter Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pgold Admin</h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Survey management dashboard</p>
          </div>
          {tab === "results" && (
            <div className="bg-[#0052FF] text-white rounded-2xl px-6 py-3 text-center">
              <p className="text-2xl font-bold leading-none">{resultsData?.totalResponses ?? 0}</p>
              <p className="text-xs mt-1 opacity-80">Total Responses</p>
            </div>
          )}
        </div>

        <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-2xl p-1 shadow-sm border border-gray-100 dark:border-gray-800 mb-6 w-fit">
          {(["results", "questions"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t ? "bg-[#0052FF] text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              {t === "results" ? "Results" : "Manage Questions"}
            </button>
          ))}
        </div>

        {tab === "results" && resultsData && <ResultsTab data={resultsData} />}
        {tab === "questions" && <QuestionsManager password={password} />}
      </div>
    </div>
  );
}
