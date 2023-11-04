# Stage 0: Installing the base dependenices
# Specifies the explicit base image.
FROM node:18.17.1-bullseye@sha256:ac3f66d9f35a704ec33831a1e90d90eb3eb20506cf24750837b442612728e51a AS dependencies

# Metadata about the image
LABEL maintainer="J.P. Ostiano <jostiano1@myseneca.ca>" \
      description="fragments-ui web app for testing"

# Enviornment Variables
# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy the package.json and package-lock.json files into working directory
COPY package* .

# Install node dependencies defined in the package.json and package-lock.json
RUN npm ci

# Copy src to /app/src/
COPY . .

########################################################
# Stage 1: Use dependencies to build the site
FROM node:18.17.1-bullseye@sha256:ac3f66d9f35a704ec33831a1e90d90eb3eb20506cf24750837b442612728e51a AS build

# # Use /app as my working directory
WORKDIR /app

# # Copy the dependencies from previous stage so we don't have to download
COPY --from=dependencies /app /app

# copy the soruce code into image
COPY . .

# Build site to build
RUN npm run build

#######################################################
# Stage 2: nginx web server to serve the app
FROM nginx:stable-alpine@sha256:62cabd934cbeae6195e986831e4f745ee1646c1738dbd609b1368d38c10c5519 AS deploy

# Defualt port 80 in our service
ENV PORT=80

# COPY from build stage to the dir that nginx expects for static sites
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail localhost:${PORT} || exit 1

# # Build the fragments-ui web apps and serve it via pacel
# # Changed the Underlying operating system. Picking the right base image.
# FROM node:18.17.1-bullseye

# # Metadata:
# LABEL maintainer="J.P. Ostiano <jostiano1@myseneca.ca>" \
#       description="fragments-ui web app for testing"

# # Reduce npm spam when installing within Docker
# # https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
# # Disable colour when run inside Docker
# # https://docs.npmjs.com/cli/v8/using-npm/config#color
# ENV NPM_CONFIG_LOGLEVEL=warn \
#     NPM_CONFIG_COLOR=false

# # Use /app as our working directory. Holds the application in the filesystem in the image.
# WORKDIR /app

# # Copy our package.json/package-lock.json in
# COPY package* .

# # Install node dpendencies defined in the package.json and package-lock.json
# RUN npm ci

# # Copy everything else into /app
# COPY . .

# RUN npm run build

# # Defualt command
# # Run the server
# CMD npm start

# # Default port to 1234
# EXPOSE 1234