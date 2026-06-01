from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text
from app.database import Base

class PerformanceHistory(Base):
    __tablename__ = "performance_history"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"), nullable=False)
    mes_referencia = Column(Date, nullable=False)
    score_total = Column(Float)  # Média dos indicadores
    indicadores_json = Column(Text)  # JSON com todos os indicadores e valores
    posicao_ranking = Column(Integer)  # Posição no ranking do mês
