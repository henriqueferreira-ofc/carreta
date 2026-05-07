import { useEffect, useRef, useState } from 'react'
import Dashboard from './components/Dashboard'
import './App.css'
import heroImage from './assets/hero.png'

const FIXED_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BIst4qwgxn1ZARnJwgwNLfKXB2f4HVO3zQl4V_xTndc/edit?usp=sharing'
const CARRETA_LOGO = `${import.meta.env.BASE_URL}carreta.png`

function CountUp({ end, suffix = '', duration = 1100 }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setValue(end)
      return
    }

    let frame
    const start = performance.now()
    const easeOutQuart = progress => 1 - Math.pow(1 - progress, 4)

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(end * easeOutQuart(progress)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, end])

  return <>{value}{suffix}</>
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.18 })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function generateDemoData() {
  const cidades = ['São Sebastião','Sobradinho','Planaltina','Paranoá','Itapoã','Fercal','Varjão','Riacho Fundo','Brazlândia','Ceilândia']
  const deficiencias = ['Física','Auditiva','Visual','Intelectual','Transtorno Espectro Autista','Down','Outros']
  const beneficios = ['BPC','Passe Livre Interestadual','Passe Livre DF','Aposentadoria','DF Acessível','Emprego / Trabalho','Alimentação / Cesta Básica','Moradia','Cadeiras/Equipamentos Assistivos','Apoio institucional','Não precisa']

  const visitasPorCidade = {}
  cidades.forEach((c, i) => { visitasPorCidade[c] = [112,98,87,75,72,65,63,58,55,162][i] })
  const defData = {}
  deficiencias.forEach((d, i) => { defData[d] = [298,175,134,89,67,43,41][i] })
  const benData = {}
  beneficios.forEach((b, i) => { benData[b] = [312,98,287,121,87,143,154,65,198,176,43][i] })
  const total = Object.values(visitasPorCidade).reduce((a,b) => a+b, 0)
  const beneficiosPorCidade = {}
  const conheceSepdPorCidade = {}
  cidades.forEach((cidade, i) => {
    beneficiosPorCidade[cidade] = {
      BPC: 20 + i * 4,
      'Passe Livre DF': 18 + i * 3,
      'Cadeiras/Equipamentos Assistivos': 12 + i * 2,
      'Passe Livre Interestadual': 8 + i,
    }
    conheceSepdPorCidade[cidade] = {
      Sim: Math.round(visitasPorCidade[cidade] * (0.28 + (i % 4) * 0.08)),
      Não: Math.round(visitasPorCidade[cidade] * (0.72 - (i % 4) * 0.08)),
    }
  })

  return {
    total, isDemoData: true,
    cidades: visitasPorCidade,
    deficiencias: defData,
    beneficios: benData,
    beneficiosPorCidade,
    conheceSepd: { Sim: Math.round(total*0.38), Não: Math.round(total*0.62) },
    conheceSepdPorCidade,
    ficouSabendo: { Sim: Math.round(total*0.71), Não: Math.round(total*0.29) },
    interessePolitico: { Sim: Math.round(total*0.52), Não: Math.round(total*0.48) },
    fontes: { 'Amigos / família': 347, 'Redes sociais': 237, 'Agentes comunitários': 152, 'Rádio / TV': 76, 'Outros': 35 }
  }
}

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

function parseCSV(csv) {
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

  const total = rows.filter(r => r && r[0]).length
  return { total, cidades, deficiencias, beneficios, beneficiosPorCidade, conheceSepd, conheceSepdPorCidade, ficouSabendo, interessePolitico, fontes }
}

function parseCSVTable(csv) {
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

const KNOWN_CITY_TABS = {
  '1BIst4qwgxn1ZARnJwgwNLfKXB2f4HVO3zQl4V_xTndc': [
    { gid: '1625580577', name: 'Sobradinho' },
    { gid: '864675926', name: 'Brazlândia' },
    { gid: '1998549442', name: 'São Sebastião' },
    { gid: '1437499888', name: 'Ceilândia' },
    { gid: '801880095', name: 'Santa Maria' },
    { gid: '432826824', name: 'Samambaia' },
    { gid: '51714004', name: 'Planaltina' },
    { gid: '2018437264', name: 'Guará' },
    { gid: '1456196129', name: 'Recanto das Emas' },
    { gid: '157375036', name: 'Gama' },
  ],
}

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
    tabs.push({ index: Number(match[1]), gid: match[2], name: match[3] })
  }

  return tabs.sort((a, b) => a.index - b.index)
}

