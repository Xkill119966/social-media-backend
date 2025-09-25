# Social Media API

A RESTful API for a social media platform built with Node.js, Express, TypeScript, and MySQL using Object-Oriented Programming principles.

## Features

- User authentication (register, login, logout)
- User profiles with statistics
- Post management (create, edit, view)
- Comments on posts
- Reactions (like/unlike) system
- Pagination support
- Input validation and security
- Full TypeScript support with strict typing
- Comprehensive rate limiting and abuse prevention

- Clean Service Layer architecture with separation of concerns

## Tech Stack

- **Backend**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Password Hashing**: bcryptjs
- **Rate Limiting**: express-rate-limit, express-slow-down
- **Security**: Parameterized queries, input validation
- **Architecture**: Service Layer pattern with OOP principles

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### 1. Clone the repository

```bash
git clone <repository-url>
cd social-media-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the project

```bash
npm run build
```

### 4. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` file with your database credentials:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=social_media_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
UPLOAD_PATH=uploads/

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Database Setup

Run the migration to create the database and tables:

```bash
npm run migrate
```

Run the seed to create demo data:

```bash
npm run seed
```

### 6. Start the server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User

```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2023-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User

```http
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Logout User

```http
POST /api/logout
Authorization: Bearer {token}
```

#### Get User Profile

```http
GET /api/profile
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2023-01-01T00:00:00.000Z",
    "post_count": 5,
    "reaction_count": 12,
    "comment_count": 8
  }
}
```

### Post Endpoints

#### Create Post

```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
  title: "My First Post"
  content: "This is the content of my first post"
  image: (file upload)
```

#### Edit Post

```http
PUT /api/posts/{postId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
  title: "Updated Post Title"
  content: "Updated content"
  image: (file upload)
```

#### Get All Posts (Newsfeed)

```http
GET /api/posts?page=1&limit=10
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Post Title",
        "content": "Post content",
        "image": "image-url.jpg",
        "created_at": "2023-01-01T00:00:00.000Z",
        "author_id": 1,
        "author_name": "John Doe",
        "reaction_count": 5,
        "comment_count": 3,
        "user_has_liked": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "hasMore": true
    }
  }
}
```

#### Get My Posts

```http
GET /api/posts/my-posts?page=1&limit=10
Authorization: Bearer {token}
```

**Response:**

````json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Post Title",
        "content": "Post content",
        "image": "image-url.jpg",
        "created_at": "2023-01-01T00:00:00.000Z",
        "author_id": 1,
        "author_name": "John Doe",
        "reaction_count": 5,
        "comment_count": 3,
        "user_has_liked": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "hasMore": true
    }
  }
}

#### Add Comment to Post

```http
POST /api/posts/{postId}/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "This is a comment on the post"
}
````

#### Toggle Reaction (Like/Unlike)

```http
POST /api/posts/{postId}/reaction
Authorization: Bearer {token}
Content-Type: application/json


```

**Response:**

```json
{
  "success": true,
  "message": "Reaction added",
  "data": {
    "action": "added",
    "reaction_count": 6
  }
}
```

## Security Features

- Password hashing using bcryptjs
- JWT token-based authentication
- Input validation using Zod with TypeScript support
- SQL injection prevention with parameterized queries
- Authorization checks for protected endpoints
- CORS enabled for cross-origin requests
- Strict TypeScript typing for enhanced type safety
- Progressive slow-down for high-frequency requests
- Rate limit monitoring and logging
