from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    ForeignKey,
    Boolean,
    DateTime,
)
from datetime import datetime
from app.database import Base


class PDI(Base):
    __tablename__ = "pdis"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    titulo = Column(String, nullable=False)
    descricao = Column(Text)
    objetivo = Column(Text)
    prazo = Column(Date)
    status = Column(
        String, default="EM_ANDAMENTO"
    )  # EM_ANDAMENTO, CONCLUIDO, CANCELADO
    progresso = Column(Integer, default=0)  # 0-100
    criado_por = Column(Integer, ForeignKey("users.id"), nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_conclusao = Column(DateTime)
    observacoes = Column(Text)


class PDIAction(Base):
    __tablename__ = "pdi_actions"

    id = Column(Integer, primary_key=True, index=True)
    pdi_id = Column(Integer, ForeignKey("pdis.id"), nullable=False)
    acao = Column(String, nullable=False)
    descricao = Column(Text)
    concluida = Column(Boolean, default=False)
    data_conclusao = Column(DateTime)
