import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Service {
  _id: string;
  title: string;
  location: string;
  price: number;
  priceUnit: string;
  latitude?: number;
  longitude?: number;
  images: Array<{ url: string } | string>;
}

interface ServicesMapProps {
  services: Service[];
}

function MapBounds({ services }: { services: Service[] }) {
  const map = useMap();

  useMemo(() => {
    const validServices = services.filter(s => s.latitude && s.longitude);
    if (validServices.length > 0) {
      const bounds = L.latLngBounds(
        validServices.map(s => [s.latitude!, s.longitude!])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [services, map]);

  return null;
}

const ServicesMap = ({ services }: ServicesMapProps) => {
  const navigate = useNavigate();

  const servicesWithLocation = services.filter(
    service => service.latitude && service.longitude
  );

  const defaultCenter: [number, number] = servicesWithLocation.length > 0
    ? [servicesWithLocation[0].latitude!, servicesWithLocation[0].longitude!]
    : [6.5244, 3.3792]; // Lagos, Nigeria

  const getImageUrl = (images: Array<{ url: string } | string>) => {
    if (!images || images.length === 0) return '/placeholder-image.jpg';
    const firstImage = images[0];
    return typeof firstImage === 'string' ? firstImage : firstImage.url;
  };

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-300 shadow-md">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {servicesWithLocation.length > 1 && (
          <MapBounds services={servicesWithLocation} />
        )}

        {servicesWithLocation.map((service) => (
          <Marker
            key={service._id}
            position={[service.latitude!, service.longitude!]}
          >
            <Popup>
              <div className="w-48">
                <img
                  src={getImageUrl(service.images)}
                  alt={service.title}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h3 className="font-bold text-sm mb-1">{service.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{service.location}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-600">
                    ₦{service.price.toLocaleString()}/{service.priceUnit}
                  </span>
                  <button
                    onClick={() => navigate(`/service/${service._id}`)}
                    className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                  >
                    View
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ServicesMap;
