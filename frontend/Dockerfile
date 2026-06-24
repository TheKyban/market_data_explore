FROM node:20-alpine AS base

WORKDIR /app

COPY package.json bun.lock* ./
RUN npm install

COPY . .

# Build the Next.js application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
