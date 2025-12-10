FROM node:20-alpine AS builder

WORKDIR /app

# Allow overriding the API URL at build time
ARG REACT_APP_API_URL=http://localhost:4000/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

# Replace the default nginx config with one suited for a React SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled assets from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
