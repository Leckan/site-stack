FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml README.md config.py main.py ./
COPY agents ./agents

RUN uv pip install --system .

EXPOSE 8002

CMD ["python", "main.py"]

