import { useState } from 'react'

const subcategories = {
  safety: [
    'Daylight intersection',
    'Crosswalk needed',
    'Modal filter',
    '4-way stop',
    'Dangerous slip lane',
    'Speed reduction needed',
    'Better lighting',
    'Protected bike lane',
    'Signal timing issue',
    'Other'
  ],
  transit: [
    'Bus stop bench',
    'Bus shelter',
    'Frequent conflicts/slowness',
    'Bike parking',
    'Route suggestion',
    'Other'
  ],
  beautification: [
    'Mural opportunity',
    'Placemaking street art',
    'Easement needs love',
    'Tree planting',
    'Community garden',
    'Trash/litter cleanup',
    'Other'
  ],
  accessibility: [
    'Steep curb dropoff',
    'Drainage issue',
    'Sidewalk break',
    'Audible crossing signal',
    'Tactile paving needed',
    'Ramp needed',
    'Other'
  ],
  other: ['Other']
}

export default function RequestForm({ location, onSubmit, onCancel }) {
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('safety')
  const [subcategory, setSubcategory] = useState(subcategories.safety[0])
  const [urgency, setUrgency] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  function handleCategoryChange(newCategory) {
    setCategory(newCategory)
    setSubcategory(subcategories[newCategory][0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!notes.trim()) {
      alert('Please add some notes describing the request')
      return
    }
    setSubmitting(true)
    await onSubmit({ notes, category, subcategory, urgency })
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
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="safety">Safety</option>
              <option value="transit">Transit</option>
              <option value="beautification">Beautification</option>
              <option value="accessibility">Accessibility</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subcategory">Type</label>
            <select
              id="subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            >
              {subcategories[category].map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
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
