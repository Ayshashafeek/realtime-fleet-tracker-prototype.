import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import useWebSocket from 'react-use-websocket';
import L from 'leaflet';

// Haversine formula to calculate distance in meters
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

const WS_URL = 'ws://localhost:8000/ws/tracker';

// Your destination stop
const MY_STOP = { lat: 10.3444, lng: 76.2081 };
const ALERT_DISTANCE = 200;

function App() {
  const [buses, setBuses] = useState({});
  const [alertMessage, setAlertMessage] = useState(null);

  const { lastMessage } = useWebSocket(WS_URL, {
    onOpen: () => console.log('WebSocket Connected!'),
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      
      setBuses((prev) => ({
        ...prev,
        [data.bus_id]: { lat: data.latitude, lng: data.longitude, route: data.route },
      }));

      // Geofence check
      if (data.route === "My Personal Route") {
        const distance = getDistanceFromLatLonInMeters(
          data.latitude, data.longitude, MY_STOP.lat, MY_STOP.lng
        );

        if (distance <= ALERT_DISTANCE && distance > 10) {
          setAlertMessage(`Get ready! Your bus is ${Math.round(distance)} meters away!`);
        } else if (distance <= 10) {
          setAlertMessage(`Your bus has arrived!`);
        } else {
          setAlertMessage(null); // Clear alert if bus resets/moves away
        }
      }
    }
  }, [lastMessage]);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      
      {/* Alert Banner */}
      {alertMessage && (
        <div style={{
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#ff4757', color: 'white', padding: '15px 30px',
          borderRadius: '8px', zIndex: 1000, fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          🚨 {alertMessage}
        </div>
      )}

      <MapContainer center={[10.3420, 76.2081]} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw the 200m geofence on the map */}
        <Circle center={[MY_STOP.lat, MY_STOP.lng]} radius={ALERT_DISTANCE} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }} />
        
        {/* Mark your destination stop */}
        <Marker position={[MY_STOP.lat, MY_STOP.lng]}>
          <Popup><strong>Your Stop</strong></Popup>
        </Marker>

        {/* Render buses */}
        {Object.keys(buses).map((busId) => (
          <Marker key={busId} position={[buses[busId].lat, buses[busId].lng]} icon={busIcon}>
            <Popup><strong>{busId}</strong><br/>{buses[busId].route}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;