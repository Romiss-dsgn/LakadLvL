import { supabase } from "@/lib/supabase";

export type AiCoachInput = {
  activity: string;
  activityKm: number;
  mood: number;
  sleepHours: number;
  waterIntake: number;
};

export type AiCoachResult = {
  advice: string;
  source: "gemini" | "fallback";
};

function buildFallbackAiAdvice({
  activity,
  activityKm,
  mood,
  sleepHours,
  waterIntake,
}: AiCoachInput) {
  const sleepNote =
    sleepHours < 6
      ? "You are running on low sleep, so protect your focus early and aim for a longer recovery tonight."
      : sleepHours < 7
        ? "Your sleep was close to target, but pushing it past 7 hours will make your energy more stable."
        : "Your sleep is in a solid range, so the goal is to keep that consistency tomorrow.";

  const hydrationNote =
    waterIntake < 1.5
      ? "Hydrate earlier in the day so your energy does not flatten out by midday."
      : waterIntake < 2
        ? "A little more water gets you to the daily target and supports a steadier work rhythm."
        : "Hydration is on track, which gives you an easy base for the rest of the day.";

  const moodNote =
    mood <= 2
      ? "Because your mood is low, keep the next action small: a short walk, sunlight, or one low-friction task."
      : mood === 3
        ? "Your mood looks neutral, so use structure to keep momentum instead of waiting for motivation."
        : "Your mood is in a good place, so convert that into progress before distractions pile up.";

  const activityNote =
    activityKm > 0
      ? `You already logged ${activityKm.toFixed(1)} km with ${activity.trim()}, so treat that as proof you have momentum today.`
      : `You logged ${activity.trim()}, but adding even a short movement break would help your energy and focus.`;

  return `${sleepNote} ${hydrationNote} ${moodNote} ${activityNote}`;
}

export async function generateAiCoachAdvice(
  input: AiCoachInput
): Promise<AiCoachResult> {
  try {
    const { data, error } = await supabase.functions.invoke<{ advice?: string }>(
      "ai-coach",
      {
        body: input,
      }
    );

    if (error) {
      throw error;
    }

    const advice = data?.advice?.trim();

    if (!advice) {
      throw new Error("AI coach returned an empty response.");
    }

    return {
      advice,
      source: "gemini",
    };
  } catch {
    return {
      advice: buildFallbackAiAdvice(input),
      source: "fallback",
    };
  }
}
