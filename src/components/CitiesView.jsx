import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight, Clock3, CreditCard, Home, MapPin, Search, Users } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import { CITY_DETAILS } from '../data/cityDetails'
import { getCities, normalizeCityKey } from '../utils/cities'

export default function CitiesView({ data }) {
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const cities = useMemo(() => getCities(data?.cidades), [data])
  const selectedCity = cities.find(city => city.key === selectedKey)
  const cityDetails = selectedCity ? CITY_DETAILS[selectedCity.key] : null
  const liveCityDetails = cityDetails && selectedCity
    ? { ...cityDetails, domicilio: selectedCity.count }
    : null
  const filteredCities = cities.filter(city =>
    normalizeCityKey(city.name).includes(normalizeCityKey(query))
  )

  if (selectedCity) {
    return (
      <section className="city-detail" aria-labelledby="city-detail-title">
        <button className="city-back" type="button" onClick={() => setSelectedKey(null)}>
          <ArrowLeft size={17} aria-hidden="true" /> Voltar para cidades
        </button>
        <div className="city-detail-heading">
          <span className="city-icon"><MapPin aria-hidden="true" /></span>
          <div>
            <div className="city-eyebrow">Cidade selecionada</div>
            <h1 id="city-detail-title">{selectedCity.name}</h1>
            <p>{selectedCity.count.toLocaleString('pt-BR')} {selectedCity.count === 1 ? 'registro encontrado' : 'registros encontrados'}</p>
          </div>
        </div>
        {liveCityDetails ? <CityDashboard details={liveCityDetails} /> : <div className="city-empty-state">
          <MapPin size={30} aria-hidden="true" />
          <h2>Informações da cidade em preparação</h2>
          <p>Os registros desta cidade já estão selecionados. Os indicadores e conteúdos específicos serão exibidos aqui quando forem cadastrados.</p>
        </div>}
      </section>
    )
  }

  return (
    <section className="cities-view" aria-labelledby="cities-title">
      <div className="cities-heading">
        <div>
          <h1 id="cities-title">CIDADES ATENDIDAS</h1>
          <p>Selecione uma cidade para visualizar suas informações</p>
        </div>
        <div className="cities-count" aria-label={`${cities.length} cidades`}>
          <strong>{cities.length}</strong> {cities.length === 1 ? 'cidade' : 'cidades'}
        </div>
      </div>

      {cities.length === 0 ? (
        <div className="city-empty-state">
          <MapPin size={30} aria-hidden="true" />
          <h2>Nenhuma cidade cadastrada</h2>
          <p>Não há cidades válidas nos dados carregados.</p>
        </div>
      ) : (
        <>
          <label className="city-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar cidade</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cidade" />
          </label>

          {filteredCities.length === 0 ? (
            <div className="city-empty-state compact">
              <Search size={28} aria-hidden="true" />
              <h2>Nenhum resultado encontrado</h2>
              <p>Tente buscar por outro nome de cidade.</p>
            </div>
          ) : (
            <div className="cities-grid">
              {filteredCities.map((city, index) => (
                <button className={`city-card ${index % 2 === 0 ? 'city-card-blue' : 'city-card-yellow'}`} type="button" key={city.key} onClick={() => setSelectedKey(city.key)}>
                  <span className="city-icon"><MapPin aria-hidden="true" /></span>
                  <span className="city-card-copy">
                    <strong>{city.name}</strong>
                    <small>{city.count.toLocaleString('pt-BR')} {city.count === 1 ? 'registro' : 'registros'}</small>
                  </span>
                  <ChevronRight className="city-chevron" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          <CityDeliveryCharts cities={cities} />
        </>
      )}
    </section>
  )
}

function CityDeliveryCharts({ cities }) {
  const format = value => value.toLocaleString('pt-BR')
  const chartCities = cities
    .map(city => {
      const evento = CITY_DETAILS[city.key]?.evento || 0
      const domicilio = city.count
      return { ...city, evento, domicilio, alcance: evento + domicilio }
    })
    .sort((a, b) => b.alcance - a.alcance)

  const totalEvento = chartCities.reduce((sum, city) => sum + city.evento, 0)
  const totalDomicilio = chartCities.reduce((sum, city) => sum + city.domicilio, 0)
  const totalAlcance = totalEvento + totalDomicilio
  const height = Math.max(360, chartCities.length * 34)

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0,111,184,.1)' },
        ticks: { color: '#6B7882', precision: 0 },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#44515b', font: { size: 11, family: 'DM Sans' } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => `${format(context.raw)} carteirinhas`,
        },
      },
    },
  }

  const percentageOptions = {
    ...options,
    scales: {
      ...options.scales,
      x: {
        ...options.scales.x,
        max: 100,
        ticks: { ...options.scales.x.ticks, callback: value => `${value}%` },
      },
    },
    plugins: {
      ...options.plugins,
      tooltip: {
        callbacks: {
          label: context => {
            const city = chartCities[context.dataIndex]
            return `${context.raw.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% · ${format(city.alcance)} entregas`
          },
        },
      },
    },
  }

  const makeDataset = (values, color) => ({
    data: values,
    backgroundColor: color,
    borderRadius: 6,
    borderSkipped: false,
    minBarLength: 2,
  })

  return (
    <section className="city-charts" aria-labelledby="city-charts-title">
      <div className="city-charts-heading">
        <span>CONSOLIDADO DE ENTREGAS</span>
        <h2 id="city-charts-title">Análise de Dados de Entregas, Carreta e Domicílio</h2>
        <p>Comparativo calculado com os dados exibidos acima e com as entregas registradas nos eventos.</p>
      </div>

      <article className="city-chart-card">
        <div className="city-chart-header">
          <div><h3>Carteirinhas entregues nos eventos</h3><p>Total e distribuição por cidade</p></div>
          <strong>{format(totalEvento)}<small>entregues</small></strong>
        </div>
        <div className="city-chart-canvas" style={{ height }}>
          <Bar
            data={{ labels: chartCities.map(city => city.name), datasets: [makeDataset(chartCities.map(city => city.evento), '#079FE3')] }}
            options={options}
          />
        </div>
      </article>

      <article className="city-chart-card">
        <div className="city-chart-header">
          <div><h3>Carteirinhas entregues em domicílio</h3><p>Total e distribuição por cidade</p></div>
          <strong>{format(totalDomicilio)}<small>entregues</small></strong>
        </div>
        <div className="city-chart-canvas" style={{ height }}>
          <Bar
            data={{ labels: chartCities.map(city => city.name), datasets: [makeDataset(chartCities.map(city => city.domicilio), '#D8B400')] }}
            options={options}
          />
        </div>
      </article>

      <article className="city-chart-card">
        <div className="city-chart-header">
          <div><h3>Proporção potencial de votos por cidade</h3><p>Participação de cada cidade no total de entregas: evento + domicílio</p></div>
          <strong>{format(totalAlcance)}<small>pessoas alcançadas</small></strong>
        </div>
        <div className="city-chart-canvas" style={{ height }}>
          <Bar
            data={{
              labels: chartCities.map(city => city.name),
              datasets: [makeDataset(
                chartCities.map(city => totalAlcance ? Number((city.alcance / totalAlcance * 100).toFixed(1)) : 0),
                '#006FB8'
              )],
            }}
            options={percentageOptions}
          />
        </div>
        <p className="city-chart-note">Estimativa de alcance, não pesquisa de intenção de voto. Cada carteirinha entregue foi considerada uma pessoa potencialmente alcançada.</p>
      </article>
    </section>
  )
}

