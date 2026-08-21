# ZINNIA 2026 — Database Schema & Data Models

## PostgreSQL Tables & Foreign Keys

### 1. `participants`
- `id` (UUID, Primary Key)
- `agent_id` (VARCHAR(32), Unique, Indexed)
- `name` (VARCHAR(255))
- `email` (VARCHAR(255), Unique, Indexed)
- `phone` (VARCHAR(20))
- `college` (VARCHAR(255))
- `department` (VARCHAR(255))
- `year` (VARCHAR(10))
- `clearance_level` (VARCHAR(32))
- `status` (VARCHAR(32), Default 'ACTIVE')
- `qr_token` (VARCHAR(255), Unique)
- `registered_events` (TEXT[])
- `created_at` (TIMESTAMPTZ)

### 2. `events`
- `id` (VARCHAR(64), Primary Key)
- `code` (VARCHAR(16))
- `mission_name` (VARCHAR(255))
- `title` (VARCHAR(255))
- `category` (VARCHAR(32))
- `clearance_level` (VARCHAR(32))
- `schedule_time` (VARCHAR(64))
- `venue` (VARCHAR(255))
- `status` (VARCHAR(32))

### 3. `attendance`
- `id` (UUID, Primary Key)
- `participant_id` (UUID &rarr; `participants.id`)
- `agent_id` (VARCHAR(32))
- `checkin_type` ('ENTRY' | 'EVENT')
- `event_id` (VARCHAR(64) &rarr; `events.id`)
- `scanned_by` (VARCHAR(255))
- `scanned_at` (TIMESTAMPTZ)
- *Unique Constraint*: `(participant_id, checkin_type, event_id)`

### 4. `food_distribution`
- `id` (UUID, Primary Key)
- `participant_id` (UUID &rarr; `participants.id`)
- `meal_session` ('LUNCH' | 'SNACKS')
- `collected` (BOOLEAN)
- `collected_at` (TIMESTAMPTZ)
- *Unique Constraint*: `(participant_id, meal_session)`

### 5. `certificates`
- `id` (UUID, Primary Key)
- `certificate_number` (VARCHAR(64), Unique)
- `participant_id` (UUID &rarr; `participants.id`)
- `event_id` (VARCHAR(64))
- `type` (VARCHAR(64))
- `verified` (BOOLEAN)
