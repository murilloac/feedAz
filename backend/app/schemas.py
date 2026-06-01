from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# Area Schemas
class AreaBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

class AreaCreate(AreaBase):
    pass

class Area(AreaBase):
    id: int
    ativo: bool
    
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    nome: str
    area: Optional[str] = None
    pergunta_secreta: Optional[str] = None

class UserCreate(UserBase):
    senha: str
    resposta_secreta: Optional[str] = None

class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    area: Optional[str] = None
    senha: Optional[str] = None
    pergunta_secreta: Optional[str] = None
    resposta_secreta: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class User(UserBase):
    id: int
    perfil: str
    ativo: bool
    
    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    nome: str
    area: str
    cargo: Optional[str] = None
    data_admissao: Optional[date] = None

class EmployeeCreate(EmployeeBase):
    senha_assinatura: str

class EmployeeUpdate(BaseModel):
    nome: Optional[str] = None
    area: Optional[str] = None
    cargo: Optional[str] = None
    data_admissao: Optional[date] = None
    senha_assinatura: Optional[str] = None
    ativo: Optional[bool] = None

class Employee(EmployeeBase):
    id: int
    lider_id: int
    ativo: bool
    
    class Config:
        from_attributes = True

# Indicator Schemas
class IndicatorBase(BaseModel):
    nome: str
    area: str
    descricao: Optional[str] = None
    meta: Optional[str] = None
    campo_vinculado: Optional[str] = "INDICADORES"  # INDICADORES, ASSIDUIDADE, ADERENCIA

class IndicatorCreate(IndicatorBase):
    pass

class IndicatorUpdate(BaseModel):
    nome: Optional[str] = None
    area: Optional[str] = None
    descricao: Optional[str] = None
    meta: Optional[str] = None
    campo_vinculado: Optional[str] = None

class Indicator(IndicatorBase):
    id: int
    
    class Config:
        from_attributes = True

# Feedback Schemas
class IndicatorValue(BaseModel):
    indicator_id: int
    indicator_nome: str
    valor: str

class FeedbackBase(BaseModel):
    funcionario_id: int
    data_feedback: date
    tipo_feedback: str = "MENSAL"  # MENSAL ou PONTUAL
    periodo_avaliado: Optional[str] = None
    motivo_feedback: Optional[str] = None  # Apenas para PONTUAL
    descricao_feedback: Optional[str] = None  # Apenas para PONTUAL
    indicadores_valores: Optional[str] = None
    assiduidade: Optional[str] = None
    aderencia: Optional[str] = None
    pontos_positivos: Optional[str] = None
    melhorias: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackSign(BaseModel):
    senha_assinatura: str
    comentario_colaborador: Optional[str] = None

class Feedback(FeedbackBase):
    id: int
    lider_id: int
    data_criacao: datetime
    tipo_feedback: str
    assinado: bool
    data_assinatura: Optional[datetime] = None
    comentario_colaborador: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    resposta_secreta: str
    nova_senha: str

# Audit Log Schemas
class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None

class AuditLog(AuditLogBase):
    id: int
    user_id: int
    ip_address: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Performance History Schemas
class PerformanceHistoryBase(BaseModel):
    employee_id: int
    feedback_id: int
    mes_referencia: date
    score_total: Optional[float] = None
    indicadores_json: Optional[str] = None
    posicao_ranking: Optional[int] = None

class PerformanceHistory(PerformanceHistoryBase):
    id: int
    
    class Config:
        from_attributes = True

# PDI Schemas
class PDIActionBase(BaseModel):
    acao: str
    descricao: Optional[str] = None
    concluida: bool = False

class PDIActionCreate(PDIActionBase):
    pass

class PDIAction(PDIActionBase):
    id: int
    pdi_id: int
    data_conclusao: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PDIBase(BaseModel):
    employee_id: int
    titulo: str
    descricao: Optional[str] = None
    objetivo: Optional[str] = None
    prazo: Optional[date] = None
    status: str = "EM_ANDAMENTO"
    progresso: int = 0

class PDICreate(PDIBase):
    feedback_id: Optional[int] = None
    acoes: Optional[List[PDIActionCreate]] = []

class PDIUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    objetivo: Optional[str] = None
    prazo: Optional[date] = None
    status: Optional[str] = None
    progresso: Optional[int] = None
    observacoes: Optional[str] = None

class PDI(PDIBase):
    id: int
    feedback_id: Optional[int] = None
    criado_por: int
    data_criacao: datetime
    data_conclusao: Optional[datetime] = None
    observacoes: Optional[str] = None
    
    class Config:
        from_attributes = True
