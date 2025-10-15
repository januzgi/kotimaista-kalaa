import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  const supabaseFunctionUrl = process.env.SUPABASE_FUNCTION_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseFunctionUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are not fully set.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const response = await fetch(supabaseFunctionUrl, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase function call failed: ${errorText}`);
    }

    const data = await response.json();
    console.log("Supabase function triggered successfully:", data.message);

    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error("Failed to trigger Supabase function:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to trigger Supabase function." });
  }
}
