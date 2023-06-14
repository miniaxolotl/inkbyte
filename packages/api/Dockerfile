# configure image
FROM node:lts-hydrogen as build
WORKDIR /build
COPY . .

# initialize build tools
RUN \
	yarn install --frozen-lockfile \
	&& yarn rollup 

# configure image
FROM alpine:3.17
WORKDIR /app
COPY --from=build /build .

RUN \
	# initialize system packages
	apk update && apk upgrade \
	# configure node
	&& apk add --no-cache nodejs npm \ 
	&& npm install -g yarn \
	&& yarn db:generate

# finalize image
EXPOSE 3020
CMD yarn build:api && yarn start:api

LABEL org.opencontainers.image.source https://github.com/celestialstag/inkbyte/packages/api
LABEL org.opencontainers.image.description="inkbyte api"
LABEL org.opencontainers.image.licenses=GPL-3.0
