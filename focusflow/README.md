# FocusFlow — Adaptive Focus System

**Seu tempo aprende com você.** Sistema de foco adaptativo multi-dispositivo que ajusta sugestões baseado no comportamento real.

## Arquitetura
```
FocusFlow (ZeppOS Watch) ↔ Backend (Vercel) ↔ Dashboard (Next.js)
      ↓                           ↓                 ↓
 Sessions local    → API POST     Supabase DB    Charts & Metrics
 (hmFS)            → JSON          PostgreSQL     Recharts
```

## Features
- **Adaptive Focus**: Duração sugerida baseada em taxa de sucesso e streak
- **Persistent Storage**: 100 sessões em hmFS (watch) + cloud sync
- **Cross-device**: Watch → Backend → Web dashboard
- **Analytics**: Success rate, avg duration, best streak
- **Haptic Feedback**: Vibração no timer end

## Deploy
1. **Watch**: `cd watch-app; zpm dev`
2. **Backend**: `cd backend; vercel --prod`
3. **Dashboard**: `cd dashboard; vercel --prod`

## Tech Stack
- ZeppOS (JS + hmUI/PowerUI)
- Node.js serverless (Vercel)
- Next.js + Recharts
- Supabase (future)

## Resultado
Sistema vivo de produtividade que evolui com uso.
