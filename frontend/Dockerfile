# Build stage
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
RUN CI=false npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/build /usr/share/nginx/html

# Add custom nginx config for React Router if needed
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
