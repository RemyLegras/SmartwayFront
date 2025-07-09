import { FC, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const lyon: [number, number] = [45.75, 4.85];

type LatLng = [number, number];

const ClickHandler = ({
  placing,
  setPoint,
}: {
  placing: boolean;
  setPoint: (latlng: LatLng) => void;
}) => {
  useMapEvents({
    click(e) {
      if (placing) {
        setPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

const CarteLyon: FC = () => {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [placing, setPlacing] = useState<'start' | 'end' | null>(null);

  if (start && end) {
    console.log('Départ:', start, 'Arrivée:', end);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    >
      <MapContainer center={lyon} zoom={13} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler
          placing={placing === 'start'}
          setPoint={(latlng) => {
            setStart(latlng);
            setPlacing(null);
          }}
        />
        <ClickHandler
          placing={placing === 'end'}
          setPoint={(latlng) => {
            setEnd(latlng);
            setPlacing(null);
          }}
        />
        {start && (
          <Marker position={start}>
            <Popup>Départ<br />{start[0].toFixed(5)}, {start[1].toFixed(5)}</Popup>
          </Marker>
        )}
        {end && (
          <Marker position={end}>
            <Popup>Arrivée<br />{end[0].toFixed(5)}, {end[1].toFixed(5)}</Popup>
          </Marker>
        )}
      </MapContainer>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          background: 'rgba(255,255,255,0.95)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => setPlacing('start')}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: placing === 'start' ? '#1976d2' : '#90caf9',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Placer départ
        </button>
        <button
          onClick={() => setPlacing('end')}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: placing === 'end' ? '#388e3c' : '#a5d6a7',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Placer arrivée
        </button>
      </div>
    </div>
  );
};

export default CarteLyon;