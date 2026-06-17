import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 2800)
    return () => clearTimeout(t)
  }, [message, onClose])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? '#b91c1c' : '#9a7530',
      color: '#fff', padding: '10px 22px', borderRadius: 24,
      fontSize: 13, fontWeight: 700, zIndex: 999,
      boxShadow: '0 4px 20px rgba(0,0,0,.25)', whiteSpace: 'nowrap',
      fontFamily: 'Cairo, sans-serif', direction: 'rtl',
    }}>
      {message}
    </div>
  )
}
