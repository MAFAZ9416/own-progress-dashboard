# Database Design & Operations Guide

This document details the PostgreSQL and Neon specifications utilized by Progressly in production, as well as SQLite fallbacks for development testing.

---

## 🗄️ Database Schemas & Relations

Progressly uses standard relational fields mapping user metrics:
- **UserProfile**: Stores bio data, avatar links, and full names. Linked `OneToOne` with the main auth User table.
- **Skill**: Stores quota metrics and color codes. Linked via `ForeignKey` to the user profile.
- **Task**: Main tasks table linked to skills.
- **ActivityLog**: Logs actor, actions, IP addresses, and user agents for security audits.

---

## 🏎️ Database Monitor Queries

To read Neon sizes and connections dynamically without loading full tables, we execute metadata queries:
- **Estimated Row Counts**: Sourced via `pg_stat_user_tables` queries on PostgreSQL.
- **Database Size**: Queried using `pg_database_size()` Postgres wrappers.
