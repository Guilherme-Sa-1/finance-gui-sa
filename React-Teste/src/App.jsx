import { useState, useEffect } from 'react'
import './App.css'
import DespesasFixas from './components/DespesasFixas'
import PrevisaoGastos from './components/PrevisaoGastos'

function App() {
  const [transacoes, setTransacoes] = useState([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('entrada')
  const [categoria, setCategoria] = useState('Outros')

  // Estado do Filtro de Mês
  const dataAtual = new Date()
  const anoMesAtual = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`
  const [mesFiltro, setMesFiltro] = useState(anoMesAtual)

  // O "sino" para atualizar os outros componentes
  const [gatilhoAtualizacao, setGatilhoAtualizacao] = useState(0)

  useEffect(() => {
    buscarTransacoes()
  }, [])

  const buscarTransacoes = async () => {
    try {
      const resposta = await fetch('http://127.0.0.1:8000/transacoes')
      const dados = await resposta.json()
      setTransacoes(dados)
    } catch (erro) {
      console.error("Erro ao buscar dados:", erro)
    }
  }

  const adicionarTransacao = async (evento) => {
    evento.preventDefault()

    const novaTransacao = {
      descricao: descricao,
      valor: parseFloat(valor),
      tipo: tipo,
      categoria: categoria 
    }

    try {
      const resposta = await fetch('http://127.0.0.1:8000/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaTransacao)
      })

      if (resposta.ok) {
        buscarTransacoes()
        setDescricao('')
        setValor('')
        setTipo('entrada')
        setCategoria('Outros')
        
        // Toca o sino para atualizar Previsão e Despesas Fixas
        setGatilhoAtualizacao(gatilhoAtualizacao + 1) 
      }
    } catch (erro) {
      console.error("Erro ao salvar dado:", erro)
    }
  }

  const deletarTransacao = async (id) => {
    try {
      const resposta = await fetch(`http://127.0.0.1:8000/transacoes/${id}`, {
        method: 'DELETE'
      })
      if (resposta.ok) {
        buscarTransacoes()
        // Toca o sino caso a exclusão afete o saldo geral da previsão
        setGatilhoAtualizacao(gatilhoAtualizacao + 1)
      }
    } catch (erro) {
      console.error("Erro ao deletar dado:", erro)
    }
  }

  // Filtro Mágico
  const transacoesFiltradas = transacoes.filter((transacao) => {
    const dataTransacao = transacao.created_at ? transacao.created_at.substring(0, 7) : ''
    return dataTransacao === mesFiltro
  })

  const saldoTotal = transacoesFiltradas.reduce((acc, transacao) => {
    if (transacao.tipo === 'entrada') {
      return acc + transacao.valor
    } else {
      return acc - transacao.valor
    }
  }, 0)

  return (
    <main>
      <h1>Meu Controle Financeiro</h1>

      <section style={{ textAlign: 'center', marginBottom: '20px', backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2980b9' }}>📅 Filtrar por Mês</h3>
        <input 
          type="month" 
          value={mesFiltro} 
          onChange={(e) => setMesFiltro(e.target.value)}
          style={{ padding: '8px 15px', fontSize: '1.1rem', borderRadius: '4px', border: '1px solid #bdc3c7', cursor: 'pointer' }}
        />
      </section>

      <section style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h2>Saldo do Mês</h2>
        <h3 style={{ color: saldoTotal >= 0 ? 'green' : 'red', fontSize: '32px', margin: '0' }}>
          R$ {saldoTotal.toFixed(2)}
        </h3>
      </section>

      {/* Passando o gatilho para a Previsão */}
      <PrevisaoGastos gatilho={gatilhoAtualizacao} />

      <section>
        <h2>Adicionar Transação</h2>
        <form onSubmit={adicionarTransacao}>
          <input 
            type="text" placeholder="Descrição" 
            value={descricao} onChange={(e) => setDescricao(e.target.value)} required
          />
          <input 
            type="number" placeholder="Valor" 
            value={valor} onChange={(e) => setValor(e.target.value)} required step="0.01"
          />
          
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="Salário">Salário</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Transporte">Transporte</option>
            <option value="Moradia">Moradia</option>
            <option value="Lazer">Lazer</option>
            <option value="Saúde">Saúde</option>
            <option value="Educação">Educação</option>
            <option value="Outros">Outros</option>
          </select>

          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>

          <button type="submit">Adicionar</button>
        </form>
      </section>

      <section>
        <h2>Extrato do Mês</h2>
        <ul>
          {transacoesFiltradas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Nenhuma transação neste mês.</p>
          ) : (
            transacoesFiltradas.map((transacao) => (
              <li key={transacao.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{transacao.descricao}</strong> 
                  <span style={{ fontSize: '0.8rem', backgroundColor: '#e0e0e0', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', color: '#555' }}>
                    {transacao.categoria}
                  </span>
                  : R$ {transacao.valor.toFixed(2)} 
                  <span style={{ color: transacao.tipo === 'entrada' ? 'green' : 'red', marginLeft: '10px' }}>
                    ({transacao.tipo})
                  </span>
                </div>
                
                <button 
                  onClick={() => deletarTransacao(transacao.id)} 
                  style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Excluir
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <hr style={{ margin: '40px 0' }} />
      {/* Passando o gatilho para as Despesas Fixas */}
      <DespesasFixas gatilho={gatilhoAtualizacao} />
    </main>
  )
}

export default App