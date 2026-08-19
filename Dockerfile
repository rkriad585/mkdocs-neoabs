FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt pyproject.toml package.json README.md ./
RUN pip install --no-cache-dir . && npm install

COPY . .
RUN npm run build && mkdocs build --clean


FROM python:3.11-slim

WORKDIR /app

RUN useradd --create-home --shell /bin/bash appuser

COPY --from=builder /app/site ./site
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/mkdocs /usr/local/bin/mkdocs

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')" || exit 1

CMD ["mkdocs", "serve", "--dev-addr=0.0.0.0:8000"]
