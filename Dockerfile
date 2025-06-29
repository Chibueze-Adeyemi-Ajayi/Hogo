# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy only the TypeScript source files
COPY src ./src
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm install

# Build the NestJS application
RUN npm run build

# Expose the port the app runs on (default is 3000)
EXPOSE 3000

# Define environment variables (optional, but good practice)
ENV NODE_ENV=production
ENV API_VERSION=1.0.0
ENV DB_NAME = hogo_prod_db
ENV BASE_URL = https://roadopp.com/

# Command to run the NestJS application (using the built output)
CMD [ "npm", "run", "start:prod" ] 

# Build commands
# docker build -t intasync-api:1.0.[X] .
# docker images
# docker tag intasync-api:1.0.[X] jilodeveloper/intasync:v1.0.[X]
# docker push jilodeveloper/intasync:v1.0.[X]

# History
# 1.0.[X] -> Calendar reminder app
# 1.1.[X] -> Workspace
# 1.2.[X] -> Workflow
# 1.3.[X] ->
