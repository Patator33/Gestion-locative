# Étape 1: Build
FROM node:20 AS builder

WORKDIR /app

# On vide le cache npm pour être sûr de repartir sur du propre
RUN npm cache clean --force

# Utilisation de npm avec flags de compatibilité maximum
COPY package.json ./
RUN npm install --legacy-peer-deps --verbose

COPY . .

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Configuration pour React 19 + react-scripts/craco
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=4096

# On affiche les logs détaillés pendant le build
RUN npm run build --verbose

# Étape 2: Serveur Nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
