FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY . .

# Créer le dossier uploads
RUN mkdir -p /app/uploads

# Exposer le port
EXPOSE 8001

# Démarrer l'application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
