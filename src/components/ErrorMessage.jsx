import './ErrorMessage.css';

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container glass-card">
      <span className="error-icon">⚠️</span>
      <h3 className="error-title">Something went wrong</h3>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          🔄 Try Again
        </button>
      )}
      <p className="error-hint">
        💡 Tip: Make sure your city name is spelled correctly and you have an active internet connection.
      </p>
    </div>
  );
}

export default ErrorMessage;
