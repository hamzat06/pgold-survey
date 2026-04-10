import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#EEF4FF] to-[#E0EEFF] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 md:p-14 text-center">
          {/* Success icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Thank You!
          </h1>

          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-3">
            Your response has been recorded.
          </p>

          <p className="text-gray-400 dark:text-gray-500 text-base leading-relaxed mb-10 max-w-sm mx-auto">
            Your feedback is completely anonymous and will help leadership make
            meaningful improvements at Pgold.
          </p>

          <div className="bg-[#EEF4FF] dark:bg-gray-800 rounded-2xl p-5 mb-8 text-left">
            <h2 className="text-sm font-semibold text-[#0041CC] dark:text-[#80AAFF] mb-2">What happens next?</h2>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-[#0052FF] dark:text-[#80AAFF] mt-0.5">•</span>
                Results are reviewed in aggregate — no individual answers are shared.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0052FF] dark:text-[#80AAFF] mt-0.5">•</span>
                Leadership will use the feedback to prioritise improvements.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0052FF] dark:text-[#80AAFF] mt-0.5">•</span>
                Your identity remains fully anonymous throughout.
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold px-8 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
