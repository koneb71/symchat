import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export function Logo({ size = 40, className, showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="logo-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#logo-grad)"
          filter="url(#logo-glow)"
        />

        {/* Chat Bubble */}
        <path
          d="M 30 35 Q 30 25 40 25 L 70 25 Q 80 25 80 35 L 80 55 Q 80 65 70 65 L 45 65 L 35 75 L 35 65 Q 30 65 30 55 Z"
          fill="white"
          opacity="0.95"
        />

        {/* Sparkle 1 */}
        <path
          d="M 65 40 L 67 42 L 65 44 L 63 42 Z"
          fill="white"
          opacity="0.9"
        />
        <path
          d="M 65 38 L 65 46 M 61 42 L 69 42"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Sparkle 2 */}
        <path
          d="M 45 48 L 46.5 49.5 L 45 51 L 43.5 49.5 Z"
          fill="white"
          opacity="0.8"
        />
        <path
          d="M 45 47 L 45 52 M 42.5 49.5 L 47.5 49.5"
          stroke="white"
          strokeWidth="1.2"
          opacity="0.8"
        />

        {/* AI Symbol */}
        <circle cx="55" cy="42" r="2" fill="url(#logo-grad)" />
        <circle cx="55" cy="52" r="2" fill="url(#logo-grad)" />
        <path d="M 55 44 L 55 50" stroke="url(#logo-grad)" strokeWidth="2" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <h1 className="text-xl font-bold leading-none tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            SymChat
          </h1>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
            AI Assistant
          </p>
        </div>
      )}
    </div>
  )
}

// Icon-only version for compact spaces
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return <Logo size={size} showText={false} className={className} />
}

