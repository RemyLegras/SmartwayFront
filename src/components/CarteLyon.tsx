import { FC, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
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
type Node = { id: number; lat: number; lon: number };

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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/nodes`)
      .then(res => res.json())
      .then(data => setNodes(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const findNearestNodeId = (point: LatLng) => {
      let minDist = Infinity;
      let nearestId = null;
      for (const node of nodes) {
        const dist = Math.hypot(node.lat - point[0], node.lon - point[1]);
        if (dist < minDist) {
          minDist = dist;
          nearestId = node.id;
        }
      }
      return nearestId;
    };

    if (start && end && nodes.length > 0) {
      setLoading(true);
      const startId = findNearestNodeId(start);
      const endId = findNearestNodeId(end);

      if (startId && endId) {
        fetch(`${process.env.REACT_APP_API_URL}/shortest-path?start=${startId}&end=${endId}`)
          .then(res => res.json())
          .then(data => {
            if (data.path) {
              const coords: LatLng[] = data.path.map((id: number) => {
                const node = nodes.find(n => n.id === id);
                return node ? [node.lat, node.lon] : null;
              }).filter(Boolean) as LatLng[];
              setRoute(coords);
            } else {
              setRoute([]);
            }
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setRoute([]);
    }
  }, [start, end, nodes]);

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
        {route.length > 1 && (
          <Polyline positions={route} color="red" weight={6} />
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
          disabled={loading}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: placing === 'start' ? '#1976d2' : '#90caf9',
            color: '#fff',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading && placing === 'start' ? 'Chargement...' : 'Placer départ'}
        </button>
        <button
          onClick={() => setPlacing('end')}
          disabled={loading}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: placing === 'end' ? '#388e3c' : '#a5d6a7',
            color: '#fff',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading && placing === 'end' ? 'Chargement...' : 'Placer arrivée'}
        </button>
      </div>
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(255,255,255,0.4)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: '#1976d2',
            pointerEvents: 'none',
          }}
        >
          Chargement...
        </div>
      )}
    </div>
  );
};

export default CarteLyon;