import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  GeoJSON,
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

function LocationPicker({
  onChange,
  initialPosition,
  geoJson,
  readOnly = false,
}) {
  const [position, setPosition] = useState(null);
  const [geoJsonLayer, setGeoJsonLayer] = useState(null);

  const getCurrentPosition = (cb) => {
    const position = initialPosition || [10.0452, 105.7469];
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          cb([latitude, longitude]);
        },
        (err) => {
          cb(position);
        }
      );
    } else {
      cb(position);
    }
  };

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    } else {
      getCurrentPosition(setPosition);
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
        setPosition([lat, lng]);
        onChange(lat, lng);
      },
    });

    return position ? <Marker position={position} icon={customIcon} /> : null;
  }

  return (
    <>
      {position && (
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '380px', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {geoJsonLayer && <GeoJson />}
          <LocationMarker />
        </MapContainer>
      )}
    </>
  );
}
export default LocationPicker;
