/* GEONI logo isareti — geoni.ai nav'indaki SVG ile birebir ayni (tek kaynak).
   Renkler currentColor yerine marka accent'i sabit: iki temada da ayni
   gorunur (geoni.ai'daki davranisla tutarli). Boyut .geoni-mark ile disaridan. */
export default function GeoniMark() {
  return (
    <svg viewBox="0 0 80 80" className="geoni-mark" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <line x1="38" y1="12" x2="25" y2="22" stroke="#7C86F5" strokeWidth="1" opacity=".4" />
      <line x1="10" y1="40" x2="20" y2="25" stroke="#7C86F5" strokeWidth="1" opacity=".4" />
      <line x1="10" y1="40" x2="18" y2="56" stroke="#7C86F5" strokeWidth="1" opacity=".4" />
      <line x1="38" y1="68" x2="25" y2="58" stroke="#7C86F5" strokeWidth="1" opacity=".5" />
      <line x1="60" y1="40" x2="70" y2="24" stroke="#7C86F5" strokeWidth="1" opacity=".5" />
      <line x1="38" y1="12" x2="52" y2="8" stroke="#7C86F5" strokeWidth="1" opacity=".5" />
      <line x1="52" y1="8" x2="70" y2="24" stroke="#7C86F5" strokeWidth="1" opacity=".5" />
      <path d="M 38 12 A 30 30 0 1 0 38 68" fill="none" stroke="#7C86F5" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 50 40 L 62 40" fill="none" stroke="#7C86F5" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 62 40 L 62 58" fill="none" stroke="#7C86F5" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="38" cy="12" r="2.5" fill="#7C86F5" />
      <circle cx="10" cy="40" r="2" fill="#7C86F5" />
      <circle cx="38" cy="68" r="2.5" fill="#7C86F5" />
      <circle cx="62" cy="40" r="3.5" fill="#F59E0B" />
      <circle cx="62" cy="40" r="1.8" fill="#07070F" />
      <circle cx="62" cy="40" r="0.9" fill="#F59E0B" />
      <circle cx="50" cy="40" r="2" fill="#7C86F5" />
      <circle cx="62" cy="58" r="2" fill="#7C86F5" />
      <circle cx="70" cy="24" r="2" fill="#7C86F5" />
      <circle cx="52" cy="8" r="1.8" fill="#7C86F5" />
    </svg>
  )
}
