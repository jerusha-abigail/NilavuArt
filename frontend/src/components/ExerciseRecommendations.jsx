export default function ExerciseRecommendations({ exercises }) {
  if (!exercises.length) {
    return null;
  }

  return (
    <div className="card">
      <h2>Recommended Exercises</h2>
      <div className="exercise-list">
        {exercises.map((ex) => (
          <div className="exercise-item" key={ex.id}>
            <div className="exercise-header">
              <strong>{ex.title}</strong>
              <span className={`difficulty ${ex.difficulty}`}>{ex.difficulty}</span>
            </div>
            <p>{ex.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
