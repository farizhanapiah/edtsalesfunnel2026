export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pixel-grid flex items-center justify-center p-6">
      {children}
    </div>
  )
}
