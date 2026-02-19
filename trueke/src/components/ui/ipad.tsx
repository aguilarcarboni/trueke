import { SVGProps } from "react";

export interface IPadProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  src?: string;
  videoSrc?: string;
}

export default function IPad({
  width = 560,
  height = 778,
  src,
  videoSrc,
  ...props
}: IPadProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 560 778"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Outer body */}
      <path
        d={`M2 40C2 17.9086 19.9086 0 42 0H518C540.091 0 558 17.9086 558 40V738C558 760.091 540.091 778 518 778H42C19.9086 778 2 760.091 2 738V40Z`}
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      {/* Inner body */}
      <path
        d={`M6 41C6 20.5655 22.5655 4 43 4H517C537.435 4 554 20.5655 554 41V737C554 757.435 537.435 774 517 774H43C22.5655 774 6 757.435 6 737V41Z`}
        className="fill-white dark:fill-[#262626]"
      />
      {/* Screen bezel */}
      <path
        d={`M18 50C18 30.6863 33.6863 15 53 15H507C526.314 15 542 30.6863 542 50V728C542 747.314 526.314 763 507 763H53C33.6863 763 18 747.314 18 728V50Z`}
        className="fill-[#E5E5E5] stroke-[#E5E5E5] stroke-[0.5] dark:fill-[#404040] dark:stroke-[#404040]"
      />

      {/* Image content */}
      {src && (
        <image
          href={src}
          x="18"
          y="15"
          width="524"
          height="748"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#ipadRoundedCorners)"
        />
      )}

      {/* Video content */}
      {videoSrc && (
        <foreignObject x="18" y="15" width="524" height="748">
          <video
            className="size-full overflow-hidden rounded-[35px] object-cover"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
        </foreignObject>
      )}

      {/* Front camera */}
      <circle
        cx="280"
        cy="8"
        r="3"
        className="fill-[#D4D4D4] dark:fill-[#525252]"
      />
      <circle
        cx="280"
        cy="8"
        r="1.5"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />

      <defs>
        <clipPath id="ipadRoundedCorners">
          <rect
            x="18"
            y="15"
            width="524"
            height="748"
            rx="35"
            ry="35"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
