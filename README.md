# College Timetable Management System (CLGTT)

**A full-stack web application for efficient college timetable management with conflict detection and dynamic scheduling.**

---

## 📖 Overview

**CLGTT** is a comprehensive system designed to streamline college scheduling operations. It enables administrators to create, manage, and optimize timetables while automatically detecting and preventing scheduling conflicts for teachers, classrooms, and time slots.

## ✨ Key Features

* **Dynamic Timetable Creation:** Build flexible timetables with configurable time slots and break times.
* **Conflict Detection Engine:** Automatic detection of overlaps for teachers, classrooms, and time slots.
* **Real-time Slot Management:** System intelligently displays only truly available timeslots.
* **User-Friendly Interface:** Intuitive dashboard for easy management.
* **Visual Feedback:** Clear highlighting of detected scheduling conflicts.
* **Responsive Design:** Fully optimized for both desktop and mobile devices.
* **Secure Auth:** Robust user authentication and authorization system.

## 🛠 Tech Stack

### Frontend
* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS
* **Language:** JavaScript/TypeScript

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (NoSQL)
* **Architecture:** RESTful API

### DevOps & Tools
* **Version Control:** Git/GitHub
* **Deployment:** Vercel
* **Testing:** Postman

---

## 📂 Project Structure

```text
clgtt/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/              # Next.js pages & routing
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── styles/             # Tailwind CSS configurations
│   └── services/           # API service calls
├── server/                 # Backend server logic
│   ├── models/             # MongoDB schemas
│   ├── routes/             # Express API routes
│   ├── controllers/        # Route logic & handlers
│   └── middleware/         # Custom middleware
├── .env.local              # Environment variables
├── package.json            # Project dependencies
└── README.md               # Documentation