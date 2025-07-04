# Skill-Spark

*"Your Straightforward Path to Understanding and Mastery."*

Skill-Spark is a dynamic Learning Management System designed to simplify and enrich the educational journey.
For instructors, it offers intuitive tools to create, manage, and deliver engaging courses, complete with structured lessons and insightful quizzes.
For students, Skill-Spark provides a clear, interactive platform to discover new knowledge, track progress, and achieve learning goals through accessible content and performance monitoring.

This project is built as a robust and scalable solution, utilizing **Angular** for a responsive and modern frontend and **NestJS** for a powerful and efficient backend.

---

## Features

### Core Features (MVP)

* **User Authentication & Authorization**
  Secure login, registration, and role-based access control (Student, Instructor, Admin).

* **User Profile Management**
  View and update personal details.

* **Course Management**

  * Create, view, update, and delete courses.
  * Publish/unpublish courses.
  * Associate courses with instructors and categories.

* **Category Management**
  Create, view, update, and delete course categories.

* **Lesson Management**

  * Add, view, update, and delete lessons within a course.
  * Support for different lesson types (text, video, PDF).
  * Order lessons within a course.

* **Enrollment System**
  Students can enroll in courses.

* **Progress Tracking**
  Students can mark lessons as complete, and overall course progress is tracked.

* **Quiz System**

  * Create quizzes with multiple-choice and true/false questions.
  * Set passing scores and time limits.
  * Students can attempt quizzes.
  * Automatic grading of quiz attempts.


## Technologies Used

Skill-Spark leverages a modern tech stack:

* **Frontend**: Angular – A powerful SPA framework for dynamic and responsive UI.
* **Backend**: NestJS – A progressive Node.js framework for scalable APIs.
* **Database**: PostgreSQL, managed using **Prisma ORM**.
* **Authentication**: JWT (JSON Web Tokens) for secure user sessions.

---


## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/NickM101/Skill-Spark.git
cd Skill-Spark
```

### 2. Backend Setup

> See [backend/README.md](backend/README.md) for setup and running instructions.

### 3. Frontend Setup

Navigate into the frontend directory:

```bash
cd Skill-Spark/frontend
```

Install dependencies:

```bash
npm install
```

Configure API endpoint:
Edit `src/environments/environment.development.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
};
```

Update `environment.ts` as well for production builds if necessary.

Start the frontend:

```bash
ng serve -o
```

This will:

* Compile the Angular application.
* Start a development server at `http://localhost:4200`
* Open the app automatically in your default browser.
* Auto-reload on file changes.

---

## Project Structure

```
Skill-Spark/
├── backend/                  # NestJS API (See backend/README.md)
│   ├── src/
│   ├── prisma/
│   ├── test/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Angular UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/
│   │   │   ├── courses/
│   │   │   ├── shared/
│   │   │   ├── core/
│   │   │   ├── app-routing.module.ts
│   │   │   ├── app.component.ts
│   │   │   └── app.module.ts
│   ├── assets/
│   ├── environments/
│   ├── styles.scss
│   └── main.ts
├── angular.json
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
```

---
