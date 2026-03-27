import { useState, useEffect } from 'react'
import './DespesasFixas.css'

export default function DespesasFixas({ gatilho }) {
  const [despesas, setDespesas] = useState([])
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')

  useEffect(() => {
    buscarDespesas()
  }, [gatilho])

  const buscarDespesas = async () => {
    try {
      const resposta = await fetch('http://127.0.0.1:8000/despesas')
      const dados = await resposta.json()
      setDespesas(dados)
    } catch (erro) {
      console.error("Erro ao buscar despesas:", erro)
    }
  }

  const adicionarDespesa = async (e) => {
    e.preventDefault()
    if (!nome || !valor) return

    try {
      const resposta = await fetch('http://127.0.0.1:8000/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, valor: parseFloat(valor), pago: false })
      })
      if (resposta.ok) { buscarDespesas(); setNome(''); setValor('') }
    } catch (erro) {
      console.error("Erro ao salvar despesa:", erro)
    }
  }

  const removerDespesa = async (id) => {
    try {
      const resposta = await fetch(`http://127.0.0.1:8000/despesas/${id}`, { method: 'DELETE' })
      if (resposta.ok) buscarDespesas()
    } catch (erro) {
      console.error("Erro ao deletar despesa:", erro)
    }
  }

  const alternarStatus = async (id, novoStatus) => {
    try {
      const resposta = await fetch(`http://127.0.0.1:8000/despesas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pago: novoStatus })
      })
      if (resposta.ok) buscarDespesas()
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro)
    }
  }

  const totalGeral = despesas.reduce((acc, d) => acc + d.valor, 0)
  const totalPago = despesas.filter(d => d.pago).reduce((acc, d) => acc + d.valor, 0)
  const totalFalta = totalGeral - totalPago

  return (
    <section>
      <h2>📌 Despesas Fixas</h2>

      {/* Resumo com cards individuais */}
      <div className="despesas-resumo">
        <div className="resumo-card">
          <span className="resumo-label">Total</span>
          <p className="resumo-valor">R$ {totalGeral.toFixed(2)}</p>
        </div>
        <div className="resumo-card pago">
          <span className="resumo-label">Pago</span>
          <p className="resumo-valor">R$ {totalPago.toFixed(2)}</p>
        </div>
        <div className="resumo-card falta">
          <span className="resumo-label">Falta</span>
          <p className="resumo-valor">R$ {totalFalta.toFixed(2)}</p>
        </div>
      </div>

      <form onSubmit={adicionarDespesa} className="despesas-form">
        <input
          type="text" placeholder="Nome da conta"
          value={nome} onChange={(e) => setNome(e.target.value)} required
        />
        <input
          type="number" placeholder="Valor" step="0.01"
          value={valor} onChange={(e) => setValor(e.target.value)} required
        />
        <button type="submit">Adicionar</button>
      </form>

      <ul className="despesas-lista">
        {despesas.map(despesa => (
          <li key={despesa.id} className={`despesa-item ${despesa.pago ? 'fundo-pago' : 'fundo-pendente'}`}>
            <span className={`despesa-nome ${despesa.pago ? 'texto-riscado' : 'texto-normal'}`}>
              {despesa.nome}
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.82rem' }}>
                R$ {despesa.valor.toFixed(2)}
              </span>
            </span>

            <div className="despesa-acoes">
              <button
                onClick={() => alternarStatus(despesa.id, true)}
                className={`btn-acao btn-verde ${despesa.pago ? 'btn-desativado' : ''}`}
                disabled={despesa.pago}
              >Pago</button>

              <button
                onClick={() => alternarStatus(despesa.id, false)}
                className={`btn-acao btn-amarelo ${!despesa.pago ? 'btn-desativado' : ''}`}
                disabled={!despesa.pago}
              >Desfazer</button>

              <button
                onClick={() => removerDespesa(despesa.id)}
                className="btn-acao btn-lixeira"
                title="Excluir"
              >🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}