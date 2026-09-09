import { useEffect, useState, useCallback } from "react";
import UploadForm from "./components/UploadForm.jsx";
import FeedbackCard from "./components/FeedbackCard.jsx";
import ArtworkGallery from "./components/ArtworkGallery.jsx";
import ProgressChart from "./components/ProgressChart.jsx";
import ExerciseRecommendations from "./components/ExerciseRecommendations.jsx";
import SiteFeedback from "./components/SiteFeedback.jsx";
import { listArtworks, getProgress, getRecommendedExercises } from "./api";

const USER_ID = "demo-user";

export default function App() {
  const [artworks, setArtworks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const refreshAll = useCallback(async () => {
    try {
      const [artworksRes, progressRes, exercisesRes] = await Promise.all([
        listArtworks(USER_ID),
        getProgress(USER_ID),
        getRecommendedExercises(USER_ID),
      ]);
      setArtworks(artworksRes);
      setProgress(progressRes.points);
      setExercises(exercisesRes.recommended_exercises);
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  async function handleUploaded(result) {
    setLatestFeedback(result.feedback);
    setExercises(result.recommended_exercises);
    await refreshAll();
  }

  const featuredArtwork = artworks.at(-1)?.image_url;
  const artworkStyle = featuredArtwork
    ? { backgroundImage: `url(${featuredArtwork})` }
    : undefined;

  return (
    <div className="app">
      <header>
        <nav aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="NilavuArt home">
            <span className="brand-mark">N</span>
            <span>NilavuArt</span>
          </a>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#blog">Blog</a>
            <a href="#upload">Create</a>
            <a href="#practice">Practice</a>
            <a href="#progress">Progress</a>
            <a href="#gallery">Gallery</a>
            <a href="#feedback">Feedback</a>
          </div>
          <a className="nav-cta" href="#upload">Upload art <span>↗</span></a>
        </nav>

        <div className="hero" id="top">
          <div className="hero-copy">
            <span className="eyebrow">Illuminate Your Creativity</span>
            <h1>ART<br /><em>REIMAGINED</em></h1>
            <p>Turn every creation into your next breakthrough with thoughtful analysis and personalized practice.</p>
            <a className="hero-cta" href="#upload"><span>Start creating</span><b>↗</b></a>
          </div>

          <div className="hero-art" aria-label="Featured artwork composition">
            <div className="art-frame art-frame-small" style={artworkStyle}><span>VISION</span></div>
            <div className="art-frame art-frame-main" style={artworkStyle}><span>CREATE</span></div>
            <div className="art-frame art-frame-tall" style={artworkStyle}><span>GROW</span></div>
            <div className="art-ring" />
          </div>
        </div>
      </header>

      {loadError && <p className="error">{loadError}</p>}

      <main>
        <section className="about-section" id="about">
          <div className="about-portrait-wrap">
            <img
              className="about-portrait"
              src="/jerusha-arun.jpg"
              alt="Jerusha Arun"
            />
            <span className="about-number" aria-hidden="true">01</span>
          </div>
          <div className="about-heading">
            <span className="section-kicker">Meet the creator</span>
            <h2>Art, curiosity<br />&amp; <em>code.</em></h2>
            <div className="creator-name">
              <strong>Jerusha Arun</strong>
              <span>High school artist &amp; developer</span>
            </div>
          </div>
          <div className="about-copy">
            <p className="about-lead">
              I’m a high school senior exploring how technology can help young artists grow with confidence.
            </p>
            <p>
              I created NilavuArt to bring thoughtful, immediate feedback into the creative process. It combines my interests in visual art, computer vision, and building tools that make learning feel personal.
            </p>
            <div className="name-story">
              <span>Why NilavuArt?</span>
              <p>
                “Nilavu” means moonlight in Tamil. I chose the name because moonlight gently reveals what is already there—just as thoughtful feedback can illuminate an artist’s strengths and help their creativity grow.
              </p>
            </div>
            <div className="about-details">
              <span><b>Year</b> Senior</span>
              <span><b>Focus</b> Art + Technology</span>
              <span><b>Built with</b> React, Python &amp; OpenCV</span>
              <span><b>Mission</b> Illuminate creativity</span>
            </div>
            <a
              className="social-link"
              href="https://www.instagram.com/nilavuartstudio/"
              target="_blank"
              rel="noreferrer"
            >
              Follow @nilavuartstudio <span>↗</span>
            </a>
          </div>
        </section>

        <section className="blog-section" id="blog">
          <div className="blog-meta">
            <span className="section-kicker">From the studio journal</span>
            <span>01 · Computer Vision</span>
          </div>
          <div className="blog-feature">
            <div className="blog-monogram" aria-hidden="true">CV</div>
            <div className="blog-copy">
              <span className="blog-date">September 2026 · 6 min read</span>
              <h2>How I Used Computer Vision to Help Young Artists Improve</h2>
              <p>
                A behind-the-scenes look at how I combined OpenCV, thoughtful design, and my own experience as a student artist to build feedback that is immediate, explainable, and encouraging.
              </p>
              <a className="blog-link" href="#blog-article">
                Read the story <span>↗</span>
              </a>
            </div>
          </div>
          <article className="blog-article" id="blog-article">
            <p className="blog-dropcap">
              Young artists often wait days or weeks for meaningful feedback. I wanted to explore whether computer vision could offer a useful first response—not as a replacement for an art teacher, but as a private practice companion.
            </p>
            <div>
              <h3>Making feedback explainable</h3>
              <p>
                NilavuArt measures visual qualities such as brightness, contrast, color balance, saturation, line density, and composition. Every score comes from a clear image measurement, so artists can understand why a suggestion appeared.
              </p>
            </div>
            <div>
              <h3>Building as a student</h3>
              <p>
                The project connects a React interface to a Python and FastAPI backend. OpenCV analyzes each uploaded image, SQLite records progress, and the weakest visual areas guide personalized practice exercises.
              </p>
            </div>
          </article>
        </section>

        <section className="upload-section" id="upload">
          <UploadForm userId={USER_ID} onUploaded={handleUploaded} />
          <FeedbackCard feedback={latestFeedback} />
        </section>

        <section id="practice">
          <ExerciseRecommendations exercises={exercises} />
        </section>

        <section id="progress">
          <ProgressChart points={progress} />
        </section>

        <section className="gallery-section" id="gallery">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Creative journey</span>
              <h2>Your Gallery</h2>
            </div>
            <span className="artwork-count">{artworks.length} {artworks.length === 1 ? "artwork" : "artworks"}</span>
          </div>
          <ArtworkGallery artworks={artworks} />
        </section>

        <SiteFeedback />
      </main>
    </div>
  );
}
