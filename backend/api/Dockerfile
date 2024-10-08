FROM python:3-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

FROM nginx:latest

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir /etc/nginx/ssl

COPY --from=builder /app /app

EXPOSE 443

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 & nginx -g 'daemon off;'"]

