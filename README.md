# FeedAz - Sistema de Feedback One-on-One

Sistema web para registro e gerenciamento de feedbacks one-on-one com segregação por líder e área.

## Funcionalidades

✅ **Autenticação por Perfil**

- Admin: Acesso total ao sistema
- Líder: Acesso apenas aos funcionários e feedbacks da sua área

✅ **Segregação de Dados**

- Cada líder visualiza apenas funcionários da sua área
- Líderes só podem criar feedbacks para seus funcionários
- Admin tem visão completa de todas as áreas

✅ **Gestão de Usuários** (Admin)

- Criar líderes por área (CS, Implantação, Suporte)
- Excluir líderes
- Visualizar todos os usuários

✅ **Gestão de Funcionários**

- Cadastro com senha de assinatura individual
- Edição completa de dados
- Líderes só cadastram funcionários da sua área

✅ **Indicadores por Área**

- Cadastro com meta
- Edição e exclusão
- Filtro por área

✅ **Feedbacks Inteligentes**

- Indicadores carregados automaticamente pela área do funcionário
- Preenchimento de valores para cada indicador
- Assinatura digital do funcionário
- Exportação em PDF

✅ **Dashboard com Alertas**

- Estatísticas por área (para líderes)
- Estatísticas globais (para admin)
- Alertas de funcionários sem feedback no mês

✅ **Design Corporativo**

- Interface profissional
- Responsivo
- Cores e tipografia moderna

## Tecnologias

**Backend:**

- Python 3.x
- FastAPI
- SQLAlchemy
- SQLite
- JWT Authentication
- ReportLab (PDF)

**Frontend:**

- React 19
- TypeScript
- React Router
- Axios
- Vite

## Instalação

### 1. Backend

```bash
cd backend

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload
```

O backend estará rodando em `http://localhost:8000`

### 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar aplicação
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## Primeiro Acesso

### Usuário Admin (criado automaticamente)

- **Email:** admin@feedaz.com
- **Senha:** admin

## Fluxo de Uso

### Como Admin:

1. Faça login com admin@feedaz.com
2. Acesse "Usuários" e crie líderes para cada área
3. Acesse "Indicadores" e cadastre indicadores por área
4. Visualize dashboard com dados de todas as áreas

### Como Líder:

1. Faça login com suas credenciais
2. Cadastre funcionários da sua área
3. Crie feedbacks selecionando o funcionário
4. Os indicadores da área serão carregados automaticamente
5. Preencha os valores alcançados para cada indicador
6. Funcionário assina o feedback com sua senha
7. Exporte o PDF do feedback assinado

## Regras de Negócio

### Segregação por Área

- Líder de CS só vê funcionários e feedbacks de CS
- Líder de Implantação só vê funcionários e feedbacks de Implantação
- Líder de Suporte só vê funcionários e feedbacks de Suporte
- Admin vê tudo

### Restrições

- Líder não pode criar funcionário de outra área
- Líder não pode editar área do funcionário para fora da sua área
- Líder não pode criar feedback para funcionário de outra área
- Admin não pode ser excluído
- Usuário não pode excluir a si mesmo

### Alertas

- Sistema alerta sobre funcionários sem feedback no mês atual
- Cada líder vê alertas apenas da sua área
- Admin vê alertas de todas as áreas

## Estrutura do Projeto

```
feedAz/
├── backend/
│   ├── app/
│   │   ├── models/          # Modelos do banco
│   │   │   ├── user.py      # Usuários (admin/líder) com área
│   │   │   ├── employee.py  # Funcionários
│   │   │   ├── feedback.py  # Feedbacks
│   │   │   └── indicator.py # Indicadores com meta
│   │   ├── auth.py          # Autenticação JWT
│   │   ├── database.py      # Configuração DB
│   │   ├── init_db.py       # Inicialização admin
│   │   ├── main.py          # Rotas da API com segregação
│   │   ├── pdf_service.py   # Geração de PDF
│   │   └── schemas.py       # Schemas Pydantic
│   ├── seed_data.py         # Popular dados de teste
│   ├── check_admin.py       # Verificar/resetar admin
│   ├── .env
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/           # Páginas React
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Users.tsx    # Gestão de usuários (admin)
    │   │   ├── Employees.tsx # Gestão de funcionários
    │   │   ├── Indicators.tsx # Gestão de indicadores
    │   │   └── Feedbacks.tsx # Feedbacks com indicadores dinâmicos
    │   ├── services/        # API Service
    │   ├── styles/          # CSS global corporativo
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

## API Endpoints

### Autenticação

- `POST /token` - Login
- `GET /me` - Dados do usuário logado

### Usuários (Admin)

- `GET /users` - Listar usuários
- `POST /users` - Criar líder
- `DELETE /users/{id}` - Excluir líder

### Funcionários

- `GET /employees` - Listar (filtrado por área para líder)
- `POST /employees` - Criar
- `GET /employees/{id}` - Buscar
- `PUT /employees/{id}` - Atualizar

### Indicadores

- `GET /indicators` - Listar
- `POST /indicators` - Criar
- `PUT /indicators/{id}` - Atualizar
- `DELETE /indicators/{id}` - Deletar

### Feedbacks

- `GET /feedbacks` - Listar (filtrado por área para líder)
- `POST /feedbacks` - Criar
- `GET /feedbacks/{id}` - Buscar
- `POST /feedbacks/{id}/sign` - Assinar
- `GET /feedbacks/{id}/pdf` - Baixar PDF

### Dashboard

- `GET /dashboard/stats` - Estatísticas e alertas (filtrado por área para líder)

## Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT
- Segregação de dados por perfil e área
- Assinatura digital com senha individual
- Validação de dados com Pydantic
- CORS configurado

## Resetar Banco de Dados

Se precisar resetar o banco:

```bash
cd backend
del feedaz.db
uvicorn app.main:app --reload
```
