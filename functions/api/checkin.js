export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { userId, name, email, encryptedData, riskLevel } = body;
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Save private checkin - YOU CANNOT READ encryptedData
    await env.emovra_db.prepare(
      "INSERT INTO checkins (id, userId, encryptedData, riskLevel, createdAt) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, userId || "anon", encryptedData || "", riskLevel || "green", now).run();

    // 2. IF RED ONLY - save to SOS table so you can see it
    if (riskLevel === "red") {
      const sosId = crypto.randomUUID();
      await env.emovra_db.prepare(
        "INSERT INTO sos_alerts (id, userId, name, email, riskLevel, createdAt) VALUES (?, ?, ?, ?, ?)"
      ).bind(sosId, userId || "anon", name || "Anonymous", email || "no-email", riskLevel, now).run();
    }

    return new Response(JSON.stringify({ success: true, riskLevel }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}