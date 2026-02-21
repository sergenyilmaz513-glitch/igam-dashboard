'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="w-10 h-10 rounded-full" style={{ border: '3px solid #EDE9E0' }} />
        <div className="w-10 h-10 rounded-full animate-spin absolute inset-0" style={{ border: '3px solid transparent', borderTopColor: '#C9A84C' }} />
      </div>
    </div>
  )
}
