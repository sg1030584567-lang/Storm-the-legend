"use client"

interface StormAvatarProps {
  isConnected: boolean
  botRunning: boolean
}

export default function StormAvatar({
  isConnected,
  botRunning,
}: StormAvatarProps) {
  const ringClass = !isConnected
    ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.9)]"
    : botRunning
    ? "border-green-500 shadow-[0_0_35px_rgba(34,197,94,1)] animate-spin"
    : "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.9)]"

  const coreClass = !isConnected
    ? "bg-red-500"
    : botRunning
    ? "bg-green-500 animate-pulse"
    : "bg-yellow-400"

  return (
    <div className="flex justify-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* RING */}
        <div
          className={`absolute inset-0 rounded-full border-4 ${ringClass}`}
        />

        {/* CORE */}
        <div
          className={`w-14 h-14 rounded-full ${coreClass}`}
        />
      </div>
    </div>
  )
}
