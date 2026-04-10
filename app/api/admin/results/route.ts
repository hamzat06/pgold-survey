import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  // Verify admin password from Authorization header
  const authHeader = request.headers.get("authorization");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role key to bypass RLS and read all responses
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Total response count
  const { count: totalResponses } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true });

  // Fetch all questions
  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("id, text, type, options, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (qError) {
    return Response.json({ error: qError.message }, { status: 500 });
  }

  // Fetch all answers
  const { data: answers, error: aError } = await supabase
    .from("answers")
    .select("question_id, value");

  if (aError) {
    return Response.json({ error: aError.message }, { status: 500 });
  }

  // Aggregate answers per question
  const aggregated = questions!.map((q) => {
    const questionAnswers = answers!
      .filter((a) => a.question_id === q.id)
      .map((a) => a.value);

    if (q.type === "rating") {
      const nums = questionAnswers.map(Number).filter((n) => !isNaN(n));
      const avg = nums.length
        ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
        : null;
      const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      nums.forEach((n) => {
        const key = String(n);
        if (key in distribution) distribution[key]++;
      });
      return { ...q, totalAnswers: nums.length, average: avg, distribution };
    }

    if (q.type === "multiple_choice") {
      const tally: Record<string, number> = {};
      questionAnswers.forEach((v) => {
        tally[v] = (tally[v] ?? 0) + 1;
      });
      return { ...q, totalAnswers: questionAnswers.length, tally };
    }

    // text
    return { ...q, totalAnswers: questionAnswers.length, responses: questionAnswers };
  });

  return Response.json({ totalResponses, questions: aggregated });
}
