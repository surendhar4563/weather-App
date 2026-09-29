import './LoadingSpinner.css';

function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner-rings">
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="spinner-icon">🌤️</div>
      </div>
      <p className="loading-text">Fetching weather data...</p>
    </div>
  );
}

export default LoadingSpinner;
