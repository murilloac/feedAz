from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Boolean, DateTime
from datetime import datetime
from app.database import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    funcionario_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    lider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    data_feedback = Column(Date, nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    periodo_avaliado = Column(String)  # Ex: "Janeiro/2024", "01/01/2024 a 31/01/2024"

    indicadores_valores = Column(Text)
    assiduidade = Column(String)
    aderencia = Column(String)

    pontos_positivos = Column(Text)
    melhorias = Column(Text)
    comentario_colaborador = Column(Text)

    assinado = Column(Boolean, default=False)
    data_assinatura = Column(DateTime)