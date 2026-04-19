type Props = { size?: number };

export default function NetworkLogo({ size = 26 }: Props) {
  const uid = `nl-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block" }} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-silver`} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F3F5F8" />
          <stop offset="0.45" stopColor="#B9C0C8" />
          <stop offset="1" stopColor="#6F7682" />
        </linearGradient>
        <linearGradient id={`${uid}-core`} x1="18" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#DBF0FF" />
          <stop offset="1" stopColor="#5DA8EC" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8EC9F8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#8EC9F8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g stroke={`url(#${uid}-silver)`} strokeWidth="1.8" strokeLinecap="round" opacity="0.55">
        <line x1="24" y1="10" x2="24" y2="24" />
        <line x1="10.5" y1="32" x2="24" y2="24" />
        <line x1="37.5" y1="32" x2="24" y2="24" />
      </g>
      <circle cx="24" cy="8" r="4.2" fill={`url(#${uid}-silver)`} />
      <circle cx="10" cy="34" r="4.2" fill={`url(#${uid}-silver)`} />
      <circle cx="38" cy="34" r="4.2" fill={`url(#${uid}-silver)`} />
      <circle cx="24" cy="24" r="10" fill={`url(#${uid}-glow)`} />
      <circle cx="24" cy="24" r="6" fill={`url(#${uid}-core)`} />
      <circle cx="24" cy="24" r="6" fill="none" stroke="#DFF2FF" strokeOpacity="0.7" strokeWidth="0.8" />
    </svg>
  );
}
