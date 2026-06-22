export default function Spinner() {
  return (
    <div className="spinner">
      <svg className="spinner__svg" viewBox="0 0 24 24">
        <circle
          className="spinner__track"
          cx="12" cy="12" r="10"
          fill="none"
          stroke="#1E3A5F"
          strokeWidth="2.5"
        />
        <circle
          className="spinner__arc"
          cx="12" cy="12" r="10"
          fill="none"
          stroke="#4A90D9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="47 16"
        />
      </svg>
    </div>
  );
}
