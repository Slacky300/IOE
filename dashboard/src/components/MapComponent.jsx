import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const MapComponent = () => {
  const defaultPosition = [19.3919, 72.8365]; // Default central point (can be updated based on data)
  const [places, setPlaces] = useState([]);

  // Function to fetch GPS data from backend
  const fetchGpsData = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/gpsdata'); // Replace with your actual API URL
      const gpsData = response.data.gpsData.map((data) => ({
        lat: data.latitude,
        lng: data.longitude,
        name: `Recorded at ${new Date(data.timestamp).toLocaleString()}`,
      }));
      setPlaces(gpsData);
    } catch (error) {
      console.error('Error fetching GPS data:', error);
    }
  };

  useEffect(() => {
    fetchGpsData();
  }, []); // Fetch data only once when the component mounts

  return (
    <div className="card mb-4">
      <div className="card-header">Map of Places Visited</div>
      <div className="card-body">
        <MapContainer
          center={places.length > 0 ? [places[0].lat, places[0].lng] : defaultPosition} // Center on the first GPS point if available
          zoom={13}
          style={{ height: '400px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {places.map((place, index) => (
            <Marker key={index} position={[place.lat, place.lng]}>
              <Popup>{place.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent;
