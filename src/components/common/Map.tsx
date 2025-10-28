import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  latitude: number
  longitude: number
  title: string
  zoom?: number
  className?: string
}

// Fix for default marker icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const Map: React.FC<MapProps> = ({
  latitude,
  longitude,
  title,
  zoom = 15,
  className = ''
}) => {
  // Default to Lagos if coordinates are not valid
  const lat = latitude && !isNaN(latitude) ? latitude : 6.5244
  const lng = longitude && !isNaN(longitude) ? longitude : 3.3792

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={defaultIcon}>
          <Popup>
            <div className="text-sm">
              <strong>{title}</strong>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

export default Map
