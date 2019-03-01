# Tag the phase with a name
FROM node:alpine as builder
WORKDIR '/app'
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# app static files inside /app/build

FROM nginx
# Copy the result from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html
