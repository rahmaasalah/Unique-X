# Build Stage
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration production

# Nginx Stage
FROM nginx:alpine
# عدلنا المسار هنا لـ UniqueXApp
COPY --from=build /app/dist/UniqueXApp/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]