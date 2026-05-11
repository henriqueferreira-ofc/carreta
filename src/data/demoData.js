export function generateDemoData() {
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
