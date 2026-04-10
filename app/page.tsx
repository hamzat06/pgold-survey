import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#EEF4FF] to-[#E0EEFF] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 md:p-14 text-center">
          {/* Brand mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0052FF] mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Your Voice Matters
          </h1>

          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-2">
            Help Pgold build a better workplace.
          </p>

          <p className="text-gray-400 dark:text-gray-500 text-base leading-relaxed mb-8 max-w-lg mx-auto">
            This survey is completely{" "}
            <span className="font-semibold text-[#0052FF] dark:text-[#80AAFF]">anonymous</span> — your
            identity is never stored or linked to your responses. Leadership will
            only see aggregated results, never individual answers.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-[#EEF4FF] dark:bg-gray-800 rounded-2xl p-4">
              <p className="text-2xl font-bold text-[#0052FF] dark:text-[#80AAFF]">11</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Questions</p>
            </div>
            <div className="bg-[#EEF4FF] dark:bg-gray-800 rounded-2xl p-4">
              <p className="text-2xl font-bold text-[#0052FF] dark:text-[#80AAFF]">~5</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minutes</p>
            </div>
            <div className="bg-[#EEF4FF] dark:bg-gray-800 rounded-2xl p-4">
              <p className="text-2xl font-bold text-[#0052FF] dark:text-[#80AAFF]">100%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Anonymous</p>
            </div>
          </div>

          <Link
            href="/questionnaire"
            className="inline-flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0041CC] text-white font-semibold text-lg px-10 py-4 rounded-2xl transition-colors duration-200 w-full md:w-auto"
          >
            Start Survey
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </Link>

          <p className="mt-5 text-xs text-gray-400 dark:text-gray-500">
            Responses are confidential and reviewed only in aggregate form.
          </p>
        </div>
      </div>
    </div>
  );
}
