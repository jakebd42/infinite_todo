import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

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

function MapClickHandler({ onClick }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng)
    }
  })
  return null
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function MapView({ requests, onMapClick, onVote, selectedLocation }) {
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

      <MapClickHandler onClick={onMapClick} />

      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
          <Popup>New request location</Popup>
        </Marker>
      )}

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
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
