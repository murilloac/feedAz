from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    descricao = Column(String)
    ativo = Column(Boolean, default=True)
