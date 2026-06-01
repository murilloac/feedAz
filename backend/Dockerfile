FROM node:22-alpine

WORKDIR /app

RUN pip install -r requirements.txt

RUN npm install

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
