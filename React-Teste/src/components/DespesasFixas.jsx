import { useState, useEffect } from 'react'
import './DespesasFixas.css' 

// 1. Recebendo o "gatilho" do App.jsx aqui na primeira linha
export default function DespesasFixas({ gatilho }) {
  const [despesas, setDespesas] = useState([])
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')

  // 2. Colocando o gatilho aqui dentro para ele recarregar a tela sozinho
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

    const novaDespesa = {
      nome: nome,
      valor: parseFloat(valor),
      pago: false
    }

    try {
      const resposta = await fetch('http://127.0.0.1:8000/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaDespesa)
      })

      if (resposta.ok) {
        buscarDespesas()
        setNome('')
        setValor('')
      }
    } catch (erro) {
      console.error("Erro ao salvar despesa:", erro)
    }
  }

  const removerDespesa = async (id) => {
    try {
      const resposta = await fetch(`http://127.0.0.1:8000/despesas/${id}`, {
        method: 'DELETE'
      })
      if (resposta.ok) {
        buscarDespesas()
      }
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
      if (resposta.ok) {
        buscarDespesas()
      }
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro)
    }
  }

  const totalGeral = despesas.reduce((acc, d) => acc + d.valor, 0)
  const totalPago = despesas.filter(d => d.pago).reduce((acc, d) => acc + d.valor, 0)
  const totalFalta = totalGeral - totalPago

  return (
    <section className="despesas-section">
      <h2>📌 Despesas Fixas do Mês</h2>
      
      <div className="despesas-resumo">
        <p><strong>Total:</strong> R$ {totalGeral.toFixed(2)}</p>
        <p className="texto-pago"><strong>Pago:</strong> R$ {totalPago.toFixed(2)}</p>
        <p className="texto-falta"><strong>Falta:</strong> R$ {totalFalta.toFixed(2)}</p>
      </div>

      <form onSubmit={adicionarDespesa} className="despesas-form">
        <input 
          type="text" placeholder="Nome da Conta (ex: Aluguel)" 
          value={nome} onChange={(e) => setNome(e.target.value)} 
          required
        />
        <input 
          type="number" placeholder="Valor" step="0.01"
          value={valor} onChange={(e) => setValor(e.target.value)} 
          required
        />
        <button type="submit" className="btn-adicionar">
          Adicionar Conta
        </button>
      </form>

      <ul className="despesas-lista">
        {despesas.map(despesa => (
          <li key={despesa.id} className={`despesa-item ${despesa.pago ? 'fundo-pago' : 'fundo-pendente'}`}>
            
            <span className={`despesa-nome ${despesa.pago ? 'texto-riscado' : 'texto-normal'}`}>
              {despesa.nome} - R$ {despesa.valor.toFixed(2)}
            </span>

            <div className="despesa-acoes">
              <button 
                onClick={() => alternarStatus(despesa.id, true)}
                className={`btn-acao btn-verde ${despesa.pago ? 'btn-desativado' : ''}`}
                disabled={despesa.pago}
              >
                Pago
              </button>

              <button 
                onClick={() => alternarStatus(despesa.id, false)}
                className={`btn-acao btn-amarelo ${!despesa.pago ? 'btn-desativado' : ''}`}
                disabled={!despesa.pago}
              >
                Não Pago
              </button>

              <button 
                onClick={() => removerDespesa(despesa.id)} 
                title="Excluir"
                className="btn-acao btn-lixeira"
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}