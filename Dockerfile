FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install
# Cài đặt rõ ràng adapter-node
RUN npm install @sveltejs/adapter-node --save-dev

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose ports
EXPOSE 3000
EXPOSE 3001

# Run the app
CMD ["node", "server.js"]
