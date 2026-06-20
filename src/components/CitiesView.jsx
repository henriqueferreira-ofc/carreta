import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight, Clock3, CreditCard, Home, MapPin, Search, Users } from 'lucide-react'
import { CITY_DETAILS } from '../data/cityDetails'
import { getCities, normalizeCityKey } from '../utils/cities'

export default function CitiesView({ data }) {
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const cities = useMemo(() => getCities(data?.cidades), [data])
  const selectedCity = cities.find(city => city.key === selectedKey)
  const cityDetails = selectedCity ? CITY_DETAILS[selectedCity.key] : null
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
        {cityDetails ? <CityDashboard details={cityDetails} /> : <div className="city-empty-state">
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
        </>
      )}
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
