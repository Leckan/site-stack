FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml README.md ./
COPY tools ./tools
COPY server.py ./

RUN uv pip install --system .

EXPOSE 8001

CMD ["python", "server.py"]

