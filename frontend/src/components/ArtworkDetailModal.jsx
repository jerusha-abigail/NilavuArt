import { useEffect, useRef } from "react";
import { useState } from "react";
import FeedbackCard from "./FeedbackCard.jsx";

export default function ArtworkDetailModal({
  artwork,
  onClose,
  onNarrativeRequested,
  onDelete,
}) {
  const closeButtonRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    setDeleteStatus("deleting");
    setDeleteError("");
    try {
      await onDelete();
    } catch (error) {
      setDeleteStatus("idle");
      setDeleteError(error.message || "The artwork could not be deleted.");
    }
  }

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
            <div className="artwork-delete-actions">
              {!confirmDelete ? (
                <button type="button" onClick={() => setConfirmDelete(true)}>
                  Delete artwork
                </button>
              ) : (
                <div className="delete-confirmation" role="alert">
                  <span>This permanently removes the artwork and its feedback.</span>
                  <div>
                    <button type="button" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </button>
                    <button
                      className="confirm-delete-button"
                      type="button"
                      disabled={deleteStatus === "deleting"}
                      onClick={handleDelete}
                    >
                      {deleteStatus === "deleting" ? "Deleting…" : "Delete permanently"}
                    </button>
                  </div>
                </div>
              )}
              {deleteError && <p className="delete-error">{deleteError}</p>}
            </div>
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
