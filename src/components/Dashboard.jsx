import { useState } from 'react'
import { MapPin } from 'lucide-react'
import CitiesView from './CitiesView'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const PALETTE = {
  teal: '#079FE3', tealLight: '#73D8FF',
  orange: '#FFE200', blue: '#006FB8',
  purple: '#151515', gray: '#6B7882',
  amber: '#F3C300', pink: '#31B7F0',
  coral: '#D8B400', green: '#9FE7FF',
  navy: '#004D80'
}

const BAR_COLORS = [
  PALETTE.teal, PALETTE.blue, PALETTE.purple, PALETTE.amber,
  PALETTE.coral, PALETTE.pink, PALETTE.orange, PALETTE.green,
  PALETTE.navy, PALETTE.gray, PALETTE.tealLight
]

const CHART_OPTIONS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: {} } },
}

const BAR_OPTS = (horizontal = false) => ({
  ...CHART_OPTIONS_BASE,
  indexAxis: horizontal ? 'y' : 'x',
  scales: {
    x: {
      grid: { display: horizontal, color: 'rgba(0,111,184,0.12)' },
      ticks: { font: { size: 11, family: 'DM Sans' }, color: '#6B7882', maxRotation: horizontal ? 0 : 40 }
    },
    y: {
      grid: { display: !horizontal, color: 'rgba(0,111,184,0.12)' },
      ticks: { font: { size: 11, family: 'DM Sans' }, color: '#6B7882' }
    }
  },
  borderRadius: 6,
  borderSkipped: false,
})

const STACKED_BAR_OPTS = {
  ...CHART_OPTIONS_BASE,
  indexAxis: 'y',
  scales: {
    x: {
      stacked: true,
      grid: { display: true, color: 'rgba(0,111,184,0.12)' },
      ticks: { font: { size: 11, family: 'DM Sans' }, color: '#6B7882' }
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: { font: { size: 11, family: 'DM Sans' }, color: '#6B7882' }
    }
  },
  borderRadius: 6,
  borderSkipped: false,
}

const DONUT_OPTS = {
  ...CHART_OPTIONS_BASE,
  cutout: '68%',
  plugins: { legend: { display: false } }
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="metric-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="metric-val">{value}</div>
      <div className="metric-lbl">{label}</div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, height = 260 }) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">{title}</div>
      {subtitle && <div className="chart-card-sub">{subtitle}</div>}
      <div style={{ position: 'relative', width: '100%', height }} className="chart-wrap">
        {children}
      </div>
    </div>
  )
}

function InsightCard({ label, value, detail, accent }) {
  return (
    <div className="insight-card" style={{ borderLeftColor: accent }}>
      <div className="insight-label">{label}</div>
      <div className="insight-value">{value}</div>
      {detail && <div className="insight-detail">{detail}</div>}
    </div>
  )
}

