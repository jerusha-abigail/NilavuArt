const API_BASE = "";

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function uploadArtwork({ userId, title, exerciseTag, useLlm, artistLevel, file }) {
  const params = new URLSearchParams({
    user_id: userId,
    title,
    use_llm: String(useLlm),
    artist_level: artistLevel,
  });
  if (exerciseTag) params.set("exercise_tag", exerciseTag);

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/artworks/upload?${params}`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function getLlmStatus() {
  const res = await fetch(`${API_BASE}/api/llm/status`);
  return handleResponse(res);
}

export async function submitSiteFeedback(feedback) {
  const res = await fetch(`${API_BASE}/api/site-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback),
  });
  return handleResponse(res);
}

export async function listArtworks(userId) {
  const res = await fetch(`${API_BASE}/api/artworks?user_id=${encodeURIComponent(userId)}`);
  return handleResponse(res);
}

export async function getProgress(userId) {
  const res = await fetch(`${API_BASE}/api/progress?user_id=${encodeURIComponent(userId)}`);
  return handleResponse(res);
}

export async function getRecommendedExercises(userId) {
  const res = await fetch(
    `${API_BASE}/api/exercises/recommended?user_id=${encodeURIComponent(userId)}`
  );
  return handleResponse(res);
}
