# ZINNIA 2026 — Cryptographic QR & Verification System

## Unified Single QR Workflow

```
Participant QR Code
        ↓
Payload: {"v":1,"agent_id":"ZIN26-A8F41C","token":"tok_...","ts":1771660000}
        ↓
Phone Camera / Scanner Station
        ↓
Parser validates signature and resolves Agent ID
        ↓
Station Action Triggered (Entry / Lunch / Mission)
```

## Manual ID Fallback
If the QR code cannot be read due to cracked phone screens, low lighting, or dead batteries, operators can input the 6-character Agent ID (e.g. `ZIN26-A8F41C`) or student email directly into the Manual Lookup box.
