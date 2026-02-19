"use client"

import { useEffect, useRef } from "react"
import createGlobe, { COBEOptions } from "cobe"
import { useMotionValue, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

const MOVEMENT_DAMPING = 1400

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
}

export function Globe({
  className,
  config = GLOBE_CONFIG,
  size,
}: {
  className?: string
  config?: COBEOptions
  size?: number
}) {
  let phi = 0
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const sizeRef = useRef(size ?? 0)

  const r = useMotionValue(0)
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  })

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      r.set(r.get() + delta / MOVEMENT_DAMPING)
    }
  }

  const onResize = () => {
    const pixelRatio = window.devicePixelRatio || 1
    const nextSize =
      size ??
      Math.min(
        containerRef.current?.clientWidth ?? 400,
        containerRef.current?.clientHeight ?? 400
      )
    sizeRef.current = nextSize
    if (canvasRef.current) {
      canvasRef.current.width = nextSize * pixelRatio
      canvasRef.current.height = nextSize * pixelRatio
    }
  }

  useEffect(() => {
    const pixelRatio = window.devicePixelRatio || 1
    onResize()

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: sizeRef.current * pixelRatio,
      height: sizeRef.current * pixelRatio,
      onRender: (state) => {
        if (!pointerInteracting.current) phi += 0.005
        const currentSize = sizeRef.current
        state.phi = phi + rs.get()
        state.width = currentSize * pixelRatio
        state.height = currentSize * pixelRatio
      },
    })

    const resizeObserver =
      size || !containerRef.current
        ? null
        : new ResizeObserver(() => onResize())
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    window.addEventListener("resize", onResize)
    setTimeout(() => (canvasRef.current!.style.opacity = "1"), 0)
    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
      resizeObserver?.disconnect()
    }
  }, [rs, config, size])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex items-center justify-center w-full h-full",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <canvas
        className="opacity-0 transition-opacity duration-500"
        ref={canvasRef}
        style={size ? { width: size, height: size } : { width: "100%", height: "100%" }}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX
          updatePointerInteraction(e.clientX)
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  )
}
