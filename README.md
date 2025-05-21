# Bot Club Farm Stack Project

This project is a full-stack application built using the FARM stack, which consists of FastAPI, React, MongoDB, and Docker. The application is structured into two main parts: the backend and the frontend.

## Project Structure

```
farm-stack-project
├── backend          # Contains the backend application
│   ├── src         # Source code for the backend
│   │   ├── main.py # Entry point for the FastAPI application
│   │   └── requirements.txt # Python dependencies
│   ├── Dockerfile   # Dockerfile for building the backend image
│   └── README.md    # Documentation for the backend
├── frontend         # Contains the frontend application
│   ├── public       # Public assets for the frontend
│   │   └── index.html # Main HTML file for the React app
│   ├── src         # Source code for the frontend
│   │   ├── App.js   # Main React component
│   │   ├── index.js # Entry point for the React application
│   │   └── components
│   │       └── ExampleComponent.js # Example React component
│   ├── package.json # npm configuration for the frontend
│   ├── Dockerfile   # Dockerfile for building the frontend image
│   └── README.md    # Documentation for the frontend
├── docker-compose.yml # Configuration for running the application with Docker
└── README.md        # General documentation for the entire project
```

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1. Clone the repository:
   ```
   git clone <repository-url>
   cd farm-stack-project
   ```

2. Build and run the application using Docker Compose:
   ```
   docker-compose up --build
   ```

3. Access the application:
   - Backend API: `http://localhost:8000`
   - Frontend: `http://localhost:3000`

## Overview of the FARM Stack

- **FastAPI**: A modern web framework for building APIs with Python 3.6+ based on standard Python type hints.
- **React**: A JavaScript library for building user interfaces, allowing for the creation of single-page applications.
- **MongoDB**: A NoSQL database that stores data in flexible, JSON-like documents.
- **Docker**: A platform for developing, shipping, and running applications in containers, ensuring consistency across different environments.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.