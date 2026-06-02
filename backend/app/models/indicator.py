from sqlalchemy import Column, Integer, String
from app.database import Base


class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    area = Column(String, nullable=False)  # Múltiplas áreas separadas por vírgula
    descricao = Column(String)
    meta = Column(String)
    campo_vinculado = Column(String)  # INDICADORES, ASSIDUIDADE, ADERENCIA
