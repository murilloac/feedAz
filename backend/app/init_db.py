from sqlalchemy.orm import Session
from app.models.user import User
from app.auth import get_password_hash


def init_admin_user(db: Session):
    """Cria usuário admin padrão se não existir"""
    admin_email = "admin@feedaz.com"
    admin = db.query(User).filter(User.email == admin_email).first()

    if not admin:
        hashed_password = get_password_hash("admin")
        hashed_resposta = get_password_hash("feedaz")
        admin = User(
            email=admin_email,
            nome="Administrador",
            senha=hashed_password,
            perfil="admin",
            ativo=True,
            pergunta_secreta="Qual o nome do sistema?",
            resposta_secreta=hashed_resposta,
        )
        db.add(admin)
        db.commit()
        print(f"Usuario admin criado: {admin_email} / senha: admin")
        print(f"Pergunta secreta: Qual o nome do sistema? / Resposta: feedaz")
    else:
        print(f"Usuario admin ja existe: {admin_email}")