async function getSheetTabs(sheetId) {
  if (KNOWN_CITY_TABS[sheetId]) return KNOWN_CITY_TABS[sheetId]

  const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`)
  if (!res.ok) return []

  const html = await res.text()
  return parseSheetTabs(html)
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
  const res = await fetch(url)
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

  if (!loadedTables.length) {
    return { csv: null, emptyTabs }
  }

  const headers = ['Cidade', ...loadedTables[0].table[0]]
  const rows = loadedTables.flatMap(({ tab, table }) =>
    table.slice(1).filter(row => row.some(value => value)).map(row => [tab.name, ...row])
  )

  return { csv: tableToCSV([headers, ...rows]), emptyTabs, loadedTabs: loadedTables.length }
}

async function fetchSheetCsv(sheetUrl) {
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
      const res = await fetch(url)
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

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)

  async function loadFromSheets() {
    setError(''); setLoading(true)
    try {
      const csv = await fetchSheetCsv(FIXED_SHEET_URL)
      setData(parseCSV(csv))
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  function handlePanelMove(event) {
    const panel = panelRef.current
    if (!panel) return

    const rect = panel.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    panel.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`)
    panel.style.setProperty('--tilt-y', `${(x * 6).toFixed(2)}deg`)
    panel.style.setProperty('--glow-x', `${((x + 0.5) * 100).toFixed(0)}%`)
    panel.style.setProperty('--glow-y', `${((y + 0.5) * 100).toFixed(0)}%`)
  }

  function resetPanelMove() {
    const panel = panelRef.current
    if (!panel) return

    panel.style.setProperty('--tilt-x', '0deg')
    panel.style.setProperty('--tilt-y', '0deg')
    panel.style.setProperty('--glow-x', '50%')
    panel.style.setProperty('--glow-y', '30%')
  }

  return (
    <div className="app">
      {!data ? (
        <div className="landing">
          <div className="ambient-layer" aria-hidden="true">
            <span className="ambient-line ambient-line-one"></span>
            <span className="ambient-line ambient-line-two"></span>
            <span className="ambient-plane"></span>
          </div>
          <div className="landing-inner">
            <div className="landing-topbar">
              <div className="brand entrance-top">
                <span className="brand-icon-wrap">
                  <img className="brand-icon" src={CARRETA_LOGO} alt="Carreta da Inclusão" />
                </span>
                <div>
                  <div className="brand-title">Carreta da Inclusão</div>
                  <div className="brand-sub">SEPD · Secretaria da Pessoa com Deficiência · GDF</div>
                </div>
              </div>
              <div className="live-badge entrance-badge"><span></span> Dados do Forms</div>
            </div>

            <div className="hero-shell">
              <div className="hero-copy">
                <div className="hero-kicker entrance-kicker">Painel diário de acompanhamento</div>
                <h1 className="hero-title entrance-title">Visitas, demandas e prioridades em um só lugar.</h1>
                <p className="hero-desc entrance-desc">Acompanhe as respostas recebidas pelo Forms, identifique as cidades com maior volume, os benefícios mais solicitados e onde a comunicação sobre os serviços da SEPD precisa ser reforçada.</p>

                <div className="hero-actions entrance-actions">
                  <button className="btn-primary" onClick={loadFromSheets} disabled={loading}>
                    {loading ? <span className="spinner"></span> : 'Abrir dashboards'}
                  </button>
                </div>

                {error && <div className="error-msg">⚠ {error}</div>}
              </div>

              <div
                ref={panelRef}
                className="hero-panel entrance-panel"
                onMouseMove={handlePanelMove}
                onMouseLeave={resetPanelMove}
              >
                <div className="panel-scan" aria-hidden="true"></div>
                <img className="hero-asset" src={heroImage} alt="" />
                <div className="panel-title"><span></span> Monitoramento ativo</div>
                <div className="panel-grid">
                  <div>
                    <strong><CountUp end={10} /></strong>
                    <span>cidades</span>
                  </div>
                  <div>
                    <strong><CountUp end={6} /></strong>
                    <span>com dados</span>
                  </div>
                  <div>
                    <strong><CountUp end={24} suffix="h" /></strong>
                    <span>atualização</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-cards">
              <Reveal delay={80}>
                <div className="landing-card">
                  <span>01</span>
                  <strong>Benefícios solicitados</strong>
                  <p>Ranking das principais demandas para orientar a resposta da equipe.</p>
                </div>
              </Reveal>
              <Reveal delay={170}>
                <div className="landing-card">
                  <span>02</span>
                  <strong>Conhecimento da SEPD</strong>
                  <p>Leitura por cidade de quem conhece os atendimentos e serviços.</p>
                </div>
              </Reveal>
              <Reveal delay={260}>
                <div className="landing-card">
                  <span>03</span>
                  <strong>Visitas por cidade</strong>
                  <p>Consolidação diária das abas do Forms em um painel único.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      ) : (
        <Dashboard data={data} onBack={() => setData(null)} />
      )}
    </div>
  )
}
