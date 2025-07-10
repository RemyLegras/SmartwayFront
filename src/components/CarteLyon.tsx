import { FC, useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  ZoomControl
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './CarteLyon.module.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// 1) On réinitialise les URLs de l’icône par défaut
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// 2) Fonction utilitaire pour créer un pin SVG coloré
function createSvgPin(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41">
      <path
        d="M12.5,0 C7,0 2.5,4.5 2.5,10 c0,8.75 10,20.5 10,20.5 s10,-11.75 10,-20.5 C22.5,4.5 18,0 12.5,0 z"
        fill="${color}"
      />
      <circle cx="12.5" cy="10" r="5" fill="#FFFFFF"/>
    </svg>
  `.trim();

  return L.divIcon({
    html: svg,
    className: '',
    iconSize:     [25, 41],
    iconAnchor:   [12, 41],
    popupAnchor:  [1, -34],
  });
}

// 3) Création des icônes en utilisant tes variables CSS
const startIcon = createSvgPin('var(--color-blue-dark)');
const endIcon   = createSvgPin('var(--color-green-dark)');

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
  const [end, setEnd]     = useState<LatLng | null>(null);
  const [placing, setPlacing] = useState<'start'|'end'|null>(null);
  const [nodes, setNodes]     = useState<Node[]>([]);
  const [route, setRoute]     = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(false);

  // Chargement des nodes au montage
  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/nodes`)
      .then(res => res.json())
      .then(data => setNodes(data))
      .finally(() => setLoading(false));
  }, []);

  // Calcul du plus court chemin quand start & end changent
  useEffect(() => {
    const findNearestNodeId = (point: LatLng) => {
      let minDist = Infinity;
      let nearestId: number | null = null;
      for (const node of nodes) {
        const d = Math.hypot(node.lat - point[0], node.lon - point[1]);
        if (d < minDist) {
          minDist = d;
          nearestId = node.id;
        }
      }
      return nearestId;
    };

    if (start && end && nodes.length > 0) {
      setLoading(true);
      const sId = findNearestNodeId(start);
      const eId = findNearestNodeId(end);

      if (sId != null && eId != null) {
        fetch(`${process.env.REACT_APP_API_URL}/shortest-path?start=${sId}&end=${eId}`)
          .then(res => res.json())
          .then(data => {
            if (data.path) {
              const coords = data.path
                .map((id: number) => {
                  const n = nodes.find(x => x.id === id);
                  return n ? [n.lat, n.lon] as LatLng : null;
                })
                .filter(Boolean) as LatLng[];
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
    <div className={styles.container}>
      <MapContainer
        center={lyon}
        zoom={13}
        className={styles.map}
        zoomControl={false}  // on désactive l’icône de zoom par défaut
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler
          placing={placing === 'start'}
          setPoint={latlng => { setStart(latlng); setPlacing(null); }}
        />
        <ClickHandler
          placing={placing === 'end'}
          setPoint={latlng => { setEnd(latlng); setPlacing(null); }}
        />

        {start && (
          <Marker position={start} icon={startIcon}>
            <Popup>
              Départ<br />
              {start.map(v => v.toFixed(5)).join(', ')}
            </Popup>
          </Marker>
        )}
        {end && (
          <Marker position={end} icon={endIcon}>
            <Popup>
              Arrivée<br />
              {end.map(v => v.toFixed(5)).join(', ')}
            </Popup>
          </Marker>
        )}

        {route.length > 1 && (
          <Polyline positions={route} color="#A3D9FF" weight={6} />
        )}

        <ZoomControl position="topright" />

        <div className={styles.controls}>
          <button
            className={`${styles.button} ${
              placing === 'start' ? styles.startActive : styles.start
            }`}
            onClick={() => setPlacing('start')}
            disabled={loading}
          >
            {loading && placing === 'start' ? '⏳' : 'Placer départ'}
          </button>
          <button
            className={`${styles.button} ${
              placing === 'end' ? styles.endActive : styles.end
            }`}
            onClick={() => setPlacing('end')}
            disabled={loading}
          >
            {loading && placing === 'end' ? '⏳' : 'Placer arrivée'}
          </button>
        </div>

        {loading && (
          <div className={styles.loadingOverlay}>Chargement...</div>
        )}
      </MapContainer>
    </div>
  );
};

export default CarteLyon;
