FROM node:18-alpine

WORKDIR /app

COPY . ./

RUN yarn i

CMD [ "yarn", "start" ]