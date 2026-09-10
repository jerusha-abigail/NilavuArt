import { useState } from "react";

const METRIC_LABELS = {
  brightness: "Brightness",
  contrast: "Contrast",
  color_balance: "Color Balance",
  composition: "Composition",
  line_quality: "Line Quality",
  saturation: "Saturation",
};

const NARRATIVE_ERRORS = {
  not_configured: "Vision narratives are not configured. Your local OpenCV feedback is shown instead.",
  invalid_credentials: "The vision provider rejected the API key. Check or replace the backend key.",
  quota_exhausted: "The vision provider account has no API credits remaining. Add credits, then try again.",
  rate_limited: "The vision provider is receiving too many requests. Wait briefly, then try again.",
  model_unavailable: "The configured vision model is unavailable. Check OPENAI_VISION_MODEL.",
  provider_error: "The vision provider could not complete this critique. Your local OpenCV feedback is shown instead.",
  unavailable: "The vision narrative was unavailable, so your local OpenCV feedback is shown instead.",
};

export default function FeedbackCard({
  feedback,
  onTitleSelected,
  onNarrativeRequested,
  showTitleSuggestions = false,
}) {
  if (!feedback) return null;
  const {
    overall_score,
    scores,
    summary,
    suggestions,
    narrative_feedback: narrative,
    narrative_status: narrativeStatus,
  } = feedback;

  return (
    <div className="card feedback-card">
      <div className="score-badge">{Math.round(overall_score)}</div>
      <h3>{summary}</h3>
      <ul className="score-list">
        {Object.entries(scores).map(([key, value]) => (
          <li key={key}>
            <span>{METRIC_LABELS[key] || key}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${value}%` }} />
            </div>
            <span>{Math.round(value)}</span>
          </li>
        ))}
      </ul>
      <h4>Suggestions</h4>
      <ul className="suggestions">
        {suggestions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      {NARRATIVE_ERRORS[narrativeStatus] && (
        <p className="narrative-unavailable">
          {NARRATIVE_ERRORS[narrativeStatus]}
        </p>
      )}
      {narrative && (
        <div className="narrative-feedback">
          <div className="narrative-heading">
            <span>AI studio critique</span>
            <small>{narrative.model}</small>
          </div>
          <p className="narrative-copy">{narrative.narrative}</p>
          {showTitleSuggestions && narrative.title_suggestions?.length > 0 && (
            <TitleSuggestions
              titles={narrative.title_suggestions}
              onTitleSelected={onTitleSelected}
            />
          )}
          <div className="critique-columns">
            <CritiqueList title="What’s working" items={narrative.strengths} />
            <CritiqueList title="Areas to grow" items={narrative.growth_areas} />
            <CritiqueList title="Next steps" items={narrative.next_steps} />
          </div>
          <div className="narrative-exercise">
            <span>Try this next</span>
            <p>{narrative.recommended_exercise}</p>
          </div>
          <small className="ai-disclaimer">AI-generated feedback is subjective and may be inaccurate.</small>
        </div>
      )}
      {!narrative && onNarrativeRequested && (
        <GenerateNarrative onGenerate={onNarrativeRequested} />
      )}
    </div>
  );
}

function GenerateNarrative({ onGenerate }) {
  const [artistLevel, setArtistLevel] = useState("student");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleGenerate() {
    setStatus("loading");
    setError("");
    try {
      await onGenerate(artistLevel);
      setStatus("complete");
    } catch (requestError) {
      setStatus("idle");
      setError(requestError.message || "The AI critique could not be generated.");
    }
  }

  return (
    <div className="generate-narrative">
      <span className="generate-narrative-kicker">Add detailed feedback</span>
      <h4>This artwork has local analysis only.</h4>
      <p>
        It was saved without an AI narrative. Generate the missing What’s Working,
        Areas to Grow, Next Steps, and exercise now.
      </p>
      <label>
        Experience level
        <select value={artistLevel} onChange={(event) => setArtistLevel(event.target.value)}>
          <option value="beginner">Beginner</option>
          <option value="student">Student</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </label>
      <button type="button" disabled={status === "loading"} onClick={handleGenerate}>
        {status === "loading" ? "Creating critique…" : "Generate & save AI critique"}
      </button>
      <small>A resized copy will be sent to the configured vision provider.</small>
      {error && <p className="title-save-error">{error}</p>}
    </div>
  );
}

function TitleSuggestions({ titles, onTitleSelected }) {
  const [selectedTitle, setSelectedTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState("");
  const [error, setError] = useState("");

  async function selectTitle(title) {
    if (!onTitleSelected) return;
    setSavingTitle(title);
    setError("");
    try {
      await onTitleSelected(title);
      setSelectedTitle(title);
    } catch (requestError) {
      setError(requestError.message || "The title could not be saved.");
    } finally {
      setSavingTitle("");
    }
  }

  if (selectedTitle) return null;

  return (
    <div className="title-recommendations">
      <div className="title-recommendations-heading">
        <span>Title ideas</span>
        <small>Select one to name your artwork</small>
      </div>
      <div className="title-recommendation-list">
        {titles.map((title) => (
          <button
            type="button"
            key={title}
            disabled={!onTitleSelected || Boolean(savingTitle)}
            className={selectedTitle === title ? "selected" : ""}
            onClick={() => selectTitle(title)}
          >
            <span>“{title}”</span>
            <small>
              {savingTitle === title
                ? "Saving…"
                : selectedTitle === title
                  ? "Applied ✓"
                  : "Use title"}
            </small>
          </button>
        ))}
      </div>
      {error && <p className="title-save-error">{error}</p>}
    </div>
  );
}

function CritiqueList({ title, items }) {
  return (
    <div>
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}
