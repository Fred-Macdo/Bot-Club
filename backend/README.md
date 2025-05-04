# FARM Stack Project - Backend

This README provides instructions for setting up and running the backend of the FARM stack project.

## Prerequisites

- Python 3.7 or higher
- MongoDB
- Docker (optional, for containerization)

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd farm-stack-project/backend
   ```

2. **Create a virtual environment (optional but recommended):**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**

   Install the required Python packages using pip:

   ```bash
   pip install -r src/requirements.txt
   ```

4. **Set up MongoDB:**

   Ensure that you have a MongoDB instance running. You can use a local instance or a cloud-based service. Update the `MONGO_URL` environment variable if necessary.

5. **Run the application:**

   You can run the FastAPI application using the following command:

   ```bash
   uvicorn src.main:app --reload
   ```

   The application will be accessible at `http://localhost:8000`.

## Docker Support

To build and run the backend using Docker, follow these steps:

1. **Build the Docker image:**

   ```bash
   docker build -t farm-stack-backend .
   ```

2. **Run the Docker container:**

   ```bash
   docker run -d -p 8000:8000 --env MONGO_URL=<your_mongo_url> farm-stack-backend
   ```

## API Endpoints

- `GET /`: Returns a welcome message.
- `GET /api/data`: Fetches data from the MongoDB database.

## License

This project is licensed under the MIT License. See the LICENSE file for details.