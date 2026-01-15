import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import MapView from './components/MapView'
import RequestForm from './components/RequestForm'
import ARView from './components/ARView'
import { subcategories, categories } from './data/categories'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showAR, setShowAR] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilters, setSubcategoryFilters] = useState([])
  const [sortBy, setSortBy] = useState('newest')
  const [mapBounds, setMapBounds] = useState(null)
  const [sharedRequest, setSharedRequest] = useState(null)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    // Check for shared request in URL
    const params = new URLSearchParams(window.location.search)
    const requestId = params.get('request')
    if (requestId) {
      fetchSharedRequest(requestId)
    }

    return () => subscription.unsubscribe()
  }, [])

  async function fetchSharedRequest(requestId) {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!error && data) {
      setSharedRequest(data)
    }
  }

  useEffect(() => {
    if (mapBounds) {
      fetchRequests()
    }
  }, [categoryFilter, subcategoryFilters, sortBy, session, mapBounds])

  function handleCategoryFilterChange(newCategory) {
    setCategoryFilter(newCategory)
    setSubcategoryFilters([]) // Reset subcategory filters when category changes
  }

  function toggleSubcategoryFilter(subcategory) {
    setSubcategoryFilters(prev =>
      prev.includes(subcategory)
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    )
  }

  function handleBoundsChange(bounds) {
    setMapBounds(bounds)
  }

  async function fetchRequests() {
    if (!mapBounds) return

    // Fetch requests within viewport bounds
    let query = supabase
      .from('requests')
      .select('*')
      .gte('latitude', mapBounds.south)
      .lte('latitude', mapBounds.north)
      .gte('longitude', mapBounds.west)
      .lte('longitude', mapBounds.east)

    // Apply sorting
    if (sortBy === 'votes') {
      query = query.order('score', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter)
    }

    if (subcategoryFilters.length > 0) {
      query = query.in('subcategory', subcategoryFilters)
    }

    const { data: requestsData, error: requestsError } = await query

    if (requestsError) {
      console.error('Error fetching requests:', requestsError)
      return
    }

    // Only fetch current user's votes (not everyone's)
    let userVotes = {}
    if (session?.user?.id) {
      const { data: votesData } = await supabase
        .from('votes')
        .select('request_id, vote_type')
        .eq('user_id', session.user.id)

      if (votesData) {
        votesData.forEach(vote => {
          userVotes[vote.request_id] = vote.vote_type
        })
      }
    }

    // Attach user's vote to each request
    const requestsWithUserVote = requestsData.map(request => ({
      ...request,
      userVote: userVotes[request.id] || null
    }))

    setRequests(requestsWithUserVote)
  }

  function handleMapClick(latlng) {
    if (!session) {
      alert('Please sign in to submit a request')
      return
    }
    setSelectedLocation(latlng)
    setShowForm(true)
  }

  function handleUseMyLocation() {
    if (!session) {
      alert('Please sign in to submit a request')
      return
    }
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setShowForm(true)
      },
      (error) => {
        alert('Unable to get your location: ' + error.message)
      }
    )
  }

  async function handleSubmitRequest(formData) {
    const { error } = await supabase.from('requests').insert({
      user_id: session.user.id,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      notes: formData.notes,
      category: formData.category,
      subcategory: formData.subcategory,
      urgency: formData.urgency
    })

    if (error) {
      alert('Error submitting request: ' + error.message)
    } else {
      setShowForm(false)
      setSelectedLocation(null)
      fetchRequests()
    }
  }

  function handleEdit(request) {
    setEditingRequest(request)
  }

  async function handleUpdateRequest(formData) {
    const { error } = await supabase
      .from('requests')
      .update({
        notes: formData.notes,
        category: formData.category,
        subcategory: formData.subcategory,
        urgency: formData.urgency
      })
      .eq('id', editingRequest.id)

    if (error) {
      alert('Error updating request: ' + error.message)
    } else {
      setEditingRequest(null)
      fetchRequests()
    }
  }

  async function handleDelete(requestId) {
    if (!confirm('Are you sure you want to delete this request?')) {
      return
    }

    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId)

    if (error) {
      alert('Error deleting request: ' + error.message)
    } else {
      fetchRequests()
    }
  }

  async function handleVote(requestId, voteType) {
    if (!session) {
      alert('Please sign in to vote')
      return
    }

    // Check if user already voted on this request
    const { data: existingVote } = await supabase
      .from('votes')
      .select()
      .eq('request_id', requestId)
      .eq('user_id', session.user.id)
      .single()

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if clicking same button
        await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id)
      } else {
        // Update vote if changing
        await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id)
      }
    } else {
      // Create new vote
      await supabase.from('votes').insert({
        request_id: requestId,
        user_id: session.user.id,
        vote_type: voteType
      })
    }

    fetchRequests()
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <header>
        <h1>UrbanLog</h1>
        <p className="tagline">Log improvements for your community</p>
        <Auth session={session} />
      </header>

      <div className="controls">
        <button
          className="btn btn-primary"
          onClick={handleUseMyLocation}
          disabled={!session}
        >
          Use My Location
        </button>
        <span className="hint">or click anywhere on the map</span>

        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => handleCategoryFilterChange(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="votes">Top Voted</option>
        </select>

        <button
          className="btn btn-ar"
          onClick={() => setShowAR(true)}
          title="View in AR (mobile only)"
        >
          AR View
        </button>
      </div>

      {categoryFilter !== 'all' && (
        <div className="subcategory-filters">
          {subcategories[categoryFilter].map((sub) => (
            <label key={sub} className={`subcategory-chip ${subcategoryFilters.includes(sub) ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={subcategoryFilters.includes(sub)}
                onChange={() => toggleSubcategoryFilter(sub)}
              />
              {sub}
            </label>
          ))}
        </div>
      )}

      <MapView
        requests={requests}
        onMapClick={handleMapClick}
        onVote={handleVote}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBoundsChange={handleBoundsChange}
        selectedLocation={selectedLocation}
        userId={session?.user?.id}
        sharedRequest={sharedRequest}
      />

      {showForm && (
        <RequestForm
          location={selectedLocation}
          onSubmit={handleSubmitRequest}
          onCancel={() => {
            setShowForm(false)
            setSelectedLocation(null)
          }}
        />
      )}

      {editingRequest && (
        <RequestForm
          location={{ lat: editingRequest.latitude, lng: editingRequest.longitude }}
          initialData={editingRequest}
          onSubmit={handleUpdateRequest}
          onCancel={() => setEditingRequest(null)}
          isEditing
        />
      )}

      {showAR && (
        <ARView onClose={() => setShowAR(false)} />
      )}
    </div>
  )
}

export default App
