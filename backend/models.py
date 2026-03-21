from pydantic import BaseModel

# Molde para as Transações do Extrato
class TransacaoBase(BaseModel):
    descricao: str
    valor: float
    tipo: str
    categoria: str

# Molde para as Despesas Fixas
class DespesaFixaBase(BaseModel):
    nome: str
    valor: float
    pago: bool = False

# Molde para atualizar apenas o status de "pago"
class AtualizarStatusDespesa(BaseModel):
    pago: bool