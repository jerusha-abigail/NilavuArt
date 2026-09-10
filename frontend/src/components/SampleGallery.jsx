import { useEffect, useRef, useState } from "react";
import { SAMPLE_ARTWORKS } from "../data/sampleArtworks.js";
import FeedbackCard from "./FeedbackCard.jsx";

export default function SampleGallery() {
  const [selected, setSelected] = useState(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!selected) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const close = (event) => event.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", close, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close, true);
    };
  }, [selected]);

  return (
    <section className="sample-section" id="samples">
      <div className="sample-heading">
        <div>
          <span className="section-kicker">Artist showcase</span>
          <h2>Sample works by<br /><em>Jerusha Arun.</em></h2>
        </div>
        <p>
          Explore finished works from the creator of NilavuArtStudio. These public samples are separate from each user’s private gallery.
        </p>
      </div>
      <div className="sample-grid">
        {SAMPLE_ARTWORKS.map((sample, index) => (
          <button
            className={`sample-card sample-card-${(index % 3) + 1}`}
            type="button"
            key={sample.title}
            onClick={() => setSelected(sample)}
          >
            <img src={sample.image} alt={sample.title} loading="lazy" />
            <span className="sample-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="sample-info">
              <strong>{sample.title}</strong>
              <small>Jerusha Arun · View sample feedback</small>
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="artwork-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="artwork-modal sample-feedback-modal" role="dialog" aria-modal="true" aria-labelledby="sample-title">
            <button ref={closeButtonRef} type="button" className="artwork-modal-close" aria-label="Close sample feedback" onClick={() => setSelected(null)}>×</button>
            <div className="artwork-modal-visual">
              <img src={selected.image} alt={selected.title} />
              <div>
                <span className="section-kicker">Sample artwork + feedback</span>
                <h2 id="sample-title">{selected.title}</h2>
                <p className="modal-artwork-author">by Jerusha Arun</p>
              </div>
            </div>
            <div className="artwork-modal-feedback">
              <FeedbackCard feedback={selected.feedback} />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
