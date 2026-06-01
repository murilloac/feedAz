from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    senha = Column(String, nullable=False)
    perfil = Column(String, default="lider")
    area = Column(String)
    ativo = Column(Boolean, default=True)
    pergunta_secreta = Column(String)
    resposta_secreta = Column(String)