import { KNOWN_CITY_TABS } from '../config/sheets'
import { parseCSVTable } from '../utils/csv'

function getSheetInfo(url) {
  const sheetId = url.match(/\/spreadsheets\/d\/([\w-]+)/)?.[1]
  if (!sheetId) throw new Error('Link inválido. Use o link completo da planilha do Google Sheets.')

  const gid = url.match(/[?#&]gid=(\d+)/)?.[1]
  return { sheetId, gid }
}

function getCsvUrls(sheetUrl) {
  const { sheetId, gid } = getSheetInfo(sheetUrl)
  const gidParam = gid ? `&gid=${gid}` : ''
  const exportGidParam = gid ? `&gid=${gid}` : ''

  return [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${exportGidParam}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv${gid ? `&gid=${gid}` : ''}`,
  ]
}

function parseSheetTabs(html) {
  const tabs = []
  const tabRegex = /\[21350203,"\[(\d+),0,\\"(\d+)\\",.*?\[0,0,\\"([^\\"]+)\\"/g
  let match

  while ((match = tabRegex.exec(html))) {
    tabs.push({ index: Number(match[1]), gid: match[2], name: match[3].trim() })
  }

  return tabs.sort((a, b) => a.index - b.index)
}

async function getSheetTabs(sheetId) {
  const fallbackTabs = KNOWN_CITY_TABS[sheetId] || []

  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`, { cache: 'no-store' })
    if (!res.ok) return fallbackTabs

    const html = await res.text()
    const discoveredTabs = parseSheetTabs(html)
    return discoveredTabs.length ? discoveredTabs : fallbackTabs
  } catch {
    return fallbackTabs
  }
}

function toCSVCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function tableToCSV(table) {
  return table.map(row => row.map(toCSVCell).join(',')).join('\n')
}

function isGoogleError(text) {
  const trimmed = text.trim().toLowerCase()
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.includes('servicelogin')
}

async function fetchCsvUrl(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null

  const csv = await res.text()
  if (isGoogleError(csv) || !csv.includes(',')) return null

  return csv
}

async function fetchAllTabsCsv(sheetId) {
  const tabs = await getSheetTabs(sheetId)
  const loadedTables = []
  let emptyTabs = 0

  for (const tab of tabs) {
    const csv = await fetchCsvUrl(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${tab.gid}`)
    if (!csv) continue

    const table = parseCSVTable(csv)
    if (table.length < 2) {
      emptyTabs++
      continue
    }

    loadedTables.push({ tab, table })
  }

  if (!loadedTables.length && !tabs.length) {
    return { csv: null, emptyTabs }
  }

  const headers = ['Cidade', ...(loadedTables[0]?.table[0] || ['Resposta'])]
  const tablesByGid = new Map(loadedTables.map(item => [item.tab.gid, item.table]))
  const rows = tabs.flatMap(tab => {
    const table = tablesByGid.get(tab.gid)
    if (!table) return [[tab.name]]

    const responseRows = table.slice(1).filter(row => row.some(value => value))
    return responseRows.length
      ? responseRows.map(row => [tab.name, ...row])
      : [[tab.name]]
  })

  return { csv: tableToCSV([headers, ...rows]), emptyTabs, loadedTabs: loadedTables.length }
}

export async function fetchSheetCsv(sheetUrl) {
  const { sheetId, gid } = getSheetInfo(sheetUrl)

  if (!gid) {
    const { csv, emptyTabs } = await fetchAllTabsCsv(sheetId)
    if (csv) return csv
    if (emptyTabs > 0) {
      throw new Error('Encontrei as abas/cidades, mas todas estão vazias no acesso público.')
    }
  }

  const urls = getCsvUrls(sheetUrl)
  let lastStatus = ''
  let foundHeaderOnly = false

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      lastStatus = res.status ? ` (${res.status})` : ''
      if (!res.ok) continue

      const csv = await res.text()
      const trimmed = csv.trim().toLowerCase()
      const looksLikeGoogleError = trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.includes('serviceLogin')
      if (looksLikeGoogleError || !csv.includes(',')) continue

      const table = parseCSVTable(csv)
      if (table.length >= 2) return csv
      if (table.length === 1) foundHeaderOnly = true
    } catch (error) {
      lastStatus = error?.message ? `: ${error.message}` : ''
    }
  }

  if (foundHeaderOnly) {
    throw new Error('A planilha está pública, mas o Google liberou só o cabeçalho. No Sheets, use Arquivo → Compartilhar → Publicar na web → aba de respostas → CSV, ou copie o link com a aba correta selecionada.')
  }

  throw new Error(`Não consegui ler a planilha${lastStatus}. Abra o link com a aba de respostas selecionada e confirme Compartilhar → Qualquer pessoa com o link → Leitor.`)
}

/**
 * Busca estatísticas reais da planilha: total de cidades (abas) e quantas têm respostas.
 * Usado no painel hero da landing para mostrar dados reais ao invés de valores fixos.
 */
export async function fetchSheetStats(sheetUrl) {
  try {
    const { sheetId } = getSheetInfo(sheetUrl)
    const tabs = await getSheetTabs(sheetId)
    const totalCities = tabs.length

    let citiesWithData = 0
    for (const tab of tabs) {
      const csv = await fetchCsvUrl(
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${tab.gid}`
      )
      if (!csv) continue
      const table = parseCSVTable(csv)
      if (table.length >= 2) citiesWithData++
    }

    return { totalCities, citiesWithData }
  } catch {
    return { totalCities: null, citiesWithData: null }
  }
}