function CityDashboard({ details }) {
  const format = value => value.toLocaleString('pt-BR')
  const distribution = [
    { label: 'Entregues no evento', value: details.evento, icon: MapPin, className: 'event' },
    { label: 'Entregues em domicílio', value: details.domicilio, icon: Home, className: 'home' },
    { label: 'A entregar em domicílio', value: details.pendentes, icon: Clock3, className: 'pending' },
  ]
  const distributionTotal = distribution.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="city-dashboard">
      <div className="city-kpis">
        <article className="city-kpi primary">
          <span className="city-kpi-icon"><Users aria-hidden="true" /></span>
          <div><small>Presentes no evento</small><strong>{format(details.presentes)}</strong></div>
        </article>
        <article className="city-kpi gold">
          <span className="city-kpi-icon"><CreditCard aria-hidden="true" /></span>
          <div><small>Total confeccionadas</small><strong>{format(details.confeccionadas)}</strong></div>
        </article>
        <article className="city-kpi yellow">
          <span className="city-kpi-icon"><Clock3 aria-hidden="true" /></span>
          <div><small>Carteirinhas em confecção</small><strong>{format(details.emConfeccao)}</strong></div>
        </article>
      </div>

      <article className="delivery-panel">
        <div className="delivery-heading">
          <div><h2>DISTRIBUIÇÃO DAS CARTEIRINHAS</h2><p>Panorama das entregas informadas</p></div>
          <div className="delivery-total"><small>TOTAL DISTRIBUÍDO</small><strong>{format(distributionTotal)}</strong></div>
        </div>
        <div className="delivery-list">
          {distribution.map(item => {
            const Icon = item.icon
            const percentage = distributionTotal ? Math.round(item.value / distributionTotal * 100) : 0
            return (
              <div className="delivery-row" key={item.label}>
                <span className={`delivery-icon ${item.className}`}><Icon aria-hidden="true" /></span>
                <div className="delivery-data">
                  <div><span>{item.label}</span><strong>{format(item.value)}</strong></div>
                  <div className="delivery-track" aria-label={`${percentage}% do total distribuído`}><span className={item.className} style={{ width: `${percentage}%` }} /></div>
                </div>
                <span className="delivery-percent">{percentage}%</span>
              </div>
            )
          })}
        </div>
      </article>
    </div>
  )
}
