# Own Progress Dashboard

## Project Overview

Own Progress Dashboard is a full-stack web application that helps users track their learning journey, skills, daily tasks, goals, progress, streaks, and achievements through a modern analytics dashboard.

---

## Problem Statement

Most learners use notebooks, spreadsheets, or multiple apps to track their progress. There is no single platform that provides skill tracking, task management, learning analytics, streak tracking, and achievement monitoring in one place.

Own Progress Dashboard solves this problem by providing a centralized learning analytics platform.

---

## Target Users

- Students
- Developers
- Self-learners
- Professionals
- Anyone tracking personal growth

---

## MVP Features (Version 1)

### Authentication

- User Registration
- User Login
- JWT Authentication
- User Profile

### Skill Management

- Add Skill
- Edit Skill
- Delete Skill
- Assign Color to Skill
- Skill Progress Tracking

### Task Management

- Add Task
- Edit Task
- Delete Task
- Mark Task as Complete
- View Task History

### Dashboard

- Total Skills
- Total Tasks
- Completed Tasks
- Pending Tasks
- Current Streak
- Progress Summary

### Analytics

- Skill-wise Progress Chart
- Weekly Progress Chart
- Monthly Progress Chart

---

## Future Features (Version 2)

- Achievement System
- Learning Heatmap
- Leaderboards
- Public User Profiles
- Study Groups
- Friends System
- Goal Tracking
- Study Time Tracking

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Shadcn UI
- Recharts

### Backend

- Django
- Django REST Framework
- JWT Authentication

### Database

- PostgreSQL

### Deployment

- Frontend: Vercel
- Backend: Render/Railway
- Database: PostgreSQL

---

## Core Models

### User

- id
- username
- email
- password

### Skill

- id
- user
- name
- color
- icon
- created_at

### Task

- id
- user
- skill
- title
- description
- status
- created_at

### TaskCompletion

- id
- task
- completed_at

---

## Main Pages

### Desktop

- Dashboard
- Skills
- Tasks
- Analytics
- Profile
- Settings

### Mobile

- Dashboard
- Skills
- Tasks
- Analytics
- Profile

---

## Project Goal

Build a modern SaaS-style learning analytics platform where users can manage skills, track tasks, visualize progress, maintain streaks, and monitor personal growth through an interactive dashboard.