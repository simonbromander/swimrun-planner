import React from 'react';
import MapComponent from './components/MapComponent';
import ButtonPanel from './components/ButtonPanel';
import './App.css';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import landPolygons from './data/land_polygons.json';
import waterPolygons from './data/water_polygons.json';

function App() {
  const mapRef = React.useRef();
  const [mode, setMode] = React.useState(null); // 'swim', 'run', 'stop'
  const [markers, setMarkers] = React.useState([]);
  const [route, setRoute] = React.useState([]);
  const [distances, setDistances] = React.useState({ swim: 0, run: 0 });
  const [currentPolylineDistance, setCurrentPolylineDistance] = React.useState(0); // Current polyline distance
  const [lastPointDistance, setLastPointDistance] = React.useState(0); // Distance of the last added point
  const [editingIndex, setEditingIndex] = React.useState(null);

  const handleFindLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 13);
        } else {
          console.error("Map reference is not available");
        }
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const checkIfOnLand = (lat, lng) => {
    const point = turf.point([lng, lat]);

    for (const polygon of landPolygons.features) {
      if (turf.booleanPointInPolygon(point, polygon)) {
        return true;
      }
    }

    return false;
  };

  const checkIfOnWater = (lat, lng) => {
    const point = turf.point([lng, lat]);

    for (const polygon of waterPolygons.features) {
      if (turf.booleanPointInPolygon(point, polygon)) {
        return true;
      }
    }

    return false;
  };

  const determinePolylineType = (lat1, lon1, lat2, lon2) => {
    const isStartOnLand = checkIfOnLand(lat1, lon1);
    const isEndOnLand = checkIfOnLand(lat2, lon2);

    if (isStartOnLand && isEndOnLand) {
      return 'run';
    }

    const isStartOnWater = checkIfOnWater(lat1, lon1);
    const isEndOnWater = checkIfOnWater(lat2, lon2);

    if (isStartOnWater && isEndOnWater) {
      return 'swim';
    }

    return 'unknown';
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    const newMarker = { lat, lng, type: mode };

    if (route.length > 0) {
      const lastMarker = route[route.length - 1];
      const polylineType = determinePolylineType(lastMarker.lat, lastMarker.lng, lat, lng);
      newMarker.type = polylineType;
    }

    if (editingIndex !== null) {
      const updatedMarkers = [...markers];
      const updatedRoute = [...route];
      updatedMarkers[editingIndex] = newMarker;
      updatedRoute[editingIndex] = newMarker;
      setMarkers(updatedMarkers);
      setRoute(updatedRoute);
      setEditingIndex(null);
    } else {
      if (route.length === 0) {
        setMarkers([{ ...newMarker, type: 'start' }, newMarker]);
        setRoute([newMarker]);
      } else {
        setMarkers([...markers, newMarker]);
        setRoute([...route, newMarker]);
      }
      calculateDistance(newMarker);
    }
  };

  const calculateDistance = (newMarker) => {
    if (route.length > 0) {
      const lastMarker = route[route.length - 1];
      const distance = getDistance(lastMarker.lat, lastMarker.lng, newMarker.lat, newMarker.lng);
      setCurrentPolylineDistance((prev) => prev + distance); // Update current polyline distance
      setLastPointDistance(distance); // Update last point distance

      if (newMarker.type === 'swim') {
        setDistances((prev) => ({ ...prev, swim: prev.swim + distance }));
      } else if (newMarker.type === 'run') {
        setDistances((prev) => ({ ...prev, run: prev.run + distance }));
      }
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const clearRoute = () => {
    setMarkers([]);
    setRoute([]);
    setDistances({ swim: 0, run: 0 });
    setCurrentPolylineDistance(0); // Reset current polyline distance when clearing
    setLastPointDistance(0); // Reset last point distance when clearing
  };

  const undoLastPoint = () => {
    if (markers.length > 1) {
      const updatedMarkers = markers.slice(0, -1);
      const updatedRoute = route.slice(0, -1);
      const lastMarker = markers[markers.length - 1];
      const secondLastMarker = markers[markers.length - 2];
      const distance = getDistance(secondLastMarker.lat, secondLastMarker.lng, lastMarker.lat, lastMarker.lng);

      setMarkers(updatedMarkers);
      setRoute(updatedRoute);

      if (lastMarker.type === 'swim') {
        setDistances((prev) => ({ ...prev, swim: prev.swim - distance }));
      } else if (lastMarker.type === 'run') {
        setDistances((prev) => ({ ...prev, run: prev.run - distance }));
      }
      setCurrentPolylineDistance((prev) => prev - distance);
      setLastPointDistance(0); // Reset last point distance when undoing
    } else {
      clearRoute();
    }
  };

  const handleMarkerClick = (index) => {
    setEditingIndex(index);
  };

  const onMarkerDragEnd = (index, lat, lng) => {
    const updatedMarkers = [...markers];
    const updatedRoute = [...route];
    updatedMarkers[index] = { ...updatedMarkers[index], lat, lng };
    updatedRoute[index] = { ...updatedRoute[index], lat, lng };
    setMarkers(updatedMarkers);
    setRoute(updatedRoute);
    updateDistances(updatedRoute);
  };

  const updateDistances = (updatedRoute) => {
    let swimDistance = 0;
    let runDistance = 0;
    let polylineDistance = 0;
    for (let i = 0; i < updatedRoute.length - 1; i++) {
      const distance = getDistance(
        updatedRoute[i].lat,
        updatedRoute[i].lng,
        updatedRoute[i + 1].lat,
        updatedRoute[i + 1].lng
      );
      polylineDistance += distance;
      if (updatedRoute[i].type === 'swim') {
        swimDistance += distance;
      } else if (updatedRoute[i].type === 'run') {
        runDistance += distance;
      }
    }
    setDistances({ swim: swimDistance, run: runDistance });
    setCurrentPolylineDistance(polylineDistance);
    if (updatedRoute.length > 1) {
      setLastPointDistance(
        getDistance(
          updatedRoute[updatedRoute.length - 2].lat,
          updatedRoute[updatedRoute.length - 2].lng,
          updatedRoute[updatedRoute.length - 1].lat,
          updatedRoute[updatedRoute.length - 1].lng
        )
      );
    }
  };

  return (
    <div className="App">
      <div className="map-container">
        <MapComponent
          ref={mapRef}
          markers={markers}
          route={route}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          handleFindLocation={handleFindLocation}
          onMarkerDragEnd={onMarkerDragEnd}
        />
      </div>
      <ButtonPanel
        setMode={setMode}
        clearRoute={clearRoute}
        distances={distances}
        currentPolylineDistance={currentPolylineDistance} // Pass current polyline distance
        lastPointDistance={lastPointDistance} // Pass last point distance
        onFindLocation={handleFindLocation}
        undoLastPoint={undoLastPoint}
      />
    </div>
  );
}

export default App;