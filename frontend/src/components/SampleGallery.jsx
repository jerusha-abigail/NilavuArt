import { useEffect, useState } from "react";

const SAMPLES = [
  { title: "Between Light and Shadow", image: "/samples/between-light-and-shadow.webp" },
  { title: "Emerald Gaze", image: "/samples/emerald-gaze.webp" },
  { title: "Night Bloom", image: "/samples/night-bloom.webp" },
  { title: "The Art of Listening", image: "/samples/the-art-of-listening.webp" },
  { title: "Grace in Tradition", image: "/samples/grace-in-tradition.webp" },
  { title: "Silent Night Reflection", image: "/samples/silent-night-reflection.webp" },
  { title: "Tender Koala Embrace", image: "/samples/tender-koala-embrace.webp" },
  { title: "Veil of Thought", image: "/samples/veil-of-thought.webp" },
  { title: "Four Friends on a Branch", image: "/samples/four-friends-on-a-branch.webp" },
  { title: "Quiet Strength in Black and White", image: "/samples/quiet-strength-in-black-and-white.webp" },
];

export default function SampleGallery() {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!selected) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
        {SAMPLES.map((sample, index) => (
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
              <small>Jerusha Arun · Original artwork</small>
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="sample-lightbox" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="sample-title">
            <button type="button" className="sample-close" aria-label="Close sample artwork" onClick={() => setSelected(null)}>×</button>
            <img src={selected.image} alt={selected.title} />
            <div>
              <span className="section-kicker">Sample artwork</span>
              <h2 id="sample-title">{selected.title}</h2>
              <p>Jerusha Arun · Original artwork</p>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
