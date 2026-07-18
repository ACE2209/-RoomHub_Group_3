import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const customIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_POSITION = [10.0452, 105.7469];

const normalizePosition = (position) => {
  if (!Array.isArray(position) || position.length < 2) return null;
  if (
    position[0] === null ||
    position[0] === undefined ||
    position[0] === '' ||
    position[1] === null ||
    position[1] === undefined ||
    position[1] === ''
  ) {
    return null;
  }

  const lat = Number(position[0]);
  const lng = Number(position[1]);

  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

function MapRecenter({ position, zoom }) {
  const map = useMap();

  useEffect(() => {
    const nextPosition = normalizePosition(position);
    if (!nextPosition) return;

    map.flyTo(nextPosition, zoom, {
      animate: true,
      duration: 0.7,
    });
  }, [map, position, zoom]);

  return null;
}

function LocationPicker({
  onChange,
  initialPosition,
  geoJson,
  readOnly = false,
  className = '',
  height = '380px',
  zoom = 13,
}) {
  const [position, setPosition] = useState(null);
  const [geoJsonLayer, setGeoJsonLayer] = useState(null);

  useEffect(() => {
    const nextPosition = normalizePosition(initialPosition);

    if (nextPosition) {
      setPosition(nextPosition);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
        },
        () => {
          setPosition(DEFAULT_POSITION);
        }
      );
    } else {
      setPosition(DEFAULT_POSITION);
    }
  }, [initialPosition]);

  const GeoJson = () => <GeoJSON data={geoJsonLayer} />;

  useEffect(() => {
    if (geoJson) {
      setGeoJsonLayer(geoJson);
    }
  }, [geoJson]);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        if (readOnly) return;
        const { lat, lng } = e.latlng;
        const nextPosition = [lat, lng];
        setPosition(nextPosition);
        onChange?.(lat, lng);
      },
    });

    return position ? <Marker position={position} icon={customIcon} /> : null;
  }

  return (
    <>
      {position && (
        <MapContainer
          center={position}
          zoom={zoom}
          className={className}
          style={{ height, width: '100%' }}
        >
          <MapRecenter position={position} zoom={zoom} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {geoJsonLayer && <GeoJson />}
          <LocationMarker />
        </MapContainer>
      )}
    </>
  );
}
export default LocationPicker;
