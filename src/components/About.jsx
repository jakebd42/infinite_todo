export default function About({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal about-modal">
        <h2>About</h2>

        <p>
          This is a vibe-coded project for <strong>Strong Towns PDX</strong> by Jake Dennie-Lu
        </p>

        <p>
          The background map is from <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>, a crowd-sourced, open-source map. Issue any corrections to the underlying map there.
        </p>

        <p>
          Please engage in good faith
        </p>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
