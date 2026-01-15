import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'react-leaflet-cluster/lib/assets/MarkerCluster.css'
import 'react-leaflet-cluster/lib/assets/MarkerCluster.Default.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker colors by category
const categoryColors = {
  transit: '#3b82f6',      // blue
  safety: '#ef4444',       // red
  beautification: '#22c55e', // green
  accessibility: '#a855f7',  // purple
  other: '#6b7280'          // gray
}

function createCategoryIcon(category) {
  const color = categoryColors[category] || categoryColors.other
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

const selectedIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: #f97316;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    animation: pulse 1s infinite;
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
})

function MapEventHandler({ onClick, onBoundsChange }) {
  const map = useMapEvents({
    click: (e) => {
      onClick(e.latlng)
    },
    moveend: () => {
      const bounds = map.getBounds()
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      })
    },
    load: () => {
      const bounds = map.getBounds()
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      })
    }
  })

  // Fire initial bounds on mount
  useEffect(() => {
    const bounds = map.getBounds()
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    })
  }, [])

  return null
}

function FlyToShared({ sharedRequest }) {
  const map = useMap()

  useEffect(() => {
    if (sharedRequest) {
      map.flyTo([sharedRequest.latitude, sharedRequest.longitude], 17, {
        duration: 1.5
      })
    }
  }, [sharedRequest, map])

  return null
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function MapView({ requests, onMapClick, onVote, onEdit, onDelete, onBoundsChange, selectedLocation, userId, sharedRequest }) {
  // Default center: Downtown Portland, OR
  const defaultCenter = [45.5152, -122.6784]
  const defaultZoom = 14

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="map-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapEventHandler onClick={onMapClick} onBoundsChange={onBoundsChange} />
      <FlyToShared sharedRequest={sharedRequest} />

      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
          <Popup>New request location</Popup>
        </Marker>
      )}

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
      >
        {requests.map((request) => (
          <Marker
            key={request.id}
            position={[request.latitude, request.longitude]}
            icon={createCategoryIcon(request.category)}
          >
            <Popup>
              <div className="popup-content">
                <span className={`category-badge category-${request.category}`}>
                  {request.category}
                </span>
                <span className={`urgency-badge urgency-${request.urgency}`}>
                  {request.urgency}
                </span>

                {request.subcategory && (
                  <p className="popup-subcategory">{request.subcategory}</p>
                )}

                <p className="popup-notes">{request.notes}</p>

                <p className="popup-date">
                  {formatDate(request.created_at)}
                </p>

                <div className="vote-section">
                  <button
                    className={`vote-btn vote-up ${request.userVote === 'up' ? 'voted' : ''}`}
                    onClick={() => onVote(request.id, 'up')}
                    title="Upvote"
                  >
                    +{request.upvotes}
                  </button>
                  <span className="vote-score">{request.score}</span>
                  <button
                    className={`vote-btn vote-down ${request.userVote === 'down' ? 'voted' : ''}`}
                    onClick={() => onVote(request.id, 'down')}
                    title="Downvote"
                  >
                    -{request.downvotes}
                  </button>
                  <button
                    className="btn-share"
                    onClick={() => {
                      const url = `${window.location.origin}?request=${request.id}`
                      navigator.clipboard.writeText(url)
                      alert('Link copied to clipboard!')
                    }}
                    title="Share"
                  >
                    Share
                  </button>
                </div>

                {userId && request.user_id === userId && (
                  <div className="owner-actions">
                    <button
                      className="btn-edit"
                      onClick={() => onEdit(request)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => onDelete(request.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
