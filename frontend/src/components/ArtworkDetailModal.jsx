import { useEffect, useRef } from "react";
import FeedbackCard from "./FeedbackCard.jsx";

export default function ArtworkDetailModal({
  artwork,
  onClose,
  onNarrativeRequested,
}) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose]);

  return (
    <div
      className="artwork-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="artwork-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="artwork-modal-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <button
          ref={closeButtonRef}
          className="artwork-modal-close"
          type="button"
          aria-label="Close saved feedback"
          onClick={onClose}
        >
          ×
        </button>

        <div className="artwork-modal-visual">
          <img src={artwork.image_url} alt={artwork.title} />
          <div>
            <span className="section-kicker">Saved artwork</span>
            <h2 id="artwork-modal-title">{artwork.title}</h2>
            <p className="modal-artwork-author">by {artwork.author_name || "Anonymous Artist"}</p>
            <p>{new Date(artwork.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="artwork-modal-feedback">
          {artwork.feedback ? (
            <FeedbackCard
              feedback={artwork.feedback}
              onNarrativeRequested={onNarrativeRequested}
            />
          ) : (
            <p className="empty">No feedback was saved for this artwork.</p>
          )}
        </div>
      </section>
    </div>
  );
}
