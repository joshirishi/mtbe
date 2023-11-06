# Use the official Node.js image
FROM node:16


# Install Chromium
RUN apt-get update && apt-get install -y chromium

# Set Puppeteer to use the installed version of Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# If you're using puppeteer, you might need some additional dependencies for Chrome to run properly:
RUN apt-get update && apt-get install -y \
    libx11-xcb1 \
    libxcomposite1 \
    libxi6 \
    libxext6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libxss1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0

# Copy the entire project
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["npm", "start"]

 # Copy the webmap directory into the container
COPY ./webmap /app/webmap