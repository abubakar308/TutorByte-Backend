# TutorByte Backend

<p align="center">
  <a href="https://tutor-byte-backend.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20API-tutor--byte--backend.vercel.app-blueviolet?style=for-the-badge&logo=vercel" alt="Live API" />
  </a>
</p>

## 📖 Overview

**TutorByte Backend** is the core REST API that powers the TutorByte platform. It is built using modern web technologies focused on performance, security, and scalability. It provides functionality for robust user authentication, tutor booking management, availability scheduling, payment processing, and administrative controls.

## 🚀 Tech Stack & Libraries

- **Language:** TypeScript
- **Framework:** Express.js (Node.js)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Better Auth (with JWT & bcrypt enhancements)
- **Payment Processing:** Stripe & SslCommerz
- **File Uploads & Media Storage:** Multer + Cloudinary
- **Scheduling/Cron Jobs:** `node-cron`
- **Validation:** Zod

## 🛠️ Key Features

- **Role-Based Access Control:** Secure routes structured around Students, Tutors, and Admins.
- **Tutor Profiles & Search:** Browse, filter, and fetch detailed tutor profiles, subjects, and language metadata.
- **Booking & Availability System:** Real-time scheduling with checking against tutor's set availability. 
- **Multi-Gateway Payment Integration:** Seamless processing using both Stripe and SslCommerz.
- **Cloud Media Storage:** Direct image/file uploads straight to Cloudinary using secure middleware. 

## 📦 Project Setup

Follow these steps to set up the backend locally:

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Stripe Account (for payments)
- Cloudinary Account (for media)

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone https://github.com/abubakar308/TutorByte-Backend
   cd TutorByte-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the necessary configuration parameters. (Ensure `DATABASE_URL`, `STRIPE_SECRET_KEY`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, and other relevant keys are set).

4. **Initialize Prisma (Database push & Client generation):**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📡 API Response & Status Guide

TutorByte Backend adheres to a standardized JSON response structure for successful API requests. 

**Standard Success Response:**
```json
{
    "httpStatusCode": 200,    // or 201 for Created
    "success": true,
    "message": "Dynamic success message describing the action",
    "data": {
        // Requested data or newly created resource payload
    }
}
```

### Common HTTP Status Codes Used:

| Status Code | Type | Description |
| :--- | :--- | :--- |
| **200 OK** | Success | Request succeeded and data is returned. |
| **201 Created** | Success | A new resource (e.g., User, Booking) has been created successfully. |
| **400 Bad Request** | Error | Missing required fields, validation error (Zod), or bad syntax. |
| **401 Unauthorized** | Error | Missing, invalid, or expired authentication token. |
| **403 Forbidden** | Error | User lacks sufficient role permissions to access the resource. |
| **404 Not Found** | Error | The requested resource (User, Tutor, Subject, etc.) does not exist. |
| **500 Internal Server Error** | Error | Unhandled backend exception or database connectivity issue. |

*(Note: Validation errors may surface an array of `errorMessages` to distinctly clarify each missing or improperly formatted field).*

## 🔌 Core Modules & Routing

The baseline API endpoint is `/api/v1`. 

- `POST /api/auth/*` - Complete auth handling powered by Better Auth.
- `GET/POST /api/v1/tutors` - Tutor discovery and management.
- `GET/POST /api/v1/users` - Student/User operations.
- `GET/POST /api/v1/bookings` - Scheduling logic and endpoints.
- `GET/POST /api/v1/availability` - Tutor's timeslot availability routing.
- `GET/POST /api/v1/payments` - Processing, Webhooks for Stripe and SslCommerz integration.
- `GET/POST /api/v1/admin` - Privileged administrative operations.
- `GET/POST /api/v1/subject` - Subject categorization.
- `GET/POST /api/v1/language` - Language metadata parsing.

## 👨‍💻 Scripts Definition

- `npm run dev`: Runs the backend in watch mode using `tsx`.
- `npm run build`: Generates Prisma typing and builds the TypeScript application using `tsup` targeting Node 20.
- `npm start`: Runs the built application from the `dist/server.js` folder.
- `npm run postinstall`: Generates the Prisma schema automatically upon package installation.
