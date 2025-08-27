# Express Node.js Application

A simple Node.js Express application with basic API endpoints.

## Features

- Express.js web server
- RESTful API endpoints
- JSON middleware
- Static file serving
- Error handling
- Development with nodemon

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

- **GET /** - Welcome page with application information
- **GET /api/hello** - Simple API endpoint returning JSON
- **POST /api/echo** - Echo back the JSON data sent in the request body

## Project Structure

```
├── app.js          # Main application file
├── package.json    # Project dependencies and scripts
├── public/         # Static files (CSS, images, etc.)
├── README.md       # Project documentation
└── .gitignore      # Git ignore file
```

## Example API Usage

### Get Hello Message
```bash
curl http://localhost:3000/api/hello
```

### Echo Data
```bash
curl -X POST http://localhost:3000/api/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World"}'
```



# Redirect URL 
