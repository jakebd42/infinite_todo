import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import MapView from './components/MapView'
import RequestForm from './components/RequestForm'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [filter, setFilter] = useState('all')

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

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [filter])

  async function fetchRequests() {
    let query = supabase
      .from('requests')
      .select(`
        *,
        votes (vote_type, user_id)
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('category', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching requests:', error)
    } else {
      // Calculate vote counts
      const requestsWithVotes = data.map(request => {
        const upvotes = request.votes?.filter(v => v.vote_type === 'up').length || 0
        const downvotes = request.votes?.filter(v => v.vote_type === 'down').length || 0
        return {
          ...request,
          upvotes,
          downvotes,
          score: upvotes - downvotes
        }
      })
      setRequests(requestsWithVotes)
    }
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
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="transit">Transit</option>
          <option value="safety">Safety</option>
          <option value="beautification">Beautification</option>
          <option value="accessibility">Accessibility</option>
          <option value="other">Other</option>
        </select>
      </div>

      <MapView
        requests={requests}
        onMapClick={handleMapClick}
        onVote={handleVote}
        selectedLocation={selectedLocation}
        userId={session?.user?.id}
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
    </div>
  )
}

export default App
