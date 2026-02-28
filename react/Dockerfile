FROM node:20-alpine

WORKDIR /app

# Install deps first (caches layer)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source (volume mount will override this in dev)
COPY . .

EXPOSE 5173

# --host 0.0.0.0 is required so the dev server is reachable outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
