import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export function RootLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative h-screen overflow-hidden bg-gray-50 text-gray-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,144,0,0.15),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(255,144,0,0.1),transparent_50%),radial-gradient(circle_at_0%_100%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px]" />
        <div className="relative flex h-full">
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </TooltipProvider>
  )
}
