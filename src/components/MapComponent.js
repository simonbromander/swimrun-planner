import React, { useEffect } from 'react';
import { Map, TileLayer, Marker, Polyline, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Search from 'react-leaflet-search';

// Define the MapComponent as a forwardRef component
const MapComponent = React.forwardRef(({ markers, route, onMapClick, onMarkerClick, handleFindLocation, onMarkerDragEnd }, ref) => {

  useEffect(() => {
    console.log("MapComponent mounted");
    console.log("Markers: ", markers);
    console.log("Route: ", route);
  }, [markers, route]);

  // Function to create custom icons based on the marker type
  const getIcon = (type) => {
    let emoji;
    let backgroundColor;

    if (type === 'start') {
      emoji = '🟢'; // Green circle for start
      backgroundColor = 'rgba(0, 128, 0, 0.5)';
    } else if (type === 'swim') {
      emoji = '🏊';
      backgroundColor = 'rgba(0, 0, 255, 0.5)';
    } else if (type === 'run') {
      emoji = '🏃';
      backgroundColor = 'rgba(255, 165, 0, 0.5)';
    } else if (type === 'stop') {
      emoji = '🏁'; // Checkered flag for stop
      backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }

    return new L.DivIcon({
      html: `<div style="background-color: ${backgroundColor}; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;"><span style="font-size: 24px;">${emoji}</span></div>`,
      className: '',
    });
  };

  // Function to get the color of the route segment based on the type
  const getColor = (type) => {
    return type === 'swim' ? '#2980b9' : '#e67e22';
  };

  // Function to generate the route segments for rendering
  const getRouteSegments = () => {
    const segments = [];
    for (let i = 0; i < route.length - 1; i++) {
      segments.push({
        positions: [[route[i].lat, route[i].lng], [route[i + 1].lat, route[i + 1].lng]],
        color: getColor(route[i].type),
      });
    }
    return segments;
  };

  return (
    <Map
      center={[51.505, -0.09]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      ref={ref}
      onClick={onMapClick}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ScaleControl position="bottomleft" />
      <Search position="topright" />
      {markers.map((marker, idx) => (
        <Marker
          key={idx}
          position={[marker.lat, marker.lng]}
          icon={getIcon(marker.type)}
          draggable={true}
          eventHandlers={{
            click: () => onMarkerClick(idx),
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onMarkerDragEnd(idx, lat, lng);
            },
          }}
        />
      ))}
      {getRouteSegments().map((segment, idx) => (
        <Polyline
          key={idx}
          positions={segment.positions}
          color={segment.color}
        />
      ))}
      <div className="find-location-btn" onClick={handleFindLocation}>📍</div>
    </Map>
  );
});

export default MapComponent;