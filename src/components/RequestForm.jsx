import { useState } from 'react'
import { subcategories, categories } from '../data/categories'

export default function RequestForm({ location, initialData, onSubmit, onCancel, isEditing }) {
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [category, setCategory] = useState(initialData?.category || 'safety')
  const [subcategory, setSubcategory] = useState(
    initialData?.subcategory || subcategories[initialData?.category || 'safety'][0]
  )
  const [urgency, setUrgency] = useState(initialData?.urgency || 'medium')
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
        <h2>{isEditing ? 'Edit Request' : 'New Request'}</h2>
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
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
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
              {submitting ? (isEditing ? 'Saving...' : 'Submitting...') : (isEditing ? 'Save Changes' : 'Submit Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
