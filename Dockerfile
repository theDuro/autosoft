# Lekki obraz Node (tylko do serwowania statycznych plików)
FROM node:18-alpine

# Katalog w kontenerze
WORKDIR /app

# Kopiujemy gotowy build
COPY build/ ./build

# Instalujemy serwer statyczny serve
RUN npm install -g serve

# Otwieramy port 8080
EXPOSE 8080

# Uruchamiamy serwer statyczny z folderu build na porcie 8080
CMD ["serve", "-s", "build", "-l", "8080"]
