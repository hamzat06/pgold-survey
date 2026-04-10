import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface AnswerPayload {
  questionId: number;
  value: string;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.sessionToken !== "string" || !Array.isArray(body.answers)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { sessionToken, answers }: { sessionToken: string; answers: AnswerPayload[] } = body;

  if (answers.length === 0) {
    return Response.json({ error: "No answers provided" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Insert the response row
  const { data: response, error: responseError } = await supabase
    .from("responses")
    .insert({ session_token: sessionToken })
    .select("id")
    .single();

  if (responseError) {
    return Response.json({ error: responseError.message }, { status: 500 });
  }

  // Insert all answers
  const rows = answers.map((a) => ({
    response_id: response.id,
    question_id: a.questionId,
    value: a.value,
  }));

  const { error: answersError } = await supabase.from("answers").insert(rows);

  if (answersError) {
    return Response.json({ error: answersError.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
