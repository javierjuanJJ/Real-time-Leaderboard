# 005-top-players-report Tasks

## 1. Database Indexes
- [ ] 1.1 Add indexes to Score model in Prisma schema
- [ ] 1.2 Run migration

## 2. Validation Schema
- [ ] 2.1 Create `backend/src/schemas/report.schema.ts` with reportQuerySchema

## 3. Report Service
- [ ] 3.1 Create `backend/src/services/report.service.ts`
- [ ] 3.2 Implement `getTopPlayersHistorical(gameId, period, limit)`
- [ ] 3.3 Implement `getTopPlayersRealtime(gameId, limit)`
- [ ] 3.4 Implement CSV formatting

## 4. Controller & Routes
- [ ] 4.1 Create `backend/src/controllers/report.controller.ts`
- [ ] 4.2 Implement `getTopPlayersReport`
- [ ] 4.3 Create `backend/src/routes/report.routes.ts`
- [ ] 4.4 Register GET /api/reports/top-players

## 5. Tests
- [ ] 5.1 Create `backend/tests/report.test.js`
- [ ] 5.2 Test daily report
- [ ] 5.3 Test weekly report
- [ ] 5.4 Test monthly report
- [ ] 5.5 Test all-time report
- [ ] 5.6 Test realtime report
- [ ] 5.7 Test CSV format
- [ ] 5.8 Test invalid gameId
- [ ] 5.9 Test invalid period
- [ ] 5.10 Test limit bounds
- [ ] 5.11 Mock Redis and Prisma

## 6. Documentation
- [ ] 6.1 Create `docs/005-top-players-report.md` with:
  - Implementation summary
  - Key decisions (PostgreSQL aggregation, CSV streaming)
  - Rollback instructions
  - Opencode usage notes

## 7. Git Commit
- [ ] 7.1 `git add -A`
- [ ] 7.2 `git commit -m "feat(report): implement top players report with historical and real-time modes"`