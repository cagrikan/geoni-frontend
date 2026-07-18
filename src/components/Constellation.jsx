import { useRef, useEffect } from 'react'

// Tarama ekranı arka plan animasyonu: isimli AI motoru + varlık düğümlerinden
// oluşan bir takımyıldız, kenarlarda akan sinyaller, kademeli keşif. Merkez
// GEONI logosu + skor halkası ScanningScreen'de DOM olarak duruyor (bu canvas
// onun ARKASINDA). Kütüphanesiz; unmount'ta rAF temizlenir, reduced-motion'a saygılı.
const ENGINES = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity']
const ENTITIES = ['Wikipedia', 'Reddit', 'llms.txt', 'Schema', 'Rakip A', 'Haber', 'YouTube', 'Sektör blog', 'Rakip B', 'Dizin']

export default function Constellation() {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W, H, DPR, nodes = [], edges = [], started = performance.now(), raf = 0

    const build = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = cv.clientWidth; H = cv.clientHeight
      cv.width = W * DPR; cv.height = H * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      const cx = W / 2, cy = H / 2, rad = Math.min(W, H)
      nodes = [{ x: cx, y: cy, kind: 'core', born: 0, name: '' }]
      ENGINES.forEach((n, i) => {
        const a = (-90 + i * 90 + 18) * Math.PI / 180, R = rad * 0.24
        nodes.push({ bx: cx + Math.cos(a) * R, by: cy + Math.sin(a) * R, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, r: 6, kind: 'engine', name: n, born: i * 0.5 + 0.4, ph: Math.random() * 6 })
      })
      ENTITIES.forEach((n, i) => {
        const a = (i / ENTITIES.length * 360 + 12) * Math.PI / 180, R = rad * (0.34 + (i % 3) * 0.045)
        nodes.push({ bx: cx + Math.cos(a) * R, by: cy + Math.sin(a) * R, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, r: 3.5, kind: 'entity', name: n, born: 2 + i * 0.28, ph: Math.random() * 6 })
      })
      for (let i = 0; i < 34; i++) {
        const a = Math.random() * Math.PI * 2, R = rad * (0.12 + Math.random() * 0.42)
        nodes.push({ bx: cx + Math.cos(a) * R, by: cy + Math.sin(a) * R, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, r: 0.8 + Math.random() * 1.6, kind: 'dot', name: '', born: Math.random() * 6, ph: Math.random() * 6 })
      }
      edges = []
      for (let i = 1; i < nodes.length; i++) {
        if (nodes[i].kind === 'engine') edges.push([0, i, true])
        else if (nodes[i].kind === 'entity') {
          let best = 1, bd = 1e9
          for (let j = 1; j <= 4; j++) { const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y); if (d < bd) { bd = d; best = j } }
          edges.push([best, i, false])
        }
      }
      for (let k = 0; k < 20; k++) { const a = 1 + ((Math.random() * (nodes.length - 1)) | 0), b = 1 + ((Math.random() * (nodes.length - 1)) | 0); if (a !== b) edges.push([a, b, false]) }
    }

    const font = getComputedStyle(document.body).fontFamily
    const draw = (now) => {
      const t = (now - started) / 1000
      ctx.clearRect(0, 0, W, H)
      for (const n of nodes) {
        if (n.kind === 'dot') { n.x = n.bx + Math.sin(t * 0.5 + n.ph) * 10; n.y = n.by + Math.cos(t * 0.4 + n.ph) * 10 }
        else if (n.kind !== 'core') { n.x = n.bx + Math.sin(t * 0.3 + n.ph) * 4; n.y = n.by + Math.cos(t * 0.3 + n.ph) * 4 }
      }
      for (const [a, b, strong] of edges) {
        const A = nodes[a], B = nodes[b], ap = Math.min(1, Math.max(0, t - Math.max(A.born, B.born)))
        if (ap <= 0) continue
        ctx.strokeStyle = `rgba(192,132,252,${(strong ? 0.42 : 0.16) * ap})`; ctx.lineWidth = strong ? 1.4 : 0.8
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke()
        const sp = (t * (strong ? 0.7 : 0.4) + a * 0.13) % 1, px = A.x + (B.x - A.x) * sp, py = A.y + (B.y - A.y) * sp
        ctx.fillStyle = `rgba(240,225,255,${(strong ? 0.95 : 0.6) * ap})`; ctx.beginPath(); ctx.arc(px, py, strong ? 2.2 : 1.4, 0, 7); ctx.fill()
      }
      ctx.textAlign = 'center'
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i], ap = Math.min(1, Math.max(0, (t - n.born) * 1.2)); if (ap <= 0) continue
        const pulse = n.kind === 'dot' ? 1 : (1 + Math.sin(t * 2.5 + n.ph) * 0.18)
        ctx.shadowBlur = n.kind === 'engine' ? 18 : n.kind === 'entity' ? 9 : 5; ctx.shadowColor = '#c084fc'
        ctx.fillStyle = n.kind === 'engine' ? '#e9d5ff' : `rgba(192,132,252,${0.55 + 0.4 * ap})`
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse * ap, 0, 7); ctx.fill(); ctx.shadowBlur = 0
        if (n.name) {
          ctx.fillStyle = n.kind === 'engine' ? `rgba(245,240,255,${ap})` : `rgba(180,170,200,${0.85 * ap})`
          ctx.font = (n.kind === 'engine' ? '600 12.5px ' : '500 10.5px ') + font
          ctx.fillText(n.name, n.x, n.y - n.r * pulse - 7)
        }
      }
      raf = requestAnimationFrame(draw)
    }

    build()
    if (reduce) { draw(started + 3200) } // tek kare (kademeli keşif tamamlanmış)
    else raf = requestAnimationFrame(draw)
    const onResize = () => { started = performance.now(); build() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={ref} className="scan-constellation" aria-hidden="true" />
}
