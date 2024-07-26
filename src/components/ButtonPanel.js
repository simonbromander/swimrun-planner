import React from 'react';
import PropTypes from 'prop-types';
import './ButtonPanel.css';

const ButtonPanel = ({ onFindLocation, setMode, distances, currentPolylineDistance, lastPointDistance, clearRoute, undoLastPoint }) => {
  return (
    <div className="button-panel">
      <div className="button-row">
        <button className="button-highlight" onClick={() => setMode('swim')}>🏊 Start Swim</button>
        <button className="button-highlight" onClick={() => setMode('run')}>🏃 Start Run</button>
        <button className="button-secondary" onClick={() => setMode('stop')}>🏁 Stop Route</button>
      </div>
      <div className="button-row">
        <button className="button-primary" onClick={onFindLocation}>📍 Find my location</button>
        <button className="button-secondary" onClick={clearRoute}>🗑️ Clear Route</button>
        <button className="button-secondary" onClick={undoLastPoint}>↩️ Undo</button>
      </div>
      <div className="distances">
        <p>Swim: <span className="distance-highlight">{distances.swim.toFixed(2)} km</span></p>
        <p>Run: <span className="distance-highlight">{distances.run.toFixed(2)} km</span></p>
        <p>Total: <span className="distance-highlight">{currentPolylineDistance.toFixed(2)} km</span></p>
        <p>Last added: <span className="distance-highlight">{lastPointDistance.toFixed(2)} km</span></p>
      </div>
    </div>
  );
};

ButtonPanel.propTypes = {
  onFindLocation: PropTypes.func,
  setMode: PropTypes.func.isRequired,
  distances: PropTypes.shape({
    swim: PropTypes.number,
    run: PropTypes.number,
  }).isRequired,
  currentPolylineDistance: PropTypes.number.isRequired,
  lastPointDistance: PropTypes.number.isRequired,
  clearRoute: PropTypes.func.isRequired,
  undoLastPoint: PropTypes.func.isRequired,
};

ButtonPanel.defaultProps = {
  onFindLocation: () => {},
};

export default ButtonPanel;