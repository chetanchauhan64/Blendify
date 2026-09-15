'use client';

interface BrandLogoBadgeProps {
  size?: number;
  className?: string;
}

export function BrandLogoBadge({ size = 52, className }: BrandLogoBadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BLENDIFY — The Art of Coffee"
      role="img"
    >
      <defs>
        {/* Top arc — curved path for "BLENDIFY" */}
        <path
          id="blendify-top-arc"
          d="M 16,50 A 34,34 0 0,1 84,50"
          fill="none"
        />
        {/* Bottom arc — curved path for tagline */}
        <path
          id="blendify-bottom-arc"
          d="M 83,52 A 33,33 0 0,1 17,52"
          fill="none"
        />
      </defs>

      {/* Outer circular badge disc */}
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="#FDF8F2"
        stroke="#3E110E"
        strokeWidth="2.5"
      />

      {/* Fine inner accent ring */}
      <circle
        cx="50"
        cy="50"
        r="42.5"
        fill="none"
        stroke="#C8A882"
        strokeWidth="0.75"
      />

      {/* Second fine inner accent ring for depth */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="#E6D3C1"
        strokeWidth="0.4"
        strokeDasharray="1 2"
      />

      {/* ── Top curved text: BLENDIFY ── */}
      <text
        fill="#2E0E0A"
        fontSize="9.5"
        fontWeight="800"
        letterSpacing="3"
        style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)', textTransform: 'uppercase' }}
      >
        <textPath href="#blendify-top-arc" startOffset="50%" textAnchor="middle">
          BLENDIFY
        </textPath>
      </text>

      {/* ── Bottom curved text: THE ART OF COFFEE ── */}
      <text
        fill="#5A231F"
        fontSize="5.2"
        fontWeight="600"
        letterSpacing="1.4"
        style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)', textTransform: 'uppercase' }}
      >
        <textPath href="#blendify-bottom-arc" startOffset="50%" textAnchor="middle">
          THE ART OF COFFEE
        </textPath>
      </text>

      {/* ── Center coffee-bean emblem ── */}
      <g transform="translate(50, 49)">

        {/* Left wheat / laurel accent */}
        <path
          d="M -21 0 C -24 -4, -27 -1, -25 3 C -23 6, -21 4, -21 0 Z"
          fill="#C8900A"
          opacity="0.9"
        />
        <path
          d="M -21 0 C -24 4, -27 1, -25 -3 C -23 -6, -21 -4, -21 0 Z"
          fill="#C8900A"
          opacity="0.7"
        />

        {/* Right wheat / laurel accent */}
        <path
          d="M 21 0 C 24 -4, 27 -1, 25 3 C 23 6, 21 4, 21 0 Z"
          fill="#C8900A"
          opacity="0.9"
        />
        <path
          d="M 21 0 C 24 4, 27 1, 25 -3 C 23 -6, 21 -4, 21 0 Z"
          fill="#C8900A"
          opacity="0.7"
        />

        {/* Coffee Bean body */}
        <ellipse
          cx="0"
          cy="0"
          rx="11.5"
          ry="14.5"
          transform="rotate(-22)"
          fill="#3E110E"
        />

        {/* Bean highlight (subtle depth) */}
        <ellipse
          cx="-1"
          cy="-1"
          rx="9"
          ry="11.5"
          transform="rotate(-22)"
          fill="#5A1B18"
          opacity="0.45"
        />

        {/* Primary roast fissure — S-curve groove */}
        <path
          d="M -2.5 -11 C 4.5 -5, -4.5 4, 2.5 11"
          stroke="#FDF8F2"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          transform="rotate(-22)"
        />

        {/* Secondary accent groove */}
        <path
          d="M 1 -9.5 C 6 -4, 0 3.5, 5 9.5"
          stroke="#E8BD80"
          strokeWidth="0.85"
          strokeLinecap="round"
          strokeDasharray="1.5 2.5"
          fill="none"
          transform="rotate(-22)"
          opacity="0.75"
        />

        {/* Tertiary micro groove */}
        <path
          d="M -5.5 -8 C -1 -3, -6 2, -2 8"
          stroke="#E8BD80"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeDasharray="1 3"
          fill="none"
          transform="rotate(-22)"
          opacity="0.5"
        />

        {/* Bean shine dot */}
        <circle cx="-4" cy="-9" r="1.2" fill="rgba(253,248,242,0.35)" transform="rotate(-22)" />
      </g>

      {/* Small decorative dots at 9 and 3 o'clock */}
      <circle cx="3.5" cy="50" r="1.2" fill="#C8900A" opacity="0.6" />
      <circle cx="96.5" cy="50" r="1.2" fill="#C8900A" opacity="0.6" />
    </svg>
  );
}
