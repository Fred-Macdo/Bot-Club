# FARM Stack Project - Frontend

This project is a frontend application built using React as part of the FARM stack (FastAPI, React, MongoDB). Below are the instructions for setting up and running the frontend application.

## Getting Started

To get started with the frontend application, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd farm-stack-project/frontend
   ```

2. **Install Dependencies**
   Make sure you have Node.js installed. Then, run the following command to install the required dependencies:
   ```bash
   npm install
   ```

3. **Running the Application**
   You can start the development server by running:
   ```bash
   npm start
   ```
   This will start the application on `http://localhost:3000`.

## Docker Support

To run the frontend application using Docker, follow these steps:

1. **Build the Docker Image**
   Navigate to the `frontend` directory and run:
   ```bash
   docker build -t frontend .
   ```

2. **Run the Docker Container**
   After building the image, you can run the container with:
   ```bash
   docker run -p 3000:3000 frontend
   ```

## Folder Structure

- `public/`: Contains the static files, including `index.html`.
- `src/`: Contains the React components and application logic.
- `package.json`: Lists the dependencies and scripts for the frontend application.

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.