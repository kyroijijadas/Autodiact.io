# Use an official, lightweight Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server using the dev script (nodemon)
CMD ["npm", "run", "dev"]