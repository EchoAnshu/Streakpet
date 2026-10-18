interface Origin {
  x: number
  y: number
}

export function burstConfetti(origin: Origin, colors: string[], count = 24): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const layer = document.createElement('div')
  layer.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:120;overflow:hidden;'
  document.body.appendChild(layer)

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement('span')
    const width = 6 + Math.random() * 6
    const height = width * (0.5 + Math.random() * 0.4)
    piece.style.cssText = [
      'position:absolute',
      `left:${origin.x}px`,
      `top:${origin.y}px`,
      `width:${width.toFixed(1)}px`,
      `height:${height.toFixed(1)}px`,
      'border-radius:2px',
      `background:${colors[index % colors.length]}`,
      'will-change:transform,opacity',
    ].join(';')
    layer.appendChild(piece)

    const angle = Math.random() * Math.PI * 2
    const velocity = 60 + Math.random() * 150
    const dx = Math.cos(angle) * velocity
    const dy = Math.sin(angle) * velocity - 70
    const drop = 130 + Math.random() * 90
    const spin = Math.random() * 540 - 270

    piece.animate(
      [
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${(dy + drop).toFixed(1)}px)) rotate(${spin.toFixed(0)}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 650 + Math.random() * 450,
        easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)',
        fill: 'forwards',
      }
    )
  }

  window.setTimeout(() => layer.remove(), 1400)
}
