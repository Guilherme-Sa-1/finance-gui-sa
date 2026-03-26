import { useState } from 'react'
import './ImportarExtrato.css'

export default function ImportarExtrato({ aoSucesso }) {
  const [arquivo, setArquivo] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const enviarArquivo = async (e) => {
    e.preventDefault()
    if (!arquivo) return

    setCarregando(true)
    
    // O FormData é o "pacote" do JavaScript feito especialmente para enviar arquivos
    const formData = new FormData()
    formData.append("arquivo", arquivo)

    try {
      // Quando enviamos um FormData, NÃO colocamos o 'Content-Type: application/json'
      // O próprio navegador cuida de avisar o Python que é um arquivo!
      const resposta = await fetch('http://127.0.0.1:8000/upload-extrato', {
        method: 'POST',
        body: formData, 
      })

      if (resposta.ok) {
        const dados = await resposta.json()
        alert(dados.mensagem) // Mostra quantas transações foram salvas!
        setArquivo(null)
        
        // Toca o sino no App.jsx para ele buscar as novas transações no banco
        aoSucesso() 
      } else {
        alert("Erro ao importar o extrato. Verifique se é o CSV correto.")
      }
    } catch (erro) {
      console.error("Erro:", erro)
      alert("Erro de conexão com o servidor.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section className="importar-section">
      <h3>📥 Importar Extrato Nubank (CSV)</h3>
      <form onSubmit={enviarArquivo} className="importar-form">
        <input 
          type="file" 
          accept=".csv" // Só deixa o usuário selecionar arquivos CSV
          onChange={(e) => setArquivo(e.target.files[0])} 
          className="input-arquivo"
        />
        <button type="submit" className="btn-enviar-csv" disabled={!arquivo || carregando}>
          {carregando ? "Importando..." : "Enviar Extrato"}
        </button>
      </form>
    </section>
  )
}