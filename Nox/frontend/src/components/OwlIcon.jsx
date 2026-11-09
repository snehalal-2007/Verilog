/* One life = one little owl. */
export default function OwlIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 6 L5 1 L8 4 Z M16 6 L15 1 L12 4 Z" fill="#b8692f" stroke="#1b1530" strokeWidth="1.4" strokeLinejoin="round" />
      <ellipse cx="10" cy="11" rx="7.5" ry="8" fill="#c97c3c" stroke="#1b1530" strokeWidth="1.6" />
      <circle cx="7" cy="9" r="2.6" fill="#ffd23f" stroke="#1b1530" strokeWidth="1" />
      <circle cx="13" cy="9" r="2.6" fill="#ffd23f" stroke="#1b1530" strokeWidth="1" />
      <circle cx="7" cy="9" r="1.1" fill="#1b1530" />
      <circle cx="13" cy="9" r="1.1" fill="#1b1530" />
      <path d="M8.8 11.5 L11.2 11.5 L10 13.6 Z" fill="#ff9f1c" />
    </svg>
  );
}
