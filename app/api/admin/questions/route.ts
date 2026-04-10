import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isAuthorized(request: Request) {
  return request.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// GET /api/admin/questions — list all questions (including inactive)
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, text, type, options, sort_order, is_active")
    .order("sort_order");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/admin/questions — create a new question
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.text || !body?.type) {
    return Response.json({ error: "text and type are required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Get next sort_order
  const { data: last } = await supabase
    .from("questions")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sort_order = (last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("questions")
    .insert({
      text: body.text,
      type: body.type,
      options: body.options ?? null,
      sort_order,
      is_active: true,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
