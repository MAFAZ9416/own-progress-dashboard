# Progressly Dashboard Future Roadmap

This document outlines the strategic future development milestones for the Progressly Admin Dashboard.

## Phase 1: Real-time Updates (Q3 2026)
- **Centralized WebSockets / SSE**: Replace interval-based polling inside `AdminRefreshProvider` with persistent WebSockets or Server-Sent Events for instant notification alerts and system status ticks.
- **Live Activity Tracking**: Live streams of active user actions and background task completion updates.

## Phase 2: AI-Powered Analytics & Insights (Q4 2026)
- **Automatic Anomaly Detection**: Identify suspicious login activities, device swaps, or bulk report downloads using predictive modeling.
- **Intelligent Recommendations**: Suggest task re-assignments or highlight under-performing skills dynamically using ML pipelines.

## Phase 3: Infrastructure Scaling (Q1 2027)
- **Multi-region Databases**: Replicate databases across geographical clusters for high availability and minimal query latency.
- **Log Streaming Integration**: Forward administrative audit logs and login histories directly to external SIEM providers (e.g., Datadog, Splunk).
