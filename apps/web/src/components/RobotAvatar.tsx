"use client";

const ROBOT_COLORS = [
  { body: "#FF6B6B", accent: "#FF8E8E", eye: "#FFF" },
  { body: "#4ECDC4", accent: "#7EDDD6", eye: "#FFF" },
  { body: "#45B7D1", accent: "#72CCDE", eye: "#FFF" },
  { body: "#96CEB4", accent: "#B5DECE", eye: "#FFF" },
  { body: "#FBBF24", accent: "#FCD34D", eye: "#FFF" },
  { body: "#A78BFA", accent: "#C4B5FD", eye: "#FFF" },
  { body: "#F472B6", accent: "#F9A8D4", eye: "#FFF" },
  { body: "#34D399", accent: "#6EE7B7", eye: "#FFF" },
];

const ANTENNA_STYLES = ["ball", "zigzag", "fork", "ring"];
const EYE_STYLES = ["round", "square", "happy", "star"];

export default function RobotAvatar({
  index,
  size = 40,
  className = "",
}: {
  index: number;
  size?: number;
  className?: string;
}) {
  const colors = ROBOT_COLORS[index % ROBOT_COLORS.length];
  const antenna = ANTENNA_STYLES[index % ANTENNA_STYLES.length];
  const eyes = EYE_STYLES[index % EYE_STYLES.length];
  const s = size;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      className={className}
      style={{ display: "block" }}
    >
      {/* Antenna */}
      <line x1="20" y1="8" x2="20" y2="2" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
      {antenna === "ball" && <circle cx="20" cy="2" r="2.5" fill={colors.accent} />}
      {antenna === "zigzag" && <path d="M18 3 L20 1 L22 3" stroke={colors.accent} strokeWidth="1.5" fill="none" strokeLinecap="round" />}
      {antenna === "fork" && (
        <>
          <line x1="20" y1="2" x2="17" y2="0" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="2" x2="23" y2="0" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {antenna === "ring" && <circle cx="20" cy="2" r="2.5" fill="none" stroke={colors.accent} strokeWidth="1.5" />}

      {/* Head */}
      <rect x="8" y="8" width="24" height="22" rx="5" fill={colors.body} />
      <rect x="10" y="10" width="20" height="18" rx="3" fill={colors.accent} opacity="0.3" />

      {/* Eyes */}
      {eyes === "round" && (
        <>
          <circle cx="15" cy="18" r="3.5" fill={colors.eye} />
          <circle cx="25" cy="18" r="3.5" fill={colors.eye} />
          <circle cx="16" cy="17" r="1.8" fill="#333" />
          <circle cx="26" cy="17" r="1.8" fill="#333" />
          <circle cx="16.5" cy="16.5" r="0.7" fill="#FFF" />
          <circle cx="26.5" cy="16.5" r="0.7" fill="#FFF" />
        </>
      )}
      {eyes === "square" && (
        <>
          <rect x="12" y="15" width="6" height="5" rx="1" fill={colors.eye} />
          <rect x="22" y="15" width="6" height="5" rx="1" fill={colors.eye} />
          <rect x="14" y="16" width="3" height="3" rx="0.5" fill="#333" />
          <rect x="24" y="16" width="3" height="3" rx="0.5" fill="#333" />
        </>
      )}
      {eyes === "happy" && (
        <>
          <path d="M12 18 Q15 14 18 18" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M22 18 Q25 14 28 18" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {eyes === "star" && (
        <>
          <circle cx="15" cy="18" r="3.5" fill={colors.eye} />
          <circle cx="25" cy="18" r="3.5" fill={colors.eye} />
          <text x="15" y="20" textAnchor="middle" fontSize="6" fill="#333">*</text>
          <text x="25" y="20" textAnchor="middle" fontSize="6" fill="#333">*</text>
        </>
      )}

      {/* Mouth */}
      <rect x="14" y="24" width="12" height="3" rx="1.5" fill="#333" opacity="0.5" />
      <rect x="16" y="24.5" width="2" height="2" rx="0.5" fill={colors.eye} opacity="0.7" />
      <rect x="20" y="24.5" width="2" height="2" rx="0.5" fill={colors.eye} opacity="0.7" />
      <rect x="24" y="24.5" width="2" height="2" rx="0.5" fill={colors.eye} opacity="0.7" />

      {/* Ears / side bolts */}
      <circle cx="7" cy="19" r="2.5" fill={colors.body} />
      <circle cx="33" cy="19" r="2.5" fill={colors.body} />
      <circle cx="7" cy="19" r="1" fill={colors.accent} />
      <circle cx="33" cy="19" r="1" fill={colors.accent} />
    </svg>
  );
}
