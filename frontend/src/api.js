const API_BASE = "";
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

function privateHeaders(headers = {}) {
  return accessToken
    ? { ...headers, Authorization: `Bearer ${accessToken}` }
    : headers;
}

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function uploadArtwork({ title, authorName, exerciseTag, useLlm, artistLevel, file }) {
  const params = new URLSearchParams({
    title,
    author_name: authorName,
    use_llm: String(useLlm),
    artist_level: artistLevel,
  });
  if (exerciseTag) params.set("exercise_tag", exerciseTag);

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/artworks/upload?${params}`, {
    method: "POST",
    headers: privateHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function getLlmStatus() {
  const res = await fetch(`${API_BASE}/api/llm/status`);
  return handleResponse(res);
}

export async function getAuthConfig() {
  const res = await fetch(`${API_BASE}/api/auth/config`);
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

export async function listArtworks() {
  const res = await fetch(`${API_BASE}/api/artworks`, { headers: privateHeaders() });
  return handleResponse(res);
}

export async function updateArtworkTitle(artworkId, title) {
  const res = await fetch(
    `${API_BASE}/api/artworks/${artworkId}/title`,
    {
      method: "PATCH",
      headers: privateHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ title }),
    }
  );
  return handleResponse(res);
}

export async function deleteArtwork(artworkId) {
  const res = await fetch(
    `${API_BASE}/api/artworks/${artworkId}`,
    { method: "DELETE", headers: privateHeaders() }
  );
  return handleResponse(res);
}

export async function generateArtworkNarrative(artworkId, artistLevel) {
  const res = await fetch(
    `${API_BASE}/api/artworks/${artworkId}/narrative`,
    {
      method: "POST",
      headers: privateHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ consent: true, artist_level: artistLevel }),
    }
  );
  return handleResponse(res);
}

export async function getProgress() {
  const res = await fetch(`${API_BASE}/api/progress`, { headers: privateHeaders() });
  return handleResponse(res);
}

export async function getRecommendedExercises() {
  const res = await fetch(`${API_BASE}/api/exercises/recommended`, {
    headers: privateHeaders(),
  });
  return handleResponse(res);
}
