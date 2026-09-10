import { useEffect, useState, useCallback } from "react";
import UploadForm from "./components/UploadForm.jsx";
import FeedbackCard from "./components/FeedbackCard.jsx";
import ArtworkGallery from "./components/ArtworkGallery.jsx";
import ProgressChart from "./components/ProgressChart.jsx";
import ExerciseRecommendations from "./components/ExerciseRecommendations.jsx";
import SiteFeedback from "./components/SiteFeedback.jsx";
import {
  deleteArtwork,
  generateArtworkNarrative,
  getProgress,
  getRecommendedExercises,
  listArtworks,
  updateArtworkTitle,
} from "./api";

const USER_ID = "demo-user";
const HERO_ARTWORK_STYLE = {
  backgroundImage: 'url("/grace-in-tradition.webp")',
};

export default function App() {
  const [artworks, setArtworks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [latestArtwork, setLatestArtwork] = useState(null);
  const [titleConfirmation, setTitleConfirmation] = useState("");
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
    setTitleConfirmation("");
    setLatestFeedback(result.feedback);
    setLatestArtwork(result.artwork);
    setExercises(result.recommended_exercises);
    await refreshAll();
  }

  async function handleTitleSelected(artworkId, title) {
    const updatedArtwork = await updateArtworkTitle(artworkId, title, USER_ID);
    setArtworks((current) => current.map((artwork) => (
      artwork.id === artworkId ? { ...artwork, title: updatedArtwork.title } : artwork
    )));
    setProgress((current) => current.map((point) => (
      point.artwork_id === artworkId
        ? { ...point, title: updatedArtwork.title }
        : point
    )));
    setLatestArtwork((current) => (
      current?.id === artworkId ? { ...current, title: updatedArtwork.title } : current
    ));
    return updatedArtwork;
  }

  async function handleUploadTitleSelected(title) {
    const updatedArtwork = await handleTitleSelected(latestArtwork.id, title);
    setTitleConfirmation(
      `Your artwork has been uploaded as “${updatedArtwork.title}”. Its feedback is saved in your gallery.`
    );
    return updatedArtwork;
  }

  async function handleNarrativeRequested(artworkId, artistLevel) {
    const feedback = await generateArtworkNarrative(artworkId, artistLevel, USER_ID);
    setArtworks((current) => current.map((artwork) => (
      artwork.id === artworkId ? { ...artwork, feedback } : artwork
    )));
    return feedback;
  }

  async function handleArtworkDeleted(artworkId) {
    await deleteArtwork(artworkId, USER_ID);
    setArtworks((current) => current.filter((artwork) => artwork.id !== artworkId));
    setProgress((current) => current.filter((point) => point.artwork_id !== artworkId));
    if (latestArtwork?.id === artworkId) {
      setLatestArtwork(null);
      setLatestFeedback(null);
      setTitleConfirmation("");
    }
  }

  function navigateTo(event, sectionId) {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (!section) return;
    window.history.pushState(null, "", `#${sectionId}`);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="app">
      <header>
        <nav aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="NilavuArt home" onClick={(event) => navigateTo(event, "top")}>
            <span className="brand-mark">N</span>
            <span>NilavuArt</span>
          </a>
          <div className="nav-links">
            <a href="#about" onClick={(event) => navigateTo(event, "about")}>About</a>
            <a href="#blog" onClick={(event) => navigateTo(event, "blog")}>Blog</a>
            <a href="#upload" onClick={(event) => navigateTo(event, "upload")}>Create</a>
            <a href="#practice" onClick={(event) => navigateTo(event, "practice")}>Practice</a>
            <a href="#progress" onClick={(event) => navigateTo(event, "progress")}>Progress</a>
            <a href="#gallery" onClick={(event) => navigateTo(event, "gallery")}>Gallery</a>
            <a href="#feedback" onClick={(event) => navigateTo(event, "feedback")}>Feedback</a>
          </div>
          <a className="nav-cta" href="#upload" onClick={(event) => navigateTo(event, "upload")}>Upload art <span>↗</span></a>
        </nav>

        <div className="hero" id="top">
          <div className="hero-copy">
            <span className="eyebrow">Illuminate Your Creativity</span>
            <h1>ART<br /><em>REIMAGINED</em></h1>
            <p>Turn every creation into your next breakthrough with thoughtful analysis and personalized practice.</p>
            <a className="hero-cta" href="#upload" onClick={(event) => navigateTo(event, "upload")}><span>Start creating</span><b>↗</b></a>
          </div>

          <div className="hero-art" aria-label="Featured artwork composition">
            <div className="art-frame art-frame-small" style={HERO_ARTWORK_STYLE}><span>VISION</span></div>
            <div className="art-frame art-frame-main" style={HERO_ARTWORK_STYLE}><span>CREATE</span></div>
            <div className="art-frame art-frame-tall" style={HERO_ARTWORK_STYLE}><span>GROW</span></div>
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
              <span><b>Built with</b> React, FastAPI, OpenCV, SQLite &amp; GPT-4.1 mini</span>
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
          <FeedbackCard
            feedback={latestFeedback}
            showTitleSuggestions
            titleSuggestionKey={latestArtwork?.id}
            onTitleSelected={latestArtwork
              ? handleUploadTitleSelected
              : undefined}
          />
          {titleConfirmation && (
            <p className="upload-success upload-title-confirmation" role="status">
              ✓ {titleConfirmation}
            </p>
          )}
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
          <ArtworkGallery
            artworks={artworks}
            onNarrativeRequested={handleNarrativeRequested}
            onArtworkDeleted={handleArtworkDeleted}
          />
        </section>

        <SiteFeedback />
      </main>
    </div>
  );
}
