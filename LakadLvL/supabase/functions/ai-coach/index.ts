const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type AiCoachRequest = {
  activity: string;
  activityKm?: number;
  mood: number;
  sleepHours: number;
  waterIntake: number;
};

function buildPrompt({
  activity,
  activityKm = 0,
  mood,
  sleepHours,
  waterIntake,
}: AiCoachRequest) {
  return `
You are a health and productivity coach for remote workers.

User data:
- Sleep: ${sleepHours} hours
- Water: ${waterIntake} liters
- Mood: ${mood}/5
- Activity: ${activity}
- Distance: ${activityKm} km

Give short, actionable advice in 2-3 sentences.
Focus on improving energy, health, and productivity.
Be encouraging but practical.
Avoid generic motivational language.
Mention specific actions the user can do today.
`.trim();
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY." }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const body = (await request.json()) as AiCoachRequest;

    if (
      typeof body.sleepHours !== "number" ||
      typeof body.waterIntake !== "number" ||
      typeof body.mood !== "number" ||
      typeof body.activity !== "string"
    ) {
      return new Response(JSON.stringify({ error: "Invalid payload." }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildPrompt(body),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 120,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Gemini request failed.",
          details: data,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const advice = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join(" ")
      .trim();

    if (!advice) {
      return new Response(JSON.stringify({ error: "Empty Gemini response." }), {
        status: 502,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ advice }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
