import { useState, useEffect } from 'react'
import './PrevisaoGastos.css'

export default function PrevisaoGastos({ gatilho }) {
  const [saldoAtual, setSaldoAtual] = useState(0)
  const [contasAPagar, setContasAPagar] = useState(0)
  const [receitasFuturas, setReceitasFuturas] = useState('')

  useEffect(() => {
    carregarDados()
  }, [gatilho])

  const carregarDados = async () => {
    try {
      const [resTransacoes, resDespesas] = await Promise.all([
        fetch('http://127.0.0.1:8000/transacoes'),
        fetch('http://127.0.0.1:8000/despesas')
      ])
      const transacoes = await resTransacoes.json()
      const despesas = await resDespesas.json()

      const saldo = transacoes.reduce((acc, t) =>
        t.tipo === 'entrada' ? acc + t.valor : acc - t.valor, 0)
      setSaldoAtual(saldo)

      const pendentes = despesas
        .filter(d => !d.pago)
        .reduce((acc, d) => acc + d.valor, 0)
      setContasAPagar(pendentes)
    } catch (erro) {
      console.error("Erro ao carregar dados para previsão:", erro)
    }
  }

  const valorReceitasFuturas = parseFloat(receitasFuturas) || 0
  const previsaoFinal = saldoAtual + valorReceitasFuturas - contasAPagar

  return (
    <section>
      <h2>🔮 Previsão do Mês</h2>

      <div className="previsao-grid">
        <div className="card-valor">
          <h3>Saldo Atual</h3>
          <p style={{ color: saldoAtual >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            R$ {saldoAtual.toFixed(2)}
          </p>
        </div>

        <div className="card-valor">
          <h3>Vou receber (R$)</h3>
          <input
            type="number"
            className="input-receitas"
            placeholder="0,00"
            value={receitasFuturas}
            onChange={(e) => setReceitasFuturas(e.target.value)}
            step="0.01"
          />
        </div>

        <div className="card-valor">
          <h3>Falta Pagar</h3>
          <p style={{ color: 'var(--negative)' }}>
            − R$ {contasAPagar.toFixed(2)}
          </p>
        </div>
      </div>

      <div className={`resultado-previsao ${previsaoFinal >= 0 ? 'sobra' : 'falta'}`}>
        {previsaoFinal >= 0 ? '▲ Vai sobrar' : '▼ Vai faltar'}
        {' '}R$ {Math.abs(previsaoFinal).toFixed(2)}
      </div>

      <button className="btn-atualizar" onClick={carregarDados}>
        ↻ Atualizar
      </button>
    </section>
  )
}