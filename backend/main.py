import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Importando as classes do nosso novo arquivo models.py
from models import TransacaoBase, DespesaFixaBase, AtualizarStatusDespesa

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


# === ROTAS DE TRANSAÇÕES (EXTRATO) ===

@app.get("/")
def rota_principal():
    return {"mensagem": "API do Controle Financeiro está online! 🚀"}

@app.get("/transacoes")
def listar_transacoes():
    resposta = supabase.table("transacoes").select("*").execute()
    return resposta.data

@app.post("/transacoes")
def criar_transacao(transacao: TransacaoBase):
    # 1. Cria e salva a transação no extrato normalmente
    dados = {
        "descricao": transacao.descricao,
        "valor": transacao.valor,
        "tipo": transacao.tipo,
        "categoria": transacao.categoria
    }
    resposta = supabase.table("transacoes").insert(dados).execute()

    # 2. Automação blindada com Try/Except
    if transacao.tipo == "saida":
        try:
            # Pega todas as despesas fixas
            busca = supabase.table("despesas_fixas").select("*").execute()
            
            for despesa in busca.data:
                # O .strip().lower() remove espaços em branco e deixa tudo minúsculo.
                # Assim, "Aluguel " e "aluguel" são reconhecidos como a mesma coisa!
                if despesa["nome"].strip().lower() == transacao.descricao.strip().lower():
                    # Se achou, atualiza para pago
                    supabase.table("despesas_fixas").update({"pago": True}).eq("id", despesa["id"]).execute()
        
        except Exception as e:
            # Se der erro na automação, ele avisa no terminal, mas NÃO quebra o servidor
            print(f"Erro na automação de despesa fixa: {e}")

    # Retorna o OK da transação (mesmo se a automação acima falhar)
    return resposta.data

@app.delete("/transacoes/{id}")
def deletar_transacao(id: int):
    resposta = supabase.table("transacoes").delete().eq("id", id).execute()
    return resposta.data


# === ROTAS DE DESPESAS FIXAS ===

@app.get("/despesas")
def listar_despesas():
    # order("id") garante que a lista venha sempre na mesma ordem
    resposta = supabase.table("despesas_fixas").select("*").order("id").execute()
    return resposta.data

@app.post("/despesas")
def criar_despesa(despesa: DespesaFixaBase):
    dados = {
        "nome": despesa.nome,
        "valor": despesa.valor,
        "pago": despesa.pago
    }
    resposta = supabase.table("despesas_fixas").insert(dados).execute()
    return resposta.data

@app.delete("/despesas/{id}")
def deletar_despesa(id: int):
    resposta = supabase.table("despesas_fixas").delete().eq("id", id).execute()
    return resposta.data

@app.put("/despesas/{id}")
def atualizar_status_despesa(id: int, status: AtualizarStatusDespesa):
    resposta = supabase.table("despesas_fixas").update({"pago": status.pago}).eq("id", id).execute()
    return resposta.data