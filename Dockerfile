FROM node:lts-alpine

# TODO: Cambiar el nombre de la carpeta por el nombre de tu proyecto
WORKDIR /patient-svc

COPY . .

RUN npm ci --production && \
    rm -rf $(npm get cache)

ENTRYPOINT ["npm", "start"]