export function HeartIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#e11d48" : "none"} stroke="#e11d48" strokeWidth="2">
      <path d="M12 21s-7.5-4.6-10-9.3C.5 8.1 2.3 4 6.2 4c2 0 3.6 1 4.8 2.7C12.2 5 13.8 4 15.8 4c3.9 0 5.7 4.1 4.2 7.7C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
