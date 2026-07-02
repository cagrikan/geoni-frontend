export default function ProBlur({ children, label = "Pro içerik", isPro = false }) {
  if (isPro) return <>{children}</>
  return (
    <div className="pro-blur">
      <div className="pro-blur__content">{children}</div>
      <div className="pro-blur__overlay">
        <div className="pro-blur__badge">
          <span className="pro-blur__lock">🔒</span>
          <span className="pro-blur__label">{label}</span>
          <a href="https://geoni.ai#paketler" className="pro-blur__btn" target="_blank" rel="noopener">
            Pro'ya Geç →
          </a>
        </div>
      </div>
    </div>
  )
}
