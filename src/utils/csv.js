function splitAnswerValues(value) {
  return String(value || '')
    .split(/,\s*/)
    .map(item => item.trim())
    .filter(Boolean)
}

function addCount(target, key, amount = 1) {
  target[key] = (target[key] || 0) + amount
}

function addNestedCount(target, group, key, amount = 1) {
  if (!target[group]) target[group] = {}
  addCount(target[group], key, amount)
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function parseCSV(csv) {
  const table = parseCSVTable(csv)

  if (table.length < 2) {
    throw new Error('A planilha foi aberta, mas a versão pública tem só o cabeçalho. Publique a aba de respostas na web ou copie o link com a aba de respostas selecionada.')
  }

  const headers = table[0]
  const rows = table.slice(1)

  const cidades = {}, deficiencias = {}, beneficios = {}
  const beneficiosPorCidade = {}, conheceSepdPorCidade = {}
  const conheceSepd = {Sim:0,Não:0}, ficouSabendo = {Sim:0,Não:0}
  const interessePolitico = {Sim:0,Não:0}, fontes = {}

  const col = kw => headers.findIndex(h => normalizeText(h).includes(normalizeText(kw)))
  const cidadeCol = col('cidade') >= 0 ? col('cidade') : col('formulário') >= 0 ? col('formulário') : 0
  const defCol = col('defici'), benCol = col('benefi')
  const sepdCol = col('sepd') >= 0 ? col('sepd') : col('serviços')
  const carretaCol = col('carreta'), fonteCol = col('quem')
  const politicoCol = col('polít') >= 0 ? col('polít') : col('politic')

  rows.forEach(r => {
    if (!r || !r[0]) return
    const cidade = r[cidadeCol] || 'Não informado'
    const hasResponse = r.some((value, index) => index !== cidadeCol && String(value || '').trim())
    if (!(cidade in cidades)) cidades[cidade] = 0
    if (!hasResponse) return
    addCount(cidades, cidade)
    if (defCol >= 0 && r[defCol]) {
      splitAnswerValues(r[defCol]).forEach(item => addCount(deficiencias, item))
    }
    if (benCol >= 0 && r[benCol]) {
      splitAnswerValues(r[benCol]).forEach(item => {
        addCount(beneficios, item)
        addNestedCount(beneficiosPorCidade, cidade, item)
      })
    }
    if (sepdCol >= 0) {
      const v = (r[sepdCol]||'').toLowerCase().includes('sim')?'Sim':'Não'
      conheceSepd[v]++
      addNestedCount(conheceSepdPorCidade, cidade, v)
    }
    if (carretaCol >= 0) { const v = (r[carretaCol]||'').toLowerCase().includes('sim')?'Sim':'Não'; ficouSabendo[v]++ }
    if (fonteCol >= 0 && r[fonteCol]) { addCount(fontes, r[fonteCol]) }
    if (politicoCol >= 0) { const v = (r[politicoCol]||'').toLowerCase().includes('sim')?'Sim':'Não'; interessePolitico[v]++ }
  })

  const total = Object.values(cidades).reduce((sum, count) => sum + count, 0)
  return { total, cidades, deficiencias, beneficios, beneficiosPorCidade, conheceSepd, conheceSepdPorCidade, ficouSabendo, interessePolitico, fontes }
}

export function parseCSVTable(csv) {
  const table = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]
    const nextChar = csv[i + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim())
      cell = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++
      row.push(cell.trim())
      if (row.some(value => value)) table.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  row.push(cell.trim())
  if (row.some(value => value)) table.push(row)

  return table
}
