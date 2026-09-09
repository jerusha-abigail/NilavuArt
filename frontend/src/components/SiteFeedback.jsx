import { useState } from "react";
import { submitSiteFeedback } from "../api";

const CATEGORIES = [
  ["general", "Overall experience"],
  ["artwork_feedback", "Artwork analysis"],
  ["exercises", "Practice exercises"],
  ["idea", "Feature idea"],
  ["issue", "Something went wrong"],
];

export default function SiteFeedback() {
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("general");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      await submitSiteFeedback({
        display_name: displayName,
        category,
        rating,
        message,
        website: "",
      });
      setStatus("complete");
      setDisplayName("");
      setCategory("general");
      setRating(0);
      setMessage("");
    } catch (requestError) {
      setStatus("idle");
      setError(requestError.message);
    }
  }

  return (
    <section className="visitor-feedback" id="feedback">
      <div className="feedback-intro">
        <span className="section-kicker">Shape what comes next</span>
        <h2>Your voice<br /><em>matters.</em></h2>
        <p>
          NilavuArt is built for young artists. Share what helped, what felt confusing, or what would make your creative journey better.
        </p>
        <div className="feedback-privacy">
          <span aria-hidden="true">✦</span>
          Submissions are private and reviewed before anything is shared.
        </div>
      </div>

      {status === "complete" ? (
        <div className="feedback-thanks" role="status">
          <span aria-hidden="true">✓</span>
          <h3>Thank you for helping NilavuArt grow.</h3>
          <p>Your feedback was received and will help guide future improvements.</p>
          <button type="button" onClick={() => setStatus("idle")}>Send another response</button>
        </div>
      ) : (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-form-row">
            <label>
              Name <small>optional</small>
              <input
                value={displayName}
                maxLength={50}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Anonymous"
              />
            </label>
            <label>
              Topic
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {CATEGORIES.map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="rating-field">
            <legend>How was your experience?</legend>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={value <= rating ? "selected" : ""}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={value === rating}
                  onClick={() => setRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            Your feedback
            <textarea
              value={message}
              minLength={10}
              maxLength={1200}
              rows={6}
              required
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell me about your experience or share an idea…"
            />
            <small className="character-count">{message.length}/1200</small>
          </label>

          <button
            className="feedback-submit"
            type="submit"
            disabled={rating === 0 || message.trim().length < 10 || status === "submitting"}
          >
            {status === "submitting" ? "Sending…" : "Send feedback"}
            <span aria-hidden="true">↗</span>
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </section>
  );
}
