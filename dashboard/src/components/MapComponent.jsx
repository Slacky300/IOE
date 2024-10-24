import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const MapComponent = () => {
  const DEFAULT_POSITION = [19.3919, 72.8365]; // Default position (London)
  const [defaultPosition, setDefaultPosition] = useState(DEFAULT_POSITION); // Set initial default position
  const [places, setPlaces] = useState([]);
  const [path, setPath] = useState([]);

  // Function to fetch GPS data from backend
  const fetchGpsData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/gpsdata`); // Replace with your actual API URL
      const gpsData = response.data.gpsData.map((data) => ({
        lat: data.latitude,
        lng: data.longitude,
        name: `Recorded at ${new Date(data.timestamp).toLocaleString()}`,
      }));

      // Update default position to the first GPS point if available
      if (gpsData.length > 0) {
        setDefaultPosition([gpsData[0].lat, gpsData[0].lng]);
      }
      setPlaces(gpsData);
      setPath(gpsData.map(data => [data.lat, data.lng])); // Create an array of lat/lng pairs for the path
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
        {defaultPosition[0] != DEFAULT_POSITION[0] ? (
          <>
            <MapContainer
              center={places.length > 0 ? [places[0].lat, places[0].lng] : defaultPosition} // Center on the first GPS point if available
              zoom={places.length > 0 ? 25 : 13} // Adjust zoom level based on the presence of GPS data
              style={{ height: '400px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {places.length > 0 && (
                <>
                  {/* Marker for the starting point */}
                  <Marker position={[places[0].lat, places[0].lng]}>
                    <Popup>{`Start: ${places[0].name}`}</Popup>
                  </Marker>
                  {/* Marker for the ending point */}
                  {places.length > 1 && (
                    <Marker position={[places[places.length - 1].lat, places[places.length - 1].lng]}>
                      <Popup>{`End: ${places[places.length - 1].name}`}</Popup>
                    </Marker>
                  )}
                </>
              )}
              {/* Draw polyline (path) connecting the GPS points */}
              {path.length > 1 && <Polyline positions={path} color="blue" />}
            </MapContainer>
          </>
        ): (
          <>
           <h1>Loading...</h1> 
          </>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
