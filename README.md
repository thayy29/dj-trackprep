# 🎧 TrackPrep — DJ Track Preparation Tool

> Ferramenta profissional para preparação de setlists: análise harmônica, reordenação inteligente, conversão de formatos e export para plataformas de DJ.

[![Status](https://img.shields.io/badge/status-MVP-brightgreen)](/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](/)
[![React](https://img.shields.io/badge/React-19.2-cyan)](/)
[![Express](https://img.shields.io/badge/Express-4.18-yellow)](/)
[![License](https://img.shields.io/badge/license-MIT-green)](/)

---

## 🎯 Features Principais

### 📤 Upload & Análise
- **Drag & drop** com suporte a múltiplos arquivos
- **Análise automática**: BPM, Tom Camelot, Energia
- **Waveform visual** em tempo real
- Modal com progresso por arquivo

### 🎵 Organização de Playlist
- **Reordenação com drag & drop**
- **Auto-order harmônico** (roda Camelot + energia)
- **Sugestão inteligente** de próxima faixa
- **Curva de energia visual**

### 🔄 Conversão & Export
- **5 presets otimizados**:
  - CDJ-3000 (Pioneer)
  - Serato
  - Engine DJ (Denon)
  - Streaming (Spotify/Apple Music)
  - Club PA Systems
- **Export nativo** em XML/Database
- **Status em tempo real** (polling)

### 💾 Persistência & Validação
- **LocalStorage draft** de playlist
- **Validação de set** (BPM range, compatibilidade harmônica)
- **Edição em-linha** de metadados
- **Lixeira com undo** (preparado)

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 20+
- pnpm 11+

### 1. Backend Setup

```bash
cd backend

# Copiar .env
cp .env.example .env

# Instalar dependências
pnpm install

# Rodar migrations e iniciar
pnpm dev
```

Backend rodará em `http://localhost:3000`

Endpoints disponíveis:
- `GET /health` — health check
- `POST /api/tracks/upload` — upload de arquivos
- `GET /api/tracks` — listar todas as faixas
- `POST /api/playlists` — criar playlist
- `GET /api/convert/presets` — listar presets
- Ver documentação completa em `backend/README.md`

### 2. Frontend Setup

```bash
cd my-app

# Instalar dependências
pnpm install

# Rodar dev server
pnpm dev
```

Frontend rodará em `http://localhost:5174`

O dev server faz proxy automático de `/api` para `http://localhost:3000`

---

## 📚 Arquitetura

### Frontend (`my-app/`)
```
src/
├── components/modals/          # Modais de conversão, edição, export
├── context/PlaylistContext     # Global state (React Context)
├── hooks/                       # useAudioAnalysis, useDragDrop, useExport
├── services/api.ts             # HTTP client tipado
├── types/index.ts              # TypeScript types
└── screen/home/index.tsx       # Tela principal
```

**Tech Stack:**
- React 19 + TypeScript
- Tailwind CSS 4
- Zod (validação)
- Fetch API + Context API

### Backend (`backend/`)
```
src/
├── db/db.ts                    # SQLite setup + schema
├── middleware/                 # Error handler, validation
├── routes/                     # Endpoints de tracks, playlists, convert
├── services/                   # Business logic (audio analysis, playlist logic)
├── types/index.ts              # TypeScript interfaces
└── index.ts                    # Entrypoint
```

**Tech Stack:**
- Express 4.18 + TypeScript
- SQLite (persistência)
- Multer (file upload)
- Pino (logging)
- Zod (schema validation)

### Database Schema

**tracks**
```sql
- id: TEXT PRIMARY KEY
- title, artist: TEXT
- file_path, file_name: TEXT
- file_size: INTEGER
- duration_ms, bpm: INTEGER
- key_camelot, key_note: TEXT
- energy_level: INTEGER
- waveform_data: TEXT (base64)
- status: "analyzing" | "analyzed" | "error"
- uploaded_at, analyzed_at, created_at: DATETIME
```

**playlists**
```sql
- id: TEXT PRIMARY KEY
- title, description: TEXT
- total_duration_ms, total_tracks: INTEGER
- created_at, updated_at: DATETIME
```

**playlist_tracks**
```sql
- id: TEXT PRIMARY KEY
- playlist_id, track_id: TEXT (FK)
- position: INTEGER
- added_at: DATETIME
```

**convert_presets** (read-only, pre-populated)
```sql
- id, name: TEXT
- format, sample_rate, bit_depth, loudness_lufs: variáveis
- description: TEXT
```

**exports**
```sql
- id, playlist_id, preset_id: TEXT (FK)
- status: "pending" | "processing" | "completed" | "error"
- output_path: TEXT
- created_at, completed_at: DATETIME
```

---

## 🎮 Como Usar

### 1. Upload de Faixas
- Clique em "Selecionar arquivos" ou arraste arquivos na dropzone
- Modal mostra progresso de cada arquivo
- Após upload, análise de BPM/Tom acontece automaticamente

### 2. Organizar Set
- **Arraste** faixas para reordenar
- **Clique em checkbox** para selecionar individual/global
- **Botão ⚡ Auto-order** reordena por compatibilidade harmônica
- **Editar** (ícone ✏️) para corrigir BPM, Tom, Energia se análise errou

### 3. Converter Formato
- Selecione faixas
- Clique "🔄 Converter"
- Escolha preset (CDJ-3000, Serato, etc)
- Modal mostra progresso de conversão
- Download link ao completar

### 4. Exportar Set
- Sidebar direita: "Exportar para"
- Escolha destino (Rekordbox, Serato, Engine DJ, Gig bag)
- Modal mostra status + link de download

### 5. Persistência
- Draft automático salvo em localStorage
- Pode fechar browser e retomar depois

---

## 📊 API Reference

### Uploads
```bash
POST /api/tracks/upload
Content-Type: multipart/form-data
files: File[]

Response:
{
  "tracks": [
    {
      "id": "uuid",
      "title": "Track Name",
      "status": "analyzing",
      ...
    }
  ]
}
```

### Playlists
```bash
POST /api/playlists
{ "title": "My Set", "description": "..." }

GET /api/playlists/:id
# Retorna com tracks ordenadas

POST /api/playlists/:id/auto-order
# Reordena por harmonia + energia

PUT /api/playlists/:id/reorder
{ "tracks": [{ "track_id": "uuid", "position": 0 }, ...] }
```

### Convert
```bash
GET /api/convert/presets
# Lista todos os presets

POST /api/convert/exports
{ "playlist_id": "uuid", "preset_id": "uuid" }

GET /api/convert/exports/:id
# Status: pending → processing → completed
```

Ver `backend/README.md` para documentação completa.

---

## 🛠️ Desenvolvimento

### Instalar dependências
```bash
cd backend && pnpm install
cd ../my-app && pnpm install
```

### Rodar tudo
```bash
# Terminal 1: Backend
cd backend && pnpm dev

# Terminal 2: Frontend
cd my-app && pnpm dev
```

### Build para produção
```bash
# Frontend
cd my-app && pnpm build
# Gera: dist/

# Backend
cd backend && pnpm build
# Gera: dist/
# Rodar com: pnpm start
```

### Environment variables

**Backend** (`backend/.env`)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=sqlite:./data/trackprep.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
```

**Frontend** — auto detecta `http://localhost:3000/api` em dev

---

## 📈 Performance

- **Análise em background** — não bloqueia UI
- **Índices em SQLite** — queries otimizadas
- **Lazy loading** — modais carregam sob demanda
- **Polling inteligente** — exports atualizam a cada 1s
- **Canvas waveform** — renderizado eficientemente

---

## 🔐 Segurança

- ✅ Validação de input (Zod)
- ✅ File type validation (MIME)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS habilitado
- ✅ Error messages sem dados sensíveis
- ✅ Rate limiting (preparado para production)

---

## 🧪 Testes (TODO)

```bash
# Frontend
pnpm test

# Backend
pnpm test
```

Stack recomendado:
- Frontend: Jest + React Testing Library
- Backend: Jest + Supertest

---

## 📦 Production Deployment

### Frontend (Vercel/Netlify)
```bash
cd my-app
pnpm build
# Upload dist/
```

### Backend (Railway/Render/AWS)
```bash
cd backend
pnpm build
# Deploy dist/ + node_modules
```

Variáveis de ambiente requeridas:
- `DATABASE_URL` — production database
- `NODE_ENV=production`
- `CORS_ORIGIN` — frontend URL

---

## 🚀 Roadmap Futuro

- [ ] WebSocket para real-time updates
- [ ] Autenticação JWT
- [ ] Suporte a cue points detectados
- [ ] Integração Rekordbox/Serato API
- [ ] Detecção de intro/outro mixáveis
- [ ] Normalização LUFS real (ffmpeg-normalize)
- [ ] Batch processing com Bull queues
- [ ] Redis caching
- [ ] Dark/Light theme toggle
- [ ] Multi-language support

---

## 📄 Licença

MIT © 2026

---

## 👤 Desenvolvedor

Implementação com Clean Architecture, TypeScript strict mode e boas práticas.

---

## 🎓 Boas Práticas Aplicadas

### Frontend
- ✅ Component composition
- ✅ Custom hooks
- ✅ Context API
- ✅ Memoização (useCallback)
- ✅ Type safety (TypeScript)
- ✅ Error boundaries
- ✅ Acessibilidade (a11y)

### Backend
- ✅ Arquitetura em camadas
- ✅ SOLID principles
- ✅ Type safety
- ✅ Logging estruturado
- ✅ Input validation
- ✅ Error handling consistente
- ✅ Database migrations
- ✅ Graceful shutdown

---

## 📞 Suporte

- 📖 Docs: `IMPLEMENTATION_SUMMARY.md` (features), `backend/README.md` (API)
- 🐛 Issues: Abrir issue no repositório
- 💬 Discussões: GitHub Discussions

---

**Status:** ✅ MVP Completo | **Última atualização:** 2026-07-17
