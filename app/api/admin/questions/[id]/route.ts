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

// PUT /api/admin/questions/[id] — update a question
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("questions")
    .update({
      ...(body.text !== undefined && { text: body.text }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.options !== undefined && { options: body.options }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// DELETE /api/admin/questions/[id] — delete a question
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
