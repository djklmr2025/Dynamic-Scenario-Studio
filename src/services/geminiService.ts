import { Scenario } from "../types";

export async function generateScenario(prompt: string, currentScenario: Scenario, imageData?: string, externalAssets: {name: string, url: string}[] = []): Promise<Partial<Scenario>> {
  const response = await fetch("/api/generate-scenario", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, currentScenario, imageData, externalAssets }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to generate scenario");
  }

  const data = await response.json();
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export async function generateTimeline(prompt: string, currentScenario: Scenario, imageData?: string, externalAssets: {name: string, url: string}[] = []): Promise<any> {
  const response = await fetch("/api/generate-timeline", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, currentScenario, imageData, externalAssets }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to generate timeline");
  }

  const data = await response.json();
  return data;
}

export async function generateOptimizedPrompt(userPrompt: string, category: 'background' | 'character' | 'item'): Promise<string> {
  const response = await fetch("/api/optimize-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userPrompt, category }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to optimize prompt");
  }

  const data = await response.json();
  return data.result;
}
