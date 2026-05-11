import { useRef, useState } from 'react'
import Dashboard from './components/Dashboard'
import CountUp from './components/landing/CountUp'
import Reveal from './components/landing/Reveal'
import { FIXED_SHEET_URL } from './config/sheets'
import { fetchSheetCsv } from './services/sheets'
import { parseCSV } from './utils/csv'
import './App.css'
import heroImage from './assets/hero.png'

const INCLUSAO_LOGO = `${import.meta.env.BASE_URL}inclusao.png`

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
                <span className="brand-logo-wrap">
                  <img className="brand-logo" src={INCLUSAO_LOGO} alt="Mandato da Inclusão" />
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