function DonutWithLegend({ data, colors }) {
  const labels = Object.keys(data)
  const values = Object.values(data)
  const total = values.reduce((a,b)=>a+b,0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        <Doughnut
          data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] }}
          options={DONUT_OPTS}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>{total}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>total</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {labels.map((l, i) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i], flexShrink: 0 }}></div>
            <div style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{l}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
              {values[i]} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({Math.round(values[i]/total*100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TABS = ['Visão Geral', 'Deficiência', 'Benefícios', 'Engajamento', 'Cidades']
const INCLUSAO_LOGO = `${import.meta.env.BASE_URL}inclusao.png`

export default function Dashboard({ data, onBack }) {
  const [activeTab, setActiveTab] = useState(0)

  const total = data.total
  const pct = (obj, key) => {
    const t = Object.values(obj).reduce((a,b)=>a+b,0)
    return t > 0 ? Math.round((obj[key]||0)/t*100) + '%' : '—'
  }

  const cidadeLabels = Object.keys(data.cidades)
  const cidadeValues = Object.values(data.cidades)
  const sortedCidades = cidadeLabels.map((l,i)=>({l, v: cidadeValues[i]})).sort((a,b)=>b.v-a.v)

  const topCidade = sortedCidades[0]?.l || '—'
  const conhecePct = pct(data.conheceSepd, 'Sim')

  const benEntries = Object.entries(data.beneficios).sort((a,b)=>b[1]-a[1])
  const defEntries = Object.entries(data.deficiencias).sort((a,b)=>b[1]-a[1])
  const fonteEntries = Object.entries(data.fontes||{}).sort((a,b)=>b[1]-a[1])
  const topBenefit = benEntries[0]
  const benefitTotal = benEntries.reduce((a,[,v])=>a+v,0)
  const topBenefitPct = topBenefit && benefitTotal > 0 ? Math.round(topBenefit[1]/benefitTotal*100) : 0
  const conhecePorCidadeEntries = Object.entries(data.conheceSepdPorCidade || {})
    .map(([cidade, values]) => ({
      cidade,
      sim: values.Sim || 0,
      nao: values.Não || values.Nao || 0,
      total: (values.Sim || 0) + (values.Não || values.Nao || 0),
    }))
    .sort((a,b)=>b.total-a.total)
  const topBeneficioPorCidade = Object.entries(data.beneficiosPorCidade || {})
    .map(([cidade, values]) => {
      const entries = Object.entries(values).sort((a,b)=>b[1]-a[1])
      const totalCidade = entries.reduce((a,[,v])=>a+v,0)
      return { cidade, benefit: entries[0]?.[0] || '—', value: entries[0]?.[1] || 0, total: totalCidade }
    })
    .filter(item => item.total > 0)
    .sort((a,b)=>b.value-a.value)

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div className="dash-logo">
          <span className="dash-logo-icon-wrap">
            <img className="dash-logo-icon" src={INCLUSAO_LOGO} alt="Mandato da Inclusão" />
          </span>
          <div>
            <div className="dash-logo-title">Mandato da Inclusão</div>
            <div className="dash-logo-sub">SEPD · GDF</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {data.isDemoData && <div className="demo-badge">dados fictícios</div>}
          <button className="back-btn" onClick={onBack}>← Início</button>
        </div>
      </div>

      <div className="metrics-row">
        <MetricCard label="Total de atendimentos" value={total.toLocaleString('pt-BR')} accent={PALETTE.teal} />
        <MetricCard label="Cidade com mais visitas" value={topCidade} accent={PALETTE.blue} />
        <MetricCard label="Benefício mais solicitado" value={topBenefit?.[0] || '—'} accent={PALETTE.orange} />
        <MetricCard label="Conhecem a SEPD" value={conhecePct} accent={PALETTE.purple} />
      </div>

      <div className="tabs-bar">
        {TABS.map((t, i) => (
          <button key={t} className={`tab-btn ${t === 'Cidades' ? 'cities-tab' : ''} ${activeTab===i?'active':''}`} onClick={() => setActiveTab(i)}>
            {t === 'Cidades' && <MapPin size={16} aria-hidden="true" />} {t}
          </button>
        ))}
      </div>

      <div className="tab-body">
        {activeTab === 0 && (
          <div className="tab-pane">
            <ChartCard title="Visitas por cidade" subtitle={`${cidadeLabels.length} formulários carregados`} height={280}>
              <Bar
                data={{
                  labels: sortedCidades.map(c => c.l),
                  datasets: [{
                    data: sortedCidades.map(c => c.v),
                    backgroundColor: sortedCidades.map((_, i) => i === 0 ? PALETTE.teal : PALETTE.blue + '99'),
                    minBarLength: 4,
                    borderRadius: 6,
                    borderSkipped: false
                  }]
                }}
                options={BAR_OPTS(false)}
              />
            </ChartCard>

            <ChartCard title="Conhece os atendimentos e serviços da SEPD por cidade" subtitle="Pergunta 5 — comparação entre Sim e Não" height={Math.max(300, conhecePorCidadeEntries.length * 44 + 70)}>
              <Bar
                data={{
                  labels: conhecePorCidadeEntries.map(item => item.cidade),
                  datasets: [
                    {
                      label: 'Sim',
                      data: conhecePorCidadeEntries.map(item => item.sim),
                      backgroundColor: PALETTE.teal + 'dd',
                      borderRadius: 6,
                      borderSkipped: false
                    },
                    {
                      label: 'Não',
                      data: conhecePorCidadeEntries.map(item => item.nao),
                      backgroundColor: PALETTE.orange + 'cc',
                      borderRadius: 6,
                      borderSkipped: false
                    }
                  ]
                }}
                options={{
                  ...STACKED_BAR_OPTS,
                  plugins: { legend: { display: true, position: 'bottom' } }
                }}
              />
            </ChartCard>

            <div className="two-col">
              <div className="chart-card">
                <div className="chart-card-title">Conhece os serviços da SEPD?</div>
                <div className="chart-card-sub">Pergunta 5 do formulário</div>
                <DonutWithLegend data={data.conheceSepd} colors={[PALETTE.teal, PALETTE.orange]} />
              </div>
              <div className="chart-card">
                <div className="chart-card-title">Ficou sabendo da Carreta?</div>
                <div className="chart-card-sub">Pergunta 7 do formulário</div>
                <DonutWithLegend data={data.ficouSabendo} colors={[PALETTE.blue, PALETTE.gray]} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="tab-pane">
            <ChartCard title="Tipo de deficiência" subtitle="Pergunta 4 — múltipla escolha" height={Math.max(280, defEntries.length * 44 + 60)}>
              <Bar
                data={{
                  labels: defEntries.map(([l]) => l),
                  datasets: [{
                    data: defEntries.map(([,v]) => v),
                    backgroundColor: defEntries.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
                    borderRadius: 6,
                    borderSkipped: false
                  }]
                }}
                options={BAR_OPTS(true)}
              />
            </ChartCard>

            <div className="stat-list">
              <div className="stat-list-title">Detalhamento</div>
              {defEntries.map(([label, value], i) => {
                const tot = defEntries.reduce((a,[,v])=>a+v,0)
                const pct = Math.round(value/tot*100)
                return (
                  <div key={label} className="stat-row">
                    <div className="stat-dot" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}></div>
                    <div className="stat-label">{label}</div>
                    <div className="stat-bar-wrap">
                      <div className="stat-bar-fill" style={{ width: pct+'%', background: BAR_COLORS[i % BAR_COLORS.length] }}></div>
                    </div>
                    <div className="stat-count">{value}</div>
                    <div className="stat-pct">{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="tab-pane">
            <div className="insights-row">
              <InsightCard
                label="Maior demanda"
                value={topBenefit?.[0] || '—'}
                detail={topBenefit ? `${topBenefit[1]} solicitações · ${topBenefitPct}% do total de benefícios marcados` : ''}
                accent={PALETTE.orange}
              />
              <InsightCard
                label="Cidades com benefícios informados"
                value={topBeneficioPorCidade.length}
                detail="Considera apenas abas com respostas preenchidas"
                accent={PALETTE.blue}
              />
            </div>

            <ChartCard title="Benefícios solicitados" subtitle="Pergunta 6 — múltipla escolha" height={Math.max(320, benEntries.length * 42 + 60)}>
              <Bar
                data={{
                  labels: benEntries.map(([l]) => l),
                  datasets: [{
                    data: benEntries.map(([,v]) => v),
                    backgroundColor: PALETTE.blue + 'cc',
                    borderRadius: 6,
                    borderSkipped: false
                  }]
                }}
                options={BAR_OPTS(true)}
              />
            </ChartCard>

            {topBeneficioPorCidade.length > 0 && (
              <div className="stat-list">
                <div className="stat-list-title">Benefício mais solicitado por cidade</div>
                {topBeneficioPorCidade.map((item, i) => {
                  const pct = Math.round(item.value/item.total*100)
                  return (
                    <div key={item.cidade} className="stat-row">
                      <div className="stat-dot" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}></div>
                      <div className="stat-label strong">{item.cidade}</div>
                      <div className="stat-benefit">{item.benefit}</div>
                      <div className="stat-bar-wrap">
                        <div className="stat-bar-fill" style={{ width: pct+'%', background: BAR_COLORS[i % BAR_COLORS.length] }}></div>
                      </div>
                      <div className="stat-count">{item.value}</div>
                      <div className="stat-pct">{pct}%</div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="stat-list">
              <div className="stat-list-title">Ranking de necessidades</div>
              {benEntries.map(([label, value], i) => {
                const tot = benEntries.reduce((a,[,v])=>a+v,0)
                const pct = Math.round(value/tot*100)
                return (
                  <div key={label} className="stat-row">
                    <div className="stat-rank">#{i+1}</div>
                    <div className="stat-label">{label}</div>
                    <div className="stat-bar-wrap">
                      <div className="stat-bar-fill" style={{ width: pct+'%', background: PALETTE.blue }}></div>
                    </div>
                    <div className="stat-count">{value}</div>
                    <div className="stat-pct">{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="tab-pane">
            <ChartCard title="Conhece os atendimentos e serviços da SEPD por cidade" subtitle="Pergunta 5 — cidades onde é preciso reforçar divulgação" height={Math.max(300, conhecePorCidadeEntries.length * 44 + 70)}>
              <Bar
                data={{
                  labels: conhecePorCidadeEntries.map(item => item.cidade),
                  datasets: [
                    {
                      label: 'Sim',
                      data: conhecePorCidadeEntries.map(item => item.sim),
                      backgroundColor: PALETTE.teal + 'dd',
                      borderRadius: 6,
                      borderSkipped: false
                    },
                    {
                      label: 'Não',
                      data: conhecePorCidadeEntries.map(item => item.nao),
                      backgroundColor: PALETTE.orange + 'cc',
                      borderRadius: 6,
                      borderSkipped: false
                    }
                  ]
                }}
                options={{
                  ...STACKED_BAR_OPTS,
                  plugins: { legend: { display: true, position: 'bottom' } }
                }}
              />
            </ChartCard>

            <div className="two-col">
              <div className="chart-card">
                <div className="chart-card-title">Se interessa por política?</div>
                <div className="chart-card-sub">Pergunta 9 do formulário</div>
                <DonutWithLegend data={data.interessePolitico} colors={[PALETTE.purple, PALETTE.gray]} />
              </div>
              <div className="chart-card">
                <div className="chart-card-title">Ficou sabendo da Carreta?</div>
                <div className="chart-card-sub">Pergunta 7 do formulário</div>
                <DonutWithLegend data={data.ficouSabendo} colors={[PALETTE.teal, PALETTE.orange]} />
              </div>
            </div>

            {fonteEntries.length > 0 && (
              <div className="chart-card">
                <div className="chart-card-title">Como souberam da Carreta</div>
                <div className="chart-card-sub">Pergunta 8 — campo aberto agrupado</div>
                <div className="stat-list" style={{ marginTop: 16 }}>
                  {fonteEntries.map(([label, value], i) => {
                    const tot = fonteEntries.reduce((a,[,v])=>a+v,0)
                    const pct = Math.round(value/tot*100)
                    return (
                      <div key={label} className="stat-row">
                        <div className="stat-dot" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}></div>
                        <div className="stat-label">{label}</div>
                        <div className="stat-bar-wrap">
                          <div className="stat-bar-fill" style={{ width: pct+'%', background: BAR_COLORS[i % BAR_COLORS.length] }}></div>
                        </div>
                        <div className="stat-count">{value}</div>
                        <div className="stat-pct">{pct}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 4 && <CitiesView data={data} />}
      </div>

      <div className="dash-footer">
        Mandato da Inclusão · SEPD / GDF · {new Date().getFullYear()}
      </div>
    </div>
  )
}
