FROM node:12
EXPOSE 8081

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

RUN npm install pm2@latest -g

VOLUME [ "/usr/src/app" ]

WORKDIR /usr/src/app
ENTRYPOINT pm2 start ecosystem.config.js && pm2 logs