import { useState } from 'react'

export default function RequestForm({ location, onSubmit, onCancel }) {
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('other')
  const [urgency, setUrgency] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!notes.trim()) {
      alert('Please add some notes describing the request')
      return
    }
    setSubmitting(true)
    await onSubmit({ notes, category, urgency })
    setSubmitting(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>New Request</h2>
        <p className="location-display">
          Location: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="transit">Transit (bus stops, bike lanes, etc.)</option>
              <option value="safety">Safety (speeding, lighting, etc.)</option>
              <option value="beautification">Beautification (murals, gardens, etc.)</option>
              <option value="accessibility">Accessibility (ramps, crossings, etc.)</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="urgency">Urgency</label>
            <select
              id="urgency"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              <option value="low">Low - Nice to have</option>
              <option value="medium">Medium - Should be addressed</option>
              <option value="high">High - Urgent issue</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Description</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what improvement you'd like to see here..."
              rows={4}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
