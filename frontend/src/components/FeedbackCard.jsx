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

export default function FeedbackCard({ feedback }) {
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
