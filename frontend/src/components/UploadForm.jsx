import { useEffect, useState } from "react";
import { getLlmStatus, uploadArtwork } from "../api";

export default function UploadForm({ userId, onUploaded }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useLlm, setUseLlm] = useState(false);
  const [artistLevel, setArtistLevel] = useState("student");
  const [llmStatus, setLlmStatus] = useState({ configured: false, loading: true });

  useEffect(() => {
    getLlmStatus()
      .then((status) => setLlmStatus({ ...status, loading: false }))
      .catch(() => setLlmStatus({ configured: false, loading: false }));
  }, []);

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await uploadArtwork({
        userId,
        title: title || "Untitled",
        useLlm,
        artistLevel,
        file,
      });
      onUploaded(result);
      setTitle("");
      setFile(null);
      setPreview(null);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card upload-form" onSubmit={handleSubmit}>
      <h2>Upload Artwork</h2>
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} required />
      {preview && <img className="preview" src={preview} alt="preview" />}
      <div className="ai-options">
        <div className="ai-options-heading">
          <span>Vision narrative</span>
          <span className={`provider-state ${llmStatus.configured ? "ready" : "offline"}`}>
            {llmStatus.loading ? "Checking" : llmStatus.configured ? "Available" : "Not configured"}
          </span>
        </div>
        <label className="consent-option">
          <input
            type="checkbox"
            checked={useLlm}
            disabled={!llmStatus.configured}
            onChange={(e) => setUseLlm(e.target.checked)}
          />
          <span>Include an AI narrative critique</span>
        </label>
        <p>
          When enabled, a resized copy is sent to the configured vision provider. OpenCV analysis always runs locally.
        </p>
        {useLlm && (
          <label className="artist-level">
            Experience level
            <select value={artistLevel} onChange={(e) => setArtistLevel(e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="student">Student</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
        )}
      </div>
      <button type="submit" disabled={!file || loading}>
        {loading ? (useLlm ? "Creating your critique…" : "Analyzing…") : "Upload & Get Feedback"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
