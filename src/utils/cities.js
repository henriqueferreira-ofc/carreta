export function normalizeCityKey(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

export function getCities(cityCounts = {}) {
  const grouped = new Map()

  Object.entries(cityCounts).forEach(([rawName, rawCount]) => {
    const name = String(rawName ?? '').trim().replace(/\s+/g, ' ')
    const key = normalizeCityKey(name)
    const count = Number(rawCount)

    if (!key || key === 'nao informado' || !Number.isFinite(count) || count < 0) return

    const current = grouped.get(key)
    grouped.set(key, {
      key,
      name: current?.name || name,
      count: (current?.count || 0) + count,
    })
  })

  return [...grouped.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  )
}
