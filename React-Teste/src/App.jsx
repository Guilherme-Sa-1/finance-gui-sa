import { useState, useEffect } from 'react'
import './App.css'
import DespesasFixas from './components/DespesasFixas'
import PrevisaoGastos from './components/PrevisaoGastos'
import ImportarExtrato from './components/ImportarExtrato'

// Importações do Calendário
import DatePicker, { registerLocale } from 'react-datepicker'
import ptBR from 'date-fns/locale/pt-BR'
import 'react-datepicker/dist/react-datepicker.css'

// Ativando o português no calendário
registerLocale('pt-BR', ptBR)

function App() {
  const [transacoes, setTransacoes] = useState([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('entrada')
  const [categoria, setCategoria] = useState('Outros')

  // Novo Estado do Filtro com o Calendário
  const [dataFiltro, setDataFiltro] = useState(new Date())
  
  // Transformando a data do calendário para o formato que o filtro entende (YYYY-MM)
  const mesFiltro = `${dataFiltro.getFullYear()}-${String(dataFiltro.getMonth() + 1).padStart(2, '0')}`
  
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
    const novaTransacao = { descricao, valor: parseFloat(valor), tipo, categoria }

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
        setGatilhoAtualizacao(gatilhoAtualizacao + 1) 
      }
    } catch (erro) {
      console.error("Erro ao salvar dado:", erro)
    }
  }

  const deletarTransacao = async (id) => {
    try {
      const resposta = await fetch(`http://127.0.0.1:8000/transacoes/${id}`, { method: 'DELETE' })
      if (resposta.ok) {
        buscarTransacoes()
        setGatilhoAtualizacao(gatilhoAtualizacao + 1)
      }
    } catch (erro) {
      console.error("Erro ao deletar dado:", erro)
    }
  }

  const atualizarAposImportacao = () => {
    buscarTransacoes()
    setGatilhoAtualizacao(gatilhoAtualizacao + 1)
  }

  const transacoesFiltradas = transacoes.filter((transacao) => {
    const dataOriginal = transacao.created_at || transacao.data_criacao
    if (!dataOriginal) return true 
    const dataTransacao = dataOriginal.substring(0, 7)
    return dataTransacao === mesFiltro
  })

  const saldoTotal = transacoesFiltradas.reduce((acc, transacao) => {
    return transacao.tipo === 'entrada' ? acc + transacao.valor : acc - transacao.valor
  }, 0)

  return (
    <main className="dashboard-container">
      <h1 className="titulo-principal">Painel Financeiro</h1>

      {/* Topo: Saldo e Novo Calendário */}
      <div className="topo-dashboard">
        <div>
          <h2 className="label-secundaria">Saldo Total</h2>
          <h3 className={saldoTotal >= 0 ? 'saldo-positivo' : 'saldo-negativo'}>
            R$ {saldoTotal.toFixed(2)}
          </h3>
        </div>
        <div className="filtro-mes">
          <h3 className="label-secundaria">Mês de Referência</h3>
          <DatePicker
            selected={dataFiltro}
            onChange={(data) => setDataFiltro(data)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            locale="pt-BR"
            className="input-calendario"
          />
        </div>
      </div>

      {/* Grid Lado a Lado */}
      <div className="grid-dashboard">
        
        {/* COLUNA ESQUERDA */}
        <div className="coluna">
          <section>
            <h2>Nova Transação</h2>
            <form onSubmit={adicionarTransacao} className="form-transacao">
              <input type="text" placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
              <div className="linha-inputs">
                <input type="number" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} required step="0.01" />
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
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
              <button type="submit">Adicionar</button>
            </form>
          </section>

          <section>
            <h2>Extrato do Mês</h2>
            {/* Adicionada a classe lista-extrato para o scroll funcionar */}
            <ul className="lista-extrato">
              {transacoesFiltradas.length === 0 ? (
                <p className="texto-vazio">Nenhuma transação neste mês.</p>
              ) : (
                transacoesFiltradas.map((transacao) => (
                  <li key={transacao.id} className="item-extrato">
                    <div className="info-extrato">
                      <strong>{transacao.descricao}</strong> 
                      <span className="tag-categoria">{transacao.categoria}</span>
                    </div>
                    <div className="acoes-extrato">
                      <span className={transacao.tipo === 'entrada' ? 'valor-positivo' : 'valor-neutro'}>
                        {transacao.tipo === 'saida' ? '-' : '+'} R$ {transacao.valor.toFixed(2)} 
                      </span>
                      <button onClick={() => deletarTransacao(transacao.id)} className="btn-excluir">🗑️</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {/* COLUNA DIREITA */}
        <div className="coluna">
          <PrevisaoGastos gatilho={gatilhoAtualizacao} />
          <ImportarExtrato aoSucesso={atualizarAposImportacao} />
          <DespesasFixas gatilho={gatilhoAtualizacao} />
        </div>

      </div>
    </main>
  )
}

export default App