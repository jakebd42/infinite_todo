import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'

// Category colors matching the map
const categoryColors = {
  transit: '#3b82f6',
  safety: '#ef4444',
  beautification: '#22c55e',
  accessibility: '#a855f7',
  other: '#6b7280'
}

export default function ARView({ onClose }) {
  const [requests, setRequests] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const sceneRef = useRef(null)

  useEffect(() => {
    // Load A-Frame and AR.js scripts dynamically
    const loadScripts = async () => {
      if (!document.querySelector('script[src*="aframe"]')) {
        const aframe = document.createElement('script')
        aframe.src = 'https://aframe.io/releases/1.4.0/aframe.min.js'
        document.head.appendChild(aframe)
        await new Promise(resolve => aframe.onload = resolve)
      }

      if (!document.querySelector('script[src*="aframe-ar"]')) {
        const arjs = document.createElement('script')
        arjs.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js'
        document.head.appendChild(arjs)
        await new Promise(resolve => arjs.onload = resolve)
      }

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setUserLocation(loc)
            await fetchNearbyRequests(loc)
            setLoading(false)
          },
          (err) => {
            setError('Could not get your location: ' + err.message)
            setLoading(false)
          },
          { enableHighAccuracy: true }
        )
      } else {
        setError('Geolocation not supported')
        setLoading(false)
      }
    }

    loadScripts()

    // Cleanup
    return () => {
      // Remove AR scene elements if needed
    }
  }, [])

  async function fetchNearbyRequests(location) {
    // Fetch requests within ~500m radius (rough approximation)
    const latRange = 0.005 // ~500m
    const lngRange = 0.006

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .gte('latitude', location.lat - latRange)
      .lte('latitude', location.lat + latRange)
      .gte('longitude', location.lng - lngRange)
      .lte('longitude', location.lng + lngRange)
      .limit(20)

    if (error) {
      console.error('Error fetching requests:', error)
    } else {
      setRequests(data || [])
    }
  }

  if (loading) {
    return (
      <div className="ar-overlay">
        <div className="ar-loading">
          <p>Starting AR...</p>
          <p className="ar-hint">Allow camera and location access when prompted</p>
        </div>
        <button className="ar-close" onClick={onClose}>Exit AR</button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ar-overlay">
        <div className="ar-error">
          <p>{error}</p>
          <p className="ar-hint">AR requires camera and GPS access on a mobile device</p>
        </div>
        <button className="ar-close" onClick={onClose}>Exit AR</button>
      </div>
    )
  }

  return (
    <div className="ar-overlay">
      <button className="ar-close" onClick={onClose}>Exit AR</button>
      <div className="ar-count">{requests.length} requests nearby</div>

      {/* A-Frame AR Scene */}
      <a-scene
        ref={sceneRef}
        vr-mode-ui="enabled: false"
        arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false;"
        renderer="antialias: true; alpha: true"
        embedded
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <a-camera gps-camera rotation-reader></a-camera>

        {requests.map((request) => (
          <a-entity
            key={request.id}
            gps-entity-place={`latitude: ${request.latitude}; longitude: ${request.longitude}`}
          >
            {/* Marker sphere */}
            <a-sphere
              radius="2"
              color={categoryColors[request.category] || categoryColors.other}
              opacity="0.8"
              position="0 3 0"
            ></a-sphere>

            {/* Label */}
            <a-text
              value={request.subcategory || request.category}
              align="center"
              color="#ffffff"
              position="0 6 0"
              scale="8 8 8"
              look-at="[gps-camera]"
            ></a-text>
          </a-entity>
        ))}
      </a-scene>
    </div>
  )
}
