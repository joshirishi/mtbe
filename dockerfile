# Use the official Node.js image
FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["npm", "start"]
