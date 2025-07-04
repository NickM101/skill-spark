# Skill-Spark

*"Your Straightforward Path to Understanding and Mastery."*

Skill-Spark is a dynamic Learning Management System designed to simplify and enrich the educational journey.
For instructors, it offers intuitive tools to create, manage, and deliver engaging courses, complete with structured lessons and insightful quizzes.
For students, Skill-Spark provides a clear, interactive platform to discover new knowledge, track progress, and achieve learning goals through accessible content and performance monitoring.

This project is built as a robust and scalable solution, utilizing **Angular** for a responsive and modern frontend and **NestJS** for a powerful and efficient backend.

---

## Table of Contents

* [Features](#features)
* [Technologies Used](#technologies-used)
* [Prerequisites](#prerequisites)
* [Getting Started](#getting-started)
* [Running Tests](#running-tests)
* [Deployment](#deployment)
* [Project Structure](#project-structure)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

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

---

## Technologies Used

Skill-Spark leverages a modern tech stack:

* **Frontend**: Angular – A powerful SPA framework for dynamic and responsive UI.
* **Backend**: NestJS – A progressive Node.js framework for scalable APIs.
* **Database**: PostgreSQL, managed using **Prisma ORM**.
* **Authentication**: JWT (JSON Web Tokens) for secure user sessions.

---

## Prerequisites

Before you begin, ensure the following are installed:

* **Node.js**: v18.x or higher (LTS recommended)
* **npm**: v9.x or higher (comes with Node.js)
* **Git**: For cloning the repository

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-github-username>/skill-spark.git
cd skill-spark
```

### 2. Backend Setup

> See [backend/README.md](backend/README.md) for setup and running instructions.

### 3. Frontend Setup

> See [frontend/README.md](frontend/README.md) for setup and running instructions.

---

## Running Tests

Tests are organized by frontend and backend components:

* [Backend Tests](backend/README.md)
* [Frontend Tests](frontend/README.md)

---

## Deployment

Skill-Spark supports Dockerized deployment.

* Frontend available at: `http://localhost:80`
* Backend available at: `http://localhost:3000`

### Database Migrations (For Production)

After first deployment:

```bash
npx prisma migrate deploy
```

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
├── frontend/                 # Angular UI (See frontend/README.md)
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── docker-compose.yml
├── README.md                 # This file
└── C4-Model.md               # (Optional: Architectural C4 model diagrams)
```

---

## Contributing

We welcome contributions to Skill-Spark! If you have suggestions, bug reports, or want to contribute code, please follow these steps:

1. Fork the repository.
2. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Commit your changes:

```bash
git commit -m '[feat]: Add new feature'
```

5. Push to the branch:

```bash
git push origin feature/your-feature-name
```

6. Open a Pull Request.

> Please ensure your code adheres to the existing style and conventions.

---

## License

This project is licensed under the **MIT License** – see the [LICENSE.md](LICENSE.md) file for details.

---

## Contact

For any questions or inquiries, please reach out to:

**\[Nick Munene]** – \[[nickmunene101@gmail.com](mailto:nickmunene101@gmail.com)]
GitHub: [https://github.com/NickM101](https://github.com/<your-github-username>)


**\[Melissa Waititu]** – \[[your.email@example.com](mailto:your.email@example.com)]
GitHub: [https://github.com/<your-github-username>](https://github.com/<your-github-username>)

**\[Mark Ndwiga]** – \[[your.email@example.com](mailto:your.email@example.com)]
GitHub: [https://github.com/<your-github-username>](https://github.com/<your-github-username>)