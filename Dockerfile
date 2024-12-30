FROM node:lts-alpine

WORKDIR /patient-svc

COPY package.json package-lock.json ./

# RUN npm ci --omit=dev && \
#     rm -rf $(npm get cache)
RUN npm install
COPY . .

CMD ["node", "index.js"]

ENTRYPOINT ["npm","run","dev"]