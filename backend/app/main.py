from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, date
from typing import List, Optional
import json

from app.database import Base, engine, get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.feedback import Feedback
from app.models.indicator import Indicator
from app.models.area import Area
from app.models.performance_history import PerformanceHistory
from app.models.pdi import PDI, PDIAction
from app.models.password_reset import PasswordResetCode
from app import schemas, auth
from app.pdf_service import generate_feedback_pdf
from app.init_db import init_admin_user
import random
import string

app = FastAPI(title="FeedAz - Sistema One-on-One")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

Base.metadata.create_all(bind=engine)

# Inicializar usuário admin padrão
db = next(get_db())
init_admin_user(db)
db.close()


def get_current_user(
    token: str = Depends(auth.oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = auth.decode_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


@app.get("/")
def root():
    return {"message": "FeedAz - Sistema One-on-One Online"}


# AUTH ENDPOINTS
@app.post("/users", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apenas admin pode criar novos usuários"""
    if current_user.perfil != "admin":
        raise HTTPException(
            status_code=403, detail="Apenas administradores podem criar usuários"
        )

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed_password = auth.get_password_hash(user.senha)
    hashed_resposta = (
        auth.get_password_hash(user.resposta_secreta) if user.resposta_secreta else None
    )

    db_user = User(
        email=user.email,
        nome=user.nome,
        senha=hashed_password,
        perfil="lider",
        area=user.area,
        pergunta_secreta=user.pergunta_secreta,
        resposta_secreta=hashed_resposta,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@app.get("/users", response_model=List[schemas.User])
def list_users(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Apenas admin pode listar usuários"""
    if current_user.perfil != "admin":
        raise HTTPException(
            status_code=403, detail="Apenas administradores podem listar usuários"
        )
    return db.query(User).filter(User.ativo == True).all()


@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apenas admin pode atualizar usuários"""
    if current_user.perfil != "admin":
        raise HTTPException(
            status_code=403, detail="Apenas administradores podem atualizar usuários"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if user_update.nome:
        user.nome = user_update.nome
    if user_update.email:
        existing = (
            db.query(User)
            .filter(User.email == user_update.email, User.id != user_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        user.email = user_update.email
    if user_update.area is not None:
        user.area = user_update.area
    if user_update.senha:
        user.senha = auth.get_password_hash(user_update.senha)
    if user_update.pergunta_secreta:
        user.pergunta_secreta = user_update.pergunta_secreta
    if user_update.resposta_secreta:
        user.resposta_secreta = auth.get_password_hash(user_update.resposta_secreta)

    db.commit()
    db.refresh(user)
    return user


@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apenas admin pode excluir usuários"""
    if current_user.perfil != "admin":
        raise HTTPException(
            status_code=403, detail="Apenas administradores podem excluir usuários"
        )

    if user_id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Você não pode excluir seu próprio usuário"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.ativo = False
    db.commit()

    return {"message": "Usuário excluído com sucesso"}


@app.post("/token", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.senha):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me", response_model=schemas.User)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/password-reset/request")
def request_password_reset(
    request: schemas.PasswordResetRequest, db: Session = Depends(get_db)
):
    """Retorna a pergunta secreta do usuário"""
    user = (
        db.query(User).filter(User.email == request.email, User.ativo == True).first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if not user.pergunta_secreta:
        raise HTTPException(
            status_code=400, detail="Usuário não possui pergunta secreta cadastrada"
        )

    return {"pergunta_secreta": user.pergunta_secreta}


@app.post("/password-reset/confirm")
def confirm_password_reset(reset: schemas.PasswordReset, db: Session = Depends(get_db)):
    """Confirma reset de senha com resposta secreta"""
    user = db.query(User).filter(User.email == reset.email, User.ativo == True).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if not user.resposta_secreta:
        raise HTTPException(
            status_code=400, detail="Usuário não possui resposta secreta cadastrada"
        )

    # Verificar resposta secreta
    if not auth.verify_password(reset.resposta_secreta, user.resposta_secreta):
        raise HTTPException(status_code=400, detail="Resposta secreta incorreta")

    # Atualizar senha
    user.senha = auth.get_password_hash(reset.nova_senha)
    db.commit()

    return {"message": "Senha alterada com sucesso"}


# AREA ENDPOINTS
@app.get("/areas", response_model=List[schemas.Area])
def list_areas(db: Session = Depends(get_db)):
    return db.query(Area).filter(Area.ativo == True).all()


@app.post("/areas", response_model=schemas.Area)
def create_area(
    area: schemas.AreaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.perfil != "admin":
        raise HTTPException(
            status_code=403, detail="Apenas administradores podem criar áreas"
        )

    existing = db.query(Area).filter(Area.nome == area.nome).first()
    if existing:
        raise HTTPException(status_code=400, detail="Área já cadastrada")

    db_area = Area(**area.dict())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area


@app.delete("/areas/{area_id}")
def delete_area(
    area_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.perfil != "admin":
        raise HTTPException(
            status_code=403, detail="Apenas administradores podem excluir áreas"
        )

    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada")

    area.ativo = False
    db.commit()
    return {"message": "Área excluída com sucesso"}


# EMPLOYEE ENDPOINTS
@app.post("/employees", response_model=schemas.Employee)
def create_employee(
    employee: schemas.EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Líder só pode criar funcionário das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        if employee.area not in user_areas:
            raise HTTPException(
                status_code=403,
                detail=f"Você só pode cadastrar funcionários das áreas: {current_user.area}",
            )

    hashed_password = auth.get_password_hash(employee.senha_assinatura)
    db_employee = Employee(
        nome=employee.nome,
        area=employee.area,
        cargo=employee.cargo,
        data_admissao=employee.data_admissao,
        lider_id=current_user.id,
        senha_assinatura=hashed_password,
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@app.get("/employees", response_model=List[schemas.Employee])
def list_employees(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    query = db.query(Employee).filter(Employee.ativo == True)

    # Admin vê todos, Líder vê funcionários das suas áreas (independente de quem cadastrou)
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.filter(Employee.area.in_(user_areas))

    return query.all()


@app.get("/employees/{employee_id}", response_model=schemas.Employee)
def get_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Employee).filter(Employee.id == employee_id)

    # Líder só vê funcionários das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.filter(Employee.area.in_(user_areas))

    employee = query.first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    return employee


@app.put("/employees/{employee_id}", response_model=schemas.Employee)
def update_employee(
    employee_id: int,
    employee_update: schemas.EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Employee).filter(Employee.id == employee_id)

    # Líder só edita funcionários das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.filter(Employee.area.in_(user_areas))

    employee = query.first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    # Líder não pode mudar área do funcionário para fora das suas áreas
    if current_user.perfil == "lider" and employee_update.area:
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        if employee_update.area not in user_areas:
            raise HTTPException(
                status_code=403,
                detail=f"Você só pode manter funcionários nas áreas: {current_user.area}",
            )

    if employee_update.nome:
        employee.nome = employee_update.nome
    if employee_update.area:
        employee.area = employee_update.area
    if employee_update.cargo:
        employee.cargo = employee_update.cargo
    if employee_update.data_admissao:
        employee.data_admissao = employee_update.data_admissao
    if employee_update.senha_assinatura:
        employee.senha_assinatura = auth.get_password_hash(
            employee_update.senha_assinatura
        )
    if employee_update.ativo is not None:
        employee.ativo = employee_update.ativo

    db.commit()
    db.refresh(employee)
    return employee


@app.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Employee).filter(Employee.id == employee_id)

    # Líder só deleta funcionários das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.filter(Employee.area.in_(user_areas))

    employee = query.first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    employee.ativo = False
    db.commit()
    return {"message": "Funcionário excluído com sucesso"}


# INDICATOR ENDPOINTS
@app.post("/indicators", response_model=schemas.Indicator)
def create_indicator(
    indicator: schemas.IndicatorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_indicator = Indicator(**indicator.dict())
    db.add(db_indicator)
    db.commit()
    db.refresh(db_indicator)
    return db_indicator


@app.get("/indicators", response_model=List[schemas.Indicator])
def list_indicators(area: str = None, db: Session = Depends(get_db)):
    all_indicators = db.query(Indicator).all()

    if area:
        # Filtrar indicadores que contenham a área especificada
        filtered = []
        for ind in all_indicators:
            indicator_areas = [a.strip() for a in (ind.area or "").split(",")]
            if area in indicator_areas:
                filtered.append(ind)
        return filtered

    return all_indicators


@app.put("/indicators/{indicator_id}", response_model=schemas.Indicator)
def update_indicator(
    indicator_id: int,
    indicator_update: schemas.IndicatorUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicador não encontrado")

    if indicator_update.nome:
        indicator.nome = indicator_update.nome
    if indicator_update.area:
        indicator.area = indicator_update.area
    if indicator_update.descricao is not None:
        indicator.descricao = indicator_update.descricao
    if indicator_update.meta is not None:
        indicator.meta = indicator_update.meta
    if indicator_update.campo_vinculado is not None:
        indicator.campo_vinculado = indicator_update.campo_vinculado

    db.commit()
    db.refresh(indicator)
    return indicator


@app.delete("/indicators/{indicator_id}")
def delete_indicator(
    indicator_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicador não encontrado")
    db.delete(indicator)
    db.commit()
    return {"message": "Indicador deletado"}


# FEEDBACK ENDPOINTS
@app.post("/feedbacks", response_model=schemas.Feedback)
def create_feedback(
    feedback: schemas.FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Employee).filter(Employee.id == feedback.funcionario_id)

    # Líder só cria feedback para funcionários das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.filter(Employee.area.in_(user_areas))

    employee = query.first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    db_feedback = Feedback(
        funcionario_id=feedback.funcionario_id,
        lider_id=current_user.id,
        data_feedback=feedback.data_feedback,
        tipo_feedback=feedback.tipo_feedback,
        periodo_avaliado=feedback.periodo_avaliado,
        motivo_feedback=feedback.motivo_feedback,
        descricao_feedback=feedback.descricao_feedback,
        indicadores_valores=feedback.indicadores_valores,
        assiduidade=feedback.assiduidade,
        aderencia=feedback.aderencia,
        pontos_positivos=feedback.pontos_positivos,
        melhorias=feedback.melhorias,
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@app.get("/feedbacks", response_model=List[schemas.Feedback])
def list_feedbacks(
    employee_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Feedback)

    # Líder vê todos os feedbacks dos funcionários das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.join(Employee).filter(Employee.area.in_(user_areas))

    if employee_id:
        query = query.filter(Feedback.funcionario_id == employee_id)

    return query.order_by(Feedback.data_feedback.desc()).all()


@app.get("/feedbacks/{feedback_id}", response_model=schemas.Feedback)
def get_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Feedback).filter(Feedback.id == feedback_id)

    # Líder vê feedbacks dos funcionários das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.join(Employee).filter(Employee.area.in_(user_areas))

    feedback = query.first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")
    return feedback


@app.post("/feedbacks/{feedback_id}/sign")
def sign_feedback(
    feedback_id: int, sign_data: schemas.FeedbackSign, db: Session = Depends(get_db)
):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")

    employee = db.query(Employee).filter(Employee.id == feedback.funcionario_id).first()
    if not auth.verify_password(sign_data.senha_assinatura, employee.senha_assinatura):
        raise HTTPException(status_code=400, detail="Senha incorreta")

    feedback.assinado = True
    feedback.data_assinatura = datetime.utcnow()
    feedback.comentario_colaborador = sign_data.comentario_colaborador
    db.commit()

    return {"message": "Feedback assinado com sucesso"}


@app.delete("/feedbacks/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apenas admin pode excluir feedbacks"""
    if current_user.perfil != "admin":
        raise HTTPException(
            status_code=403, detail="Apenas administradores podem excluir feedbacks"
        )

    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")

    db.delete(feedback)
    db.commit()
    return {"message": "Feedback excluído com sucesso"}


@app.get("/feedbacks/{feedback_id}/pdf")
def download_feedback_pdf(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Feedback).filter(Feedback.id == feedback_id)

    # Líder baixa PDF dos feedbacks dos funcionários das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.join(Employee).filter(Employee.area.in_(user_areas))

    feedback = query.first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")

    employee = db.query(Employee).filter(Employee.id == feedback.funcionario_id).first()

    feedback_data = {
        "funcionario_nome": employee.nome,
        "lider_nome": current_user.nome,
        "area": employee.area,
        "data_feedback": feedback.data_feedback,
        "tipo_feedback": feedback.tipo_feedback,
        "motivo_feedback": feedback.motivo_feedback,
        "descricao_feedback": feedback.descricao_feedback,
        "indicadores": feedback.indicadores_valores,
        "assiduidade": feedback.assiduidade,
        "aderencia": feedback.aderencia,
        "pontos_positivos": feedback.pontos_positivos,
        "melhorias": feedback.melhorias,
        "comentario_colaborador": feedback.comentario_colaborador,
        "assinado": feedback.assinado,
        "data_assinatura": feedback.data_assinatura,
    }

    pdf_buffer = generate_feedback_pdf(feedback_data)

    # Gerar nome do arquivo: feedback_NomeFuncionario_Periodo.pdf
    nome_funcionario = employee.nome.replace(" ", "_")
    periodo = (
        feedback.periodo_avaliado.replace(" ", "_").replace("/", "-")
        if feedback.periodo_avaliado
        else "sem_periodo"
    )
    filename = f"feedback_{nome_funcionario}_{periodo}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# DASHBOARD & ALERTS
@app.get("/dashboard/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # Queries base
    employees_query = db.query(Employee).filter(Employee.ativo == True)
    feedbacks_query = db.query(Feedback)

    # Líder vê apenas dados das suas áreas
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        employees_query = employees_query.filter(Employee.area.in_(user_areas))
        # Feedbacks: todos os feedbacks dos funcionários das suas áreas
        feedbacks_query = feedbacks_query.join(Employee).filter(
            Employee.area.in_(user_areas)
        )

    total_employees = employees_query.count()
    total_feedbacks = feedbacks_query.count()
    pending_signatures = feedbacks_query.filter(Feedback.assinado == False).count()

    # Alertas: funcionários sem feedback no mês atual
    current_month = date.today().replace(day=1)

    feedbacks_this_month_query = feedbacks_query.filter(
        Feedback.data_feedback >= current_month
    )

    employees_with_feedback = (
        feedbacks_this_month_query.with_entities(Feedback.funcionario_id)
        .distinct()
        .all()
    )
    employees_with_feedback_ids = [e[0] for e in employees_with_feedback]

    employees_without_feedback = employees_query.filter(
        ~Employee.id.in_(employees_with_feedback_ids)
    ).all()

    return {
        "total_employees": total_employees,
        "total_feedbacks": total_feedbacks,
        "pending_signatures": pending_signatures,
        "employees_without_feedback_this_month": [
            {"id": e.id, "nome": e.nome, "area": e.area}
            for e in employees_without_feedback
        ],
    }


# PERFORMANCE EVOLUTION ENDPOINT@app.get("/performance/evolution/{employee_id}")
def get_employee_evolution(
    employee_id: int,
    meses: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Evolução dos indicadores do funcionário ao longo dos meses"""

    # Verificar acesso
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        if employee.area not in user_areas:
            raise HTTPException(status_code=403, detail="Acesso negado")

    # Buscar feedbacks dos últimos N meses
    data_inicio = date.today().replace(day=1) - timedelta(days=meses * 30)

    feedbacks = (
        db.query(Feedback)
        .filter(
            Feedback.funcionario_id == employee_id,
            Feedback.data_feedback >= data_inicio,
        )
        .order_by(Feedback.data_feedback)
        .all()
    )

    evolution = []
    for fb in feedbacks:
        if not fb.indicadores_valores:
            continue

        try:
            indicadores = json.loads(fb.indicadores_valores)
            mes_ref = fb.data_feedback.strftime("%Y-%m")

            indicadores_data = []
            scores = []

            for ind in indicadores:
                try:
                    import re

                    valor_str = str(ind.get("valor", "")).strip()
                    meta_str = (
                        str(ind.get("indicator_meta", "")).strip()
                        if ind.get("indicator_meta")
                        else None
                    )

                    # Extrair apenas números
                    valor_num = re.sub(r"[^0-9.,\-]", "", valor_str).replace(",", ".")

                    if not valor_num or valor_num == ".":
                        # Valor não numérico, pula
                        indicadores_data.append(
                            {
                                "nome": ind.get("indicator_nome"),
                                "valor": valor_str,
                                "meta": meta_str,
                                "percentual": None,
                            }
                        )
                        continue

                    valor = float(valor_num)

                    if meta_str:
                        meta_num = re.sub(r"[^0-9.,\-]", "", meta_str).replace(",", ".")
                        if meta_num and meta_num != ".":
                            meta = float(meta_num)
                            if meta > 0:
                                score = min((valor / meta) * 100, 150)
                                percentual = round((valor / meta) * 100, 2)
                            else:
                                score = min(valor, 100)
                                percentual = None
                        else:
                            score = min(abs(valor), 100)
                            percentual = None
                            meta = None
                    else:
                        score = min(abs(valor), 100)
                        percentual = None
                        meta = None

                    scores.append(score)
                    indicadores_data.append(
                        {
                            "nome": ind.get("indicator_nome"),
                            "valor": valor_str,
                            "meta": meta_str,
                            "percentual": percentual,
                        }
                    )
                except (ValueError, TypeError, AttributeError):
                    # Mantém o indicador mesmo se não for numérico
                    indicadores_data.append(
                        {
                            "nome": ind.get("indicator_nome"),
                            "valor": ind.get("valor", ""),
                            "meta": ind.get("indicator_meta", ""),
                            "percentual": None,
                        }
                    )
                    continue

            if scores:
                evolution.append(
                    {
                        "mes": mes_ref,
                        "data_feedback": fb.data_feedback.isoformat(),
                        "score_medio": round(sum(scores) / len(scores), 2),
                        "indicadores": indicadores_data,
                        "feedback_id": fb.id,
                    }
                )
            elif indicadores_data:
                # Mesmo sem scores numéricos, mostra os indicadores
                evolution.append(
                    {
                        "mes": mes_ref,
                        "data_feedback": fb.data_feedback.isoformat(),
                        "score_medio": None,
                        "indicadores": indicadores_data,
                        "feedback_id": fb.id,
                    }
                )
        except json.JSONDecodeError:
            continue

    return {
        "employee_id": employee_id,
        "nome": employee.nome,
        "area": employee.area,
        "cargo": employee.cargo,
        "evolution": evolution,
    }


# PDI ENDPOINTS
@app.post("/pdis", response_model=schemas.PDI)
def create_pdi(
    pdi: schemas.PDICreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verificar acesso ao funcionário
    employee = db.query(Employee).filter(Employee.id == pdi.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        if employee.area not in user_areas:
            raise HTTPException(status_code=403, detail="Acesso negado")

    db_pdi = PDI(
        employee_id=pdi.employee_id,
        feedback_id=pdi.feedback_id,
        titulo=pdi.titulo,
        descricao=pdi.descricao,
        objetivo=pdi.objetivo,
        prazo=pdi.prazo,
        status=pdi.status,
        progresso=pdi.progresso,
        criado_por=current_user.id,
    )
    db.add(db_pdi)
    db.commit()
    db.refresh(db_pdi)

    # Adicionar ações
    if pdi.acoes:
        for acao in pdi.acoes:
            db_action = PDIAction(
                pdi_id=db_pdi.id, acao=acao.acao, descricao=acao.descricao
            )
            db.add(db_action)
        db.commit()

    return db_pdi


@app.get("/pdis")
def list_pdis(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PDI).join(Employee)

    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        query = query.filter(Employee.area.in_(user_areas))

    if employee_id:
        query = query.filter(PDI.employee_id == employee_id)

    if status:
        query = query.filter(PDI.status == status)

    return query.order_by(PDI.data_criacao.desc()).all()


@app.get("/pdis/{pdi_id}")
def get_pdi(
    pdi_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdi = db.query(PDI).filter(PDI.id == pdi_id).first()
    if not pdi:
        raise HTTPException(status_code=404, detail="PDI não encontrado")

    employee = db.query(Employee).filter(Employee.id == pdi.employee_id).first()
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        if employee.area not in user_areas:
            raise HTTPException(status_code=403, detail="Acesso negado")

    # Buscar ações
    acoes = db.query(PDIAction).filter(PDIAction.pdi_id == pdi_id).all()

    return {**pdi.__dict__, "acoes": acoes, "employee_nome": employee.nome}


@app.put("/pdis/{pdi_id}")
def update_pdi(
    pdi_id: int,
    pdi_update: schemas.PDIUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdi = db.query(PDI).filter(PDI.id == pdi_id).first()
    if not pdi:
        raise HTTPException(status_code=404, detail="PDI não encontrado")

    employee = db.query(Employee).filter(Employee.id == pdi.employee_id).first()
    if current_user.perfil == "lider":
        user_areas = [a.strip() for a in (current_user.area or "").split(",")]
        if employee.area not in user_areas:
            raise HTTPException(status_code=403, detail="Acesso negado")

    if pdi_update.titulo:
        pdi.titulo = pdi_update.titulo
    if pdi_update.descricao is not None:
        pdi.descricao = pdi_update.descricao
    if pdi_update.objetivo is not None:
        pdi.objetivo = pdi_update.objetivo
    if pdi_update.prazo:
        pdi.prazo = pdi_update.prazo
    if pdi_update.status:
        pdi.status = pdi_update.status
        if pdi_update.status == "CONCLUIDO" and not pdi.data_conclusao:
            pdi.data_conclusao = datetime.utcnow()
    if pdi_update.progresso is not None:
        pdi.progresso = pdi_update.progresso
    if pdi_update.observacoes is not None:
        pdi.observacoes = pdi_update.observacoes

    db.commit()
    db.refresh(pdi)
    return pdi


@app.post("/pdis/{pdi_id}/actions")
def add_pdi_action(
    pdi_id: int,
    action: schemas.PDIActionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdi = db.query(PDI).filter(PDI.id == pdi_id).first()
    if not pdi:
        raise HTTPException(status_code=404, detail="PDI não encontrado")

    db_action = PDIAction(
        pdi_id=pdi_id,
        acao=action.acao,
        descricao=action.descricao,
        concluida=action.concluida,
    )
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    return db_action


@app.put("/pdis/actions/{action_id}")
def update_pdi_action(
    action_id: int,
    concluida: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    action = db.query(PDIAction).filter(PDIAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Ação não encontrada")

    action.concluida = concluida
    if concluida and not action.data_conclusao:
        action.data_conclusao = datetime.utcnow()
    elif not concluida:
        action.data_conclusao = None

    db.commit()
    db.refresh(action)
    return action
