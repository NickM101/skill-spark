# Skill-Spark Backend (NestJS)

A comprehensive Learning Management System backend built with NestJS, PostgreSQL, and Prisma ORM.

## Table of Contents

- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
  - [Response Structures](#response-structures)
  - [Authentication & User Management](#authentication--user-management)
  - [Course Management](#course-management)
  - [Category Management](#category-management)
  - [Lesson Management](#lesson-management)
  - [Enrollment & Progress Management](#enrollment--progress-management)
  - [Quiz Management](#quiz-management)
  - [Question Management](#question-management)
  - [Quiz Attempt & Answer Management](#quiz-attempt--answer-management)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Technologies Used

- **Framework**: NestJS (latest stable version)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator and class-transformer

## Prerequisites

Before setting up the backend, ensure you have:

- **Node.js**: v18.x or higher (LTS recommended)
- **npm**: v9.x or higher (comes with Node.js)
- **NestJS CLI**: Install globally using `npm install -g @nestjs/cli`
- **PostgreSQL**: Database server running locally or accessible remotely

## Getting Started

### Environment Variables

1. Navigate to the backend directory:
   ```bash
   cd skill-spark/backend
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/skill_spark_db?schema=public"
   JWT_SECRET="your_strong_jwt_secret_key_here"
   JWT_EXPIRATION_TIME="1h"
   SALT_ROUNDS=10
   FRONTEND_URL="http://localhost:4200"
   ```


### Database Setup

Ensure your PostgreSQL database server is running and accessible.

### Installation

Install all necessary dependencies:

```bash
npm install
```

### Running the Application

1. **Generate and apply database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Start the development server**:
   ```bash
   npm run start:dev
   ```

The backend server will start at `http://localhost:3000`.

## API Documentation

### Response Structures

#### Success Response
```json
{
  "message": "Descriptive success message.",
  "data": { /* resource(s) or relevant data */ },
  "meta": { "total": 100, "page": 1, "limit": 10 } // for paginated lists
}
```

#### Error Response
```json
{
  "message": "Descriptive error message.",
  "error": {
    "code": "ERROR_CODE_CONSTANT",
    "details": [ /* optional validation details */ ]
  }
}
```

### Authentication & User Management

#### Register User
- **POST** `/api/v1/auth/register`
- **Purpose**: Create a new user account
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "STUDENT" | "INSTRUCTOR" | "ADMIN"
  }
  ```

#### Login
- **POST** `/api/v1/auth/login`
- **Purpose**: Authenticate user and issue JWT
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

#### Logout
- **POST** `/api/v1/auth/logout`
- **Purpose**: Invalidate user session/token

#### Forgot Password
- **POST** `/api/v1/auth/forgot-password`
- **Purpose**: Initiate password reset
- **Request Body**:
  ```json
  {
    "email": "string"
  }
  ```

#### Reset Password
- **POST** `/api/v1/auth/reset-password`
- **Purpose**: Complete password reset with token
- **Request Body**:
  ```json
  {
    "token": "string",
    "newPassword": "string"
  }
  ```

#### Verify Email
- **POST** `/api/v1/auth/verify-email`
- **Purpose**: Verify user's email address
- **Request Body**:
  ```json
  {
    "token": "string"
  }
  ```

#### Get Current User
- **GET** `/api/v1/users/me`
- **Purpose**: Get current authenticated user details
- **Authentication**: Required (JWT)

#### Update Current User
- **PATCH** `/api/v1/users/me`
- **Purpose**: Update current user details
- **Authentication**: Required (JWT)

#### Change Password
- **PATCH** `/api/v1/users/me/password`
- **Purpose**: Change password for logged-in user
- **Authentication**: Required (JWT)

#### List Users
- **GET** `/api/v1/users`
- **Purpose**: Get list of all users
- **Authentication**: Required (ADMIN or INSTRUCTOR)
- **Query Parameters**: `page`, `limit`, `role`, `isActive`, `search`

#### Get User by ID
- **GET** `/api/v1/users/:id`
- **Purpose**: Get specific user details
- **Authentication**: Required (ADMIN/INSTRUCTOR or self)

#### Update User
- **PATCH** `/api/v1/users/:id`
- **Purpose**: Update user details
- **Authentication**: Required (ADMIN)

#### Delete User
- **DELETE** `/api/v1/users/:id`
- **Purpose**: Delete a user
- **Authentication**: Required (ADMIN)

### Course Management

#### List Courses
- **GET** `/api/v1/courses`
- **Purpose**: Get list of courses
- **Authentication**: Optional
- **Query Parameters**: `page`, `limit`, `categoryId`, `level`, `instructorId`, `isPublished`, `search`

#### Create Course
- **POST** `/api/v1/courses`
- **Purpose**: Create a new course
- **Authentication**: Required (ADMIN or INSTRUCTOR)

#### Get Course
- **GET** `/api/v1/courses/:courseId`
- **Purpose**: Get course details
- **Authentication**: Optional for published courses

#### Update Course
- **PATCH** `/api/v1/courses/:courseId`
- **Purpose**: Update course details
- **Authentication**: Required (ADMIN or course owner)

#### Delete Course
- **DELETE** `/api/v1/courses/:courseId`
- **Purpose**: Delete a course
- **Authentication**: Required (ADMIN or course owner)

### Category Management

#### List Categories
- **GET** `/api/v1/categories`
- **Purpose**: Get all categories
- **Authentication**: Optional

#### Create Category
- **POST** `/api/v1/categories`
- **Purpose**: Create new category
- **Authentication**: Required (ADMIN)

#### Get Category
- **GET** `/api/v1/categories/:categoryId`
- **Purpose**: Get category details
- **Authentication**: Optional

#### Update Category
- **PATCH** `/api/v1/categories/:categoryId`
- **Purpose**: Update category
- **Authentication**: Required (ADMIN)

#### Delete Category
- **DELETE** `/api/v1/categories/:categoryId`
- **Purpose**: Delete category
- **Authentication**: Required (ADMIN)

### Lesson Management

#### List Course Lessons
- **GET** `/api/v1/courses/:courseId/lessons`
- **Purpose**: Get all lessons for a course
- **Authentication**: Optional
- **Query Parameters**: `isPublished`

#### Create Lesson
- **POST** `/api/v1/courses/:courseId/lessons`
- **Purpose**: Create new lesson
- **Authentication**: Required (ADMIN or course owner)

#### Get Lesson
- **GET** `/api/v1/courses/:courseId/lessons/:lessonId`
- **Purpose**: Get lesson details
- **Authentication**: Optional for published lessons

#### Update Lesson
- **PATCH** `/api/v1/courses/:courseId/lessons/:lessonId`
- **Purpose**: Update lesson
- **Authentication**: Required (ADMIN or course owner)

#### Delete Lesson
- **DELETE** `/api/v1/courses/:courseId/lessons/:lessonId`
- **Purpose**: Delete lesson
- **Authentication**: Required (ADMIN or course owner)

### Enrollment & Progress Management

#### List Enrollments
- **GET** `/api/v1/enrollments`
- **Purpose**: Get enrollment list
- **Authentication**: Required
- **Query Parameters**: `userId`, `courseId`, `status`, `page`, `limit`

#### Create Enrollment
- **POST** `/api/v1/enrollments`
- **Purpose**: Enroll user in course
- **Authentication**: Required

#### Get Enrollment
- **GET** `/api/v1/enrollments/:enrollmentId`
- **Purpose**: Get enrollment details
- **Authentication**: Required

#### Update Enrollment
- **PATCH** `/api/v1/enrollments/:enrollmentId`
- **Purpose**: Update enrollment status
- **Authentication**: Required

#### Delete Enrollment
- **DELETE** `/api/v1/enrollments/:enrollmentId`
- **Purpose**: Drop enrollment
- **Authentication**: Required

#### Get Progress
- **GET** `/api/v1/enrollments/:enrollmentId/progress`
- **Purpose**: Get progress records
- **Authentication**: Required

#### Update Lesson Progress
- **POST** `/api/v1/lessons/:lessonId/progress`
- **Purpose**: Mark lesson as completed
- **Authentication**: Required (STUDENT)

### Quiz Management

#### List Course Quizzes
- **GET** `/api/v1/courses/:courseId/quizzes`
- **Purpose**: Get all quizzes for a course
- **Authentication**: Optional
- **Query Parameters**: `isPublished`

#### Create Quiz
- **POST** `/api/v1/courses/:courseId/quizzes`
- **Purpose**: Create new quiz
- **Authentication**: Required (ADMIN or course owner)

#### Get Quiz
- **GET** `/api/v1/courses/:courseId/quizzes/:quizId`
- **Purpose**: Get quiz details
- **Authentication**: Optional for published quizzes

#### Update Quiz
- **PATCH** `/api/v1/courses/:courseId/quizzes/:quizId`
- **Purpose**: Update quiz
- **Authentication**: Required (ADMIN or course owner)

#### Delete Quiz
- **DELETE** `/api/v1/courses/:courseId/quizzes/:quizId`
- **Purpose**: Delete quiz
- **Authentication**: Required (ADMIN or course owner)

### Question Management

#### List Quiz Questions
- **GET** `/api/v1/quizzes/:quizId/questions`
- **Purpose**: Get all questions for a quiz
- **Authentication**: Required

#### Create Question
- **POST** `/api/v1/quizzes/:quizId/questions`
- **Purpose**: Create new question
- **Authentication**: Required (ADMIN or quiz owner)

#### Get Question
- **GET** `/api/v1/quizzes/:quizId/questions/:questionId`
- **Purpose**: Get question details
- **Authentication**: Required

#### Update Question
- **PATCH** `/api/v1/quizzes/:quizId/questions/:questionId`
- **Purpose**: Update question
- **Authentication**: Required (ADMIN or quiz owner)

#### Delete Question
- **DELETE** `/api/v1/quizzes/:quizId/questions/:questionId`
- **Purpose**: Delete question
- **Authentication**: Required (ADMIN or quiz owner)

### Quiz Attempt & Answer Management

#### List User Quiz Attempts
- **GET** `/api/v1/users/me/quiz-attempts`
- **Purpose**: Get current user's quiz attempts
- **Authentication**: Required (STUDENT)

#### List Quiz Attempts
- **GET** `/api/v1/quizzes/:quizId/attempts`
- **Purpose**: Get all attempts for a quiz
- **Authentication**: Required (ADMIN or quiz owner)

#### Start Quiz Attempt
- **POST** `/api/v1/quizzes/:quizId/attempts`
- **Purpose**: Start new quiz attempt
- **Authentication**: Required (STUDENT)

#### Get Quiz Attempt
- **GET** `/api/v1/quiz-attempts/:attemptId`
- **Purpose**: Get quiz attempt details
- **Authentication**: Required

#### Submit Answers
- **POST** `/api/v1/quiz-attempts/:attemptId/answers`
- **Purpose**: Submit answers for questions
- **Authentication**: Required (STUDENT, attempt owner)

#### Submit Quiz
- **POST** `/api/v1/quiz-attempts/:attemptId/submit`
- **Purpose**: Submit quiz and trigger grading
- **Authentication**: Required (STUDENT, attempt owner)


## Project Structure

```
backend/
├── src/                  # Source code
│   ├── auth/             # Authentication module
│   ├── users/            # User management module
│   ├── courses/          # Course management module
│   ├── categories/       # Category management module
│   ├── lessons/          # Lesson management module
│   ├── enrollments/      # Enrollment module
│   ├── quizzes/          # Quiz management module
│   ├── questions/        # Question management module
│   ├── quiz-attempts/    # Quiz attempt and answers
│   ├── app.module.ts
│   └── main.ts
├── prisma/               # Prisma schema and migrations
├── test/                 # E2E tests
├── .env.example
├── package.json
└── tsconfig.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.