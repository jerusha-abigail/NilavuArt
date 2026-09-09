export default function ArtworkGallery({ artworks }) {
  if (!artworks.length) {
    return <p className="empty">No artworks uploaded yet. Upload one to get started!</p>;
  }

  return (
    <div className="gallery">
      {artworks
        .slice()
        .reverse()
        .map((a) => (
          <div className="gallery-item card" key={a.id}>
            <img src={a.image_url} alt={a.title} />
            <div className="gallery-meta">
              <strong>{a.title}</strong>
              {a.feedback && <span className="mini-score">{Math.round(a.feedback.overall_score)}/100</span>}
              <small>{new Date(a.created_at).toLocaleDateString()}</small>
            </div>
          </div>
        ))}
    </div>
  );
}
