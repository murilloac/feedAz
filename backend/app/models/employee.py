from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    area = Column(String, nullable=False)
    cargo = Column(String)
    data_admissao = Column(Date)
    lider_id = Column(Integer, ForeignKey("users.id"))
    senha_assinatura = Column(String, nullable=False)
    ativo = Column(Boolean, default=True)
