export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const result = await env.emovra_db.prepare(
      "SELECT * FROM sos_alerts ORDER BY createdAt DESC LIMIT 50"
    ).all();
    
    return new Response(JSON.stringify(result.results), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}