import { SVGProps } from "react";

export interface MonitorProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  src?: string;
  videoSrc?: string;
}

export default function Monitor({
  width = 580,
  height = 440,
  src,
  videoSrc,
  ...props
}: MonitorProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 580 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Monitor body outer */}
      <rect
        x="10"
        y="0"
        width="560"
        height="350"
        rx="20"
        ry="20"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Monitor body inner */}
      <rect
        x="14"
        y="4"
        width="552"
        height="342"
        rx="16"
        ry="16"
        className="fill-white dark:fill-[#262626]"
      />

      {/* Screen */}
      <rect
        x="24"
        y="14"
        width="532"
        height="310"
        rx="8"
        ry="8"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Image content */}
      {src && (
        <image
          href={src}
          x="24"
          y="14"
          width="532"
          height="310"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#monitorScreenClip)"
        />
      )}

      {/* Video content */}
      {videoSrc && (
        <foreignObject x="24" y="14" width="532" height="310">
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
        cx="290"
        cy="8"
        r="3"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
      />
      <circle
        cx="290"
        cy="8"
        r="1.5"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Chin indicator */}
      <rect
        x="265"
        y="332"
        width="50"
        height="4"
        rx="2"
        ry="2"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
        opacity="0.5"
      />

      {/* Stand neck */}
      <path
        d="M255 350H325V395H255V350Z"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
      />

      {/* Stand neck inner highlight */}
      <path
        d="M260 350H320V395H260V350Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Stand base */}
      <path
        d="M190 395H390C400 395 405 400 405 410V420C405 430 400 440 390 440H190C180 440 175 430 175 420V410C175 400 180 395 190 395Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      {/* Stand base top edge */}
      <path
        d="M190 395H390C400 395 405 400 405 410V400C405 397 402 395 399 395H181C178 395 175 397 175 400V410C175 400 180 395 190 395Z"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
        opacity="0.5"
      />

      <defs>
        <clipPath id="monitorScreenClip">
          <rect
            x="24"
            y="14"
            width="532"
            height="310"
            rx="8"
            ry="8"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
