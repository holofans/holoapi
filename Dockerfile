FROM node:12
EXPOSE 8081

RUN npm install pm2@latest -g

VOLUME [ "/usr/src/app" ]

WORKDIR /usr/src/app
ENTRYPOINT pm2 start ecosystem.config.js && pm2 logs