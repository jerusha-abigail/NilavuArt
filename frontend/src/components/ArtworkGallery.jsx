import { useCallback, useState } from "react";
import ArtworkDetailModal from "./ArtworkDetailModal.jsx";

export default function ArtworkGallery({ artworks, onNarrativeRequested, onArtworkDeleted }) {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const closeDetails = useCallback(() => setSelectedArtwork(null), []);

  async function generateSavedNarrative(artistLevel) {
    const feedback = await onNarrativeRequested(selectedArtwork.id, artistLevel);
    setSelectedArtwork((current) => ({ ...current, feedback }));
  }

  async function deleteSelectedArtwork() {
    await onArtworkDeleted(selectedArtwork.id);
    setSelectedArtwork(null);
  }

  if (!artworks.length) {
    return <p className="empty">No artworks uploaded yet. Upload one to get started!</p>;
  }

  return (
    <>
      <div className="gallery">
        {artworks
          .slice()
          .reverse()
          .map((a) => (
            <div className="gallery-item card" key={a.id}>
              <button
                className="gallery-image-button"
                type="button"
                aria-label={`View saved feedback for ${a.title}`}
                onClick={() => setSelectedArtwork(a)}
              >
                <img src={a.image_url} alt={a.title} />
                <span>View feedback</span>
              </button>
              <div className="gallery-meta">
                <strong>{a.title}</strong>
                <span className="artwork-author">by {a.author_name || "Anonymous Artist"}</span>
                {a.feedback && <span className="mini-score">{Math.round(a.feedback.overall_score)}/100</span>}
                <small>{new Date(a.created_at).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
      </div>
      {selectedArtwork && (
        <ArtworkDetailModal
          artwork={selectedArtwork}
          onClose={closeDetails}
          onNarrativeRequested={generateSavedNarrative}
          onDelete={deleteSelectedArtwork}
        />
      )}
    </>
  );
}
