import { SVGProps } from "react";

export interface DualMonitorProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  srcLeft?: string;
  srcRight?: string;
}

export default function DualMonitor({
  width = 940,
  height = 379,
  srcLeft,
  srcRight,
  ...props
}: DualMonitorProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 940 379"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* ===== LEFT MONITOR ===== */}
      {/* Body outer - flat right edge */}
      <path
        d="M30 0H470V289H30C13.431 289 0 275.569 0 259V30C0 13.431 13.431 0 30 0Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      {/* Body inner */}
      <path
        d="M30 4H466V285H30C17.85 285 4 275.15 4 263V26C4 13.85 17.85 4 30 4Z"
        className="fill-white dark:fill-[#262626]"
      />
      {/* Screen — 442×249 (16:9) */}
      <path
        d="M22 14H456V263H22C17.582 263 14 259.418 14 255V22C14 17.582 17.582 14 22 14Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      {/* Left image content */}
      {srcLeft && (
        <image
          href={srcLeft}
          x="14"
          y="14"
          width="442"
          height="249"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#dualMonitorLeftClip)"
        />
      )}
      {/* Camera dot */}
      <circle cx="235" cy="8" r="3" className="fill-[#D4D4D4] dark:fill-[#525252]" />
      <circle cx="235" cy="8" r="1.5" className="fill-[#E5E5E5] dark:fill-[#404040]" />
      {/* Chin indicator */}
      <rect x="210" y="271" width="50" height="4" rx="2" ry="2" className="fill-[#D4D4D4] dark:fill-[#525252]" opacity="0.5" />

      {/* ===== RIGHT MONITOR ===== */}
      {/* Body outer - flat left edge */}
      <path
        d="M470 0H910C926.569 0 940 13.431 940 30V259C940 275.569 926.569 289 910 289H470V0Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      {/* Body inner */}
      <path
        d="M474 4H910C922.15 4 936 13.85 936 26V263C936 275.15 922.15 285 910 285H474V4Z"
        className="fill-white dark:fill-[#262626]"
      />
      {/* Screen — 442×249 (16:9) */}
      <path
        d="M484 14H918C922.418 14 926 17.582 926 22V255C926 259.418 922.418 263 918 263H484V14Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      {/* Right image content */}
      {srcRight && (
        <image
          href={srcRight}
          x="484"
          y="14"
          width="442"
          height="249"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#dualMonitorRightClip)"
        />
      )}
      {/* Camera dot */}
      <circle cx="705" cy="8" r="3" className="fill-[#D4D4D4] dark:fill-[#525252]" />
      <circle cx="705" cy="8" r="1.5" className="fill-[#E5E5E5] dark:fill-[#404040]" />
      {/* Chin indicator */}
      <rect x="680" y="271" width="50" height="4" rx="2" ry="2" className="fill-[#D4D4D4] dark:fill-[#525252]" opacity="0.5" />

      {/* ===== SHARED STAND ===== */}
      {/* Stand neck */}
      <path
        d="M435 289H505V379H435V289Z"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
      />
      {/* Stand neck inner */}
      <path
        d="M440 289H500V379H440V289Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      <defs>
        <clipPath id="dualMonitorLeftClip">
          <path d="M22 14H456V263H22C17.582 263 14 259.418 14 255V22C14 17.582 17.582 14 22 14Z" />
        </clipPath>
        <clipPath id="dualMonitorRightClip">
          <path d="M484 14H918C922.418 14 926 17.582 926 22V255C926 259.418 922.418 263 918 263H484V14Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
