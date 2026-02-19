import { SVGProps } from "react";

export interface MacbookProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  src?: string;
  videoSrc?: string;
}

export default function Macbook({
  width = 680,
  height = 390,
  src,
  videoSrc,
  ...props
}: MacbookProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 680 390"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Screen lid outer */}
      <path
        d="M68 0C68 0 68 0 68 20C68 8.954 76.954 0 88 0H592C603.046 0 612 8.954 612 20V20L612 0H68Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      <rect
        x="68"
        y="0"
        width="544"
        height="360"
        rx="20"
        ry="20"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Screen lid inner */}
      <rect
        x="72"
        y="4"
        width="536"
        height="352"
        rx="16"
        ry="16"
        className="fill-white dark:fill-[#262626]"
      />

      {/* Screen bezel */}
      <rect
        x="84"
        y="16"
        width="512"
        height="328"
        rx="8"
        ry="8"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Image content */}
      {src && (
        <image
          href={src}
          x="84"
          y="16"
          width="512"
          height="328"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#macbookScreenClip)"
        />
      )}

      {/* Video content */}
      {videoSrc && (
        <foreignObject x="84" y="16" width="512" height="328">
          <video
            className="size-full overflow-hidden rounded-lg object-cover"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
        </foreignObject>
      )}

      {/* Camera dot */}
      <circle
        cx="340"
        cy="9"
        r="3"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
      />
      <circle
        cx="340"
        cy="9"
        r="1.5"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Hinge */}
      <path
        d="M50 360H630C630 360 632 360 632 361.5V364C632 365.5 630 366 628 366H52C50 366 48 365.5 48 364V361.5C48 360 50 360 50 360Z"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
      />

      {/* Base / keyboard body */}
      <path
        d="M10 366H670C675.523 366 680 370.477 680 376V382C680 387.523 675.523 390 670 390H10C4.477 390 0 387.523 0 382V376C0 370.477 4.477 366 10 366Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Base top edge highlight */}
      <path
        d="M10 366H670C675.523 366 680 370.477 680 376V369C680 367.343 678.657 366 677 366H3C1.343 366 0 367.343 0 369V376C0 370.477 4.477 366 10 366Z"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
        opacity="0.5"
      />

      <defs>
        <clipPath id="macbookScreenClip">
          <rect
            x="84"
            y="16"
            width="512"
            height="328"
            rx="8"
            ry="8"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
