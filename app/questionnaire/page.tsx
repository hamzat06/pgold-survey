"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  text: string;
  type: "rating" | "multiple_choice" | "text";
  options: string[] | null;
  sort_order: number;
}

function generateSessionToken(): string {
  return crypto.randomUUID();
}

// ── Rating question ──────────────────────────────────────────────────────────
function RatingInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const labels = ["Very Poor", "Poor", "Neutral", "Good", "Excellent"];
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex gap-3 justify-center flex-wrap">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={`w-14 h-14 rounded-2xl text-lg font-bold border-2 transition-all duration-150 ${
              value === String(n)
                ? "bg-[#0052FF] border-[#0052FF] text-white scale-110 shadow-md"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#80AAFF] hover:bg-[#EEF4FF] dark:hover:bg-gray-700"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between w-full max-w-xs text-xs text-gray-400 dark:text-gray-500 px-1">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </div>
  );
}

// ── Multiple choice question ─────────────────────────────────────────────────
function MultipleChoiceInput({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all duration-150 ${
            value === opt
              ? "bg-[#0052FF] border-[#0052FF] text-white shadow-md"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#80AAFF] hover:bg-[#EEF4FF] dark:hover:bg-gray-700"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Text question ────────────────────────────────────────────────────────────
function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer here... (optional)"
      rows={4}
      className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl px-5 py-4 text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#0052FF] dark:focus:border-[#80AAFF] resize-none transition-colors"
    />
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function QuestionnairePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useState(() => generateSessionToken());

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data: Question[]) => { setQuestions(data); setLoading(false); })
      .catch(() => { setError("Failed to load questions. Please refresh."); setLoading(false); });
  }, []);

  const question = questions[current];
  const answer = question ? (answers[question.id] ?? "") : "";
  const isLast = current === questions.length - 1;
  const progress = questions.length ? ((current + 1) / questions.length) * 100 : 0;
  const canProceed = !question || question.type === "text" || answer.trim() !== "";

  const handleAnswer = useCallback((value: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }, [question]);

  const handleNext = useCallback(() => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
  }, [current, questions.length]);

  const handleBack = useCallback(() => {
    if (current > 0) setCurrent((c) => c - 1);
  }, [current]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    const payload = questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({ questionId: q.id, value: answers[q.id] }));
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, answers: payload }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error ?? "Submission failed"); }
      router.push("/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }, [questions, answers, sessionToken, router]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#EEF4FF] to-[#E0EEFF] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading questions…</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#EEF4FF] to-[#E0EEFF] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 text-center max-w-md">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // ── Questionnaire UI ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-[#EEF4FF] to-[#E0EEFF] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-10">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-[#0052FF] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>

          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                Question {current + 1} of {questions.length}
              </span>
              <span className="text-xs bg-[#EEF4FF] dark:bg-gray-800 text-[#0052FF] dark:text-[#80AAFF] font-semibold px-3 py-1 rounded-full">
                {Math.round(progress)}% complete
              </span>
            </div>

            {/* Question text */}
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-snug">
              {question?.text}
              {question?.type === "text" && (
                <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">(optional)</span>
              )}
            </h2>

            {/* Input */}
            <div className="mb-8">
              {question?.type === "rating" && <RatingInput value={answer} onChange={handleAnswer} />}
              {question?.type === "multiple_choice" && question.options && (
                <MultipleChoiceInput options={question.options} value={answer} onChange={handleAnswer} />
              )}
              {question?.type === "text" && <TextInput value={answer} onChange={handleAnswer} />}
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {current > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5 5-5M18 12H6" />
                  </svg>
                  Back
                </button>
              )}

              {!isLast ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0041CC] disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !canProceed}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0041CC] disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit Survey
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          Your answers are anonymous and cannot be traced back to you.
        </p>
      </div>
    </div>
  );
}
