# Étape 1: Build
FROM node:18 AS builder

WORKDIR /app

# On utilise npm car il gère mieux les conflits de dépendances de React 19
# via le flag --legacy-peer-deps quand le lockfile est absent.
COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN npm run build

# Étape 2: Serveur Nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
