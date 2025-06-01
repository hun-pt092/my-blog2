FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install
# Cài đặt rõ ràng adapter-node
RUN npm install @sveltejs/adapter-node --save-dev

# Copy source code
COPY . .

# Copy riêng file +server.js bị nghi ngờ
COPY src/routes/api/comments/vote/+server.js ./src/routes/api/comments/vote/+server.js


# Build the app
RUN npm run build

# Expose ports

EXPOSE 3000
EXPOSE 3001

# Run the app
CMD ["node", "server.js"]
