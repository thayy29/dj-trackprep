# TrackPrep Backend

Backend API para TrackPrep — ferramenta profissional de preparação de tracks para DJs.

## Arquitetura

- **Express.js** — servidor HTTP
- **PostgreSQL + Knex** — persistência de dados
- **TypeScript** — type safety
- **Zod** — validação de schemas
- **Pino** — logging estruturado

## Estrutura de pastas

```
src/
├── db/              # Conexão, migrations e migration source do Knex
├── repositories/     # Acesso a dados (uma classe por recurso)
├── middleware/      # Express middlewares (auth, validation, error handling)
├── routes/          # Rotas da API
├── services/        # Lógica de negócio
├── types/           # TypeScript types & interfaces
├── env.ts           # Variáveis de ambiente
├── logger.ts        # Logger configurado
└── index.ts         # Entrypoint da aplicação
```

## Setup

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ rodando localmente (ou acessível via rede)

### Instalação

```bash
npm install
```

### Banco de dados

Crie o banco e um usuário (ou reutilize um existente com permissão de `CREATEDB`):

```bash
# Usando o usuário padrão do seu SO (mais simples em dev):
createdb trackprep

# Ou criando um usuário/role dedicado:
psql -d postgres -c "CREATE ROLE trackprep WITH LOGIN PASSWORD 'trackprep' CREATEDB;"
createdb -O trackprep trackprep
```

### Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Ajuste `DB_USER`/`DB_PASSWORD` para bater com o que você criou acima:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

DB_HOST=localhost
DB_PORT=5432
DB_NAME=trackprep
DB_USER=seu_usuario   # ex: whoami, ou "trackprep" se criou o role acima
DB_PASSWORD=

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
ENABLE_AUDIO_ANALYSIS=true
ANALYSIS_WORKERS=2
```

> ⚠️ Se `DB_USER`/`DB_NAME` não existirem ou a senha estiver errada, o
> processo falha ao iniciar (a conexão é testada antes de subir o
> servidor) e nenhuma rota fica disponível — o log mostrará o erro real
> do Postgres (ex: `role "postgres" does not exist`).

### Desenvolvimento

```bash
npm run dev
```

Migrations rodam automaticamente na inicialização. Server rodará em `http://localhost:3000`.

Verifique rapidamente que subiu:

```bash
curl http://localhost:3000/health
```

### Build para produção

```bash
npm run build
npm start
```

Em produção, defina `DATABASE_URL` (connection string completa) em vez de `DB_HOST`/`DB_USER`/etc.

## API Endpoints

### Tracks

#### POST `/api/tracks/upload`
Upload de múltiplos arquivos de áudio.

**Request:**
- `Content-Type: multipart/form-data`
- `files: File[]` (max 50 arquivos)

**Response:**
```json
{
  "tracks": [
    {
      "id": "uuid",
      "title": "Midnight Drive",
      "file_name": "midnight-drive.mp3",
      "file_size": 5000000,
      "status": "analyzing",
      "uploaded_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET `/api/tracks`
Lista todas as tracks.

**Response:**
```json
{
  "tracks": [...]
}
```

#### GET `/api/tracks/:id`
Detalhes de uma track (inclui análise).

**Response:**
```json
{
  "track": {
    "id": "uuid",
    "title": "Midnight Drive",
    "bpm": 128,
    "key_camelot": "8A",
    "key_note": "Am",
    "energy_level": 7,
    "duration_ms": 240000,
    "waveform_data": "base64...",
    "status": "analyzed",
    "analyzed_at": "2024-01-01T00:01:00Z"
  }
}
```

#### PUT `/api/tracks/:id`
Editar metadados de uma track.

**Request:**
```json
{
  "title": "novo título",
  "bpm": 130,
  "key_camelot": "9A",
  "energy_level": 8
}
```

#### POST `/api/tracks/:id/reanalyze`
Forçar re-análise de uma track.

#### DELETE `/api/tracks/:id`
Deletar uma track.

---

### Playlists

#### POST `/api/playlists`
Criar nova playlist.

**Request:**
```json
{
  "title": "My Summer Set",
  "description": "Opener warming-up set"
}
```

**Response:**
```json
{
  "playlist": {
    "id": "uuid",
    "title": "My Summer Set",
    "description": "...",
    "total_tracks": 0,
    "total_duration_ms": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/api/playlists/:id`
Obter playlist com todas as tracks ordenadas.

**Response:**
```json
{
  "playlist": {
    "id": "uuid",
    "title": "My Summer Set",
    "total_tracks": 10,
    "total_duration_ms": 2400000,
    "tracks": [
      {
        "id": "track-uuid",
        "title": "Midnight Drive",
        "bpm": 128,
        "key_camelot": "8A",
        "energy_level": 7,
        ...
      }
    ]
  }
}
```

#### POST `/api/playlists/:id/tracks`
Adicionar track à playlist.

**Request:**
```json
{
  "track_id": "uuid",
  "position": 0
}
```

#### DELETE `/api/playlists/:id/tracks/:trackId`
Remover track da playlist.

#### PUT `/api/playlists/:id/reorder`
Reordenar tracks na playlist.

**Request:**
```json
{
  "tracks": [
    { "track_id": "uuid-1", "position": 0 },
    { "track_id": "uuid-2", "position": 1 },
    { "track_id": "uuid-3", "position": 2 }
  ]
}
```

#### POST `/api/playlists/:id/auto-order`
Auto-ordenar playlist por compatibilidade harmônica + curva de energia.

**Response:** Playlist reordenada

#### DELETE `/api/playlists/:id`
Deletar playlist.

---

### Convert Presets & Export

#### GET `/api/convert/presets`
Lista todos os presets de conversão disponíveis.

**Response:**
```json
{
  "presets": [
    {
      "id": "uuid",
      "name": "CDJ-3000",
      "format": "wav",
      "sample_rate": 44100,
      "bit_depth": 16,
      "loudness_lufs": -8,
      "description": "Pioneer CDJ-3000 optimized..."
    },
    {
      "id": "uuid",
      "name": "Serato",
      "format": "aiff",
      "sample_rate": 44100,
      "bit_depth": 16,
      "loudness_lufs": -6,
      "description": "Serato DJ optimized..."
    },
    {
      "id": "uuid",
      "name": "Streaming",
      "format": "mp3",
      "sample_rate": 44100,
      "loudness_lufs": -14,
      "description": "Spotify/Apple Music normalized..."
    }
  ]
}
```

#### POST `/api/convert/exports`
Criar job de exportação/conversão.

**Request:**
```json
{
  "playlist_id": "uuid",
  "preset_id": "uuid"
}
```

**Response:**
```json
{
  "export": {
    "id": "uuid",
    "playlist_id": "uuid",
    "preset_id": "uuid",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/api/convert/exports/:id`
Status da exportação.

**Response:**
```json
{
  "export": {
    "id": "uuid",
    "status": "processing|completed|error",
    "output_path": "/exports/uuid/playlist.zip",
    "completed_at": "2024-01-01T00:01:00Z"
  }
}
```

---

## Serviços

### audioAnalyzer.ts
- `analyzeAudio(filePath)` — Detecta BPM, Tom Camelot, Energia, Duração
- `calculateKeyDistance(key1, key2)` — Distância harmônica entre dois tons
- `areKeysCompatible(key1, key2)` — Verifica compatibilidade harmônica
- `calculateMixBpm(bpm1, bpm2)` — Calcula BPM ideal para mixagem

**Nota:** Atualmente usa mock analysis. Para produção, integrar com:
- `ffprobe` para metadados de áudio
- `essentia.js` ou `librosa` bindings para BPM/key detection
- Bibliotecas de waveform (ex: `waveform.js`)

### trackService.ts
- `createTrack()` — Criar track
- `analyzeTrack()` — Analisar áudio
- `getTrack()` / `getTracks()` — Buscar tracks
- `updateTrackMetadata()` — Editar track
- `deleteTrack()` — Deletar track

### playlistService.ts
- `createPlaylist()` — Criar playlist
- `getPlaylist()` — Buscar com tracks
- `addTrackToPlaylist()` — Adicionar faixa
- `removeTrackFromPlaylist()` — Remover faixa
- `reorderPlaylistTracks()` — Reordenar manualmente
- `autoOrderPlaylist()` — Auto-sort harmônico + energia
- `deletePlaylist()` — Deletar playlist

### convertService.ts
- `initializePresets()` — Popula presets padrão
- `getPresets()` — Lista presets
- `createExport()` — Criar job de conversão
- `getExport()` — Status da exportação
- `updateExportStatus()` — Atualizar status
- `getExportFilename()` — Formata nome do arquivo

---

## Boas práticas implementadas

✅ **Type Safety**
- TypeScript strict mode
- Zod para validação de runtime
- Tipos explícitos em retornos de função

✅ **Arquitetura em camadas**
- Routes → Services → Database
- Separação clara de responsabilidades
- Fácil de testar e manter

✅ **Tratamento de erros**
- Custom AppError class
- Middleware de error handling
- Logging estruturado com Pino

✅ **Segurança**
- Validação de input com Zod
- Limite de tamanho de arquivo
- Suporte a CORS configurável

✅ **Desempenho**
- Análise de áudio em background (não bloqueia)
- Índices no banco de dados
- Queries otimizadas

✅ **Escalabilidade**
- Arquitetura modular (fácil adicionar features)
- Worker threads para análise (preparado)
- Cache-friendly query design

---

## Próximos passos

### Priority 1 - Produção-ready
- [ ] Integrar ffprobe para análise real de áudio
- [ ] Implementar geração de waveform
- [ ] Implementar conversão real com ffmpeg
- [ ] Autenticação (JWT)
- [ ] Testes automatizados (Jest)

### Priority 2 - Recursos
- [ ] Detecção de intro/outro mixáveis
- [ ] Normalização LUFS real
- [ ] Batch processing com filas (Bull/BullMQ)
- [ ] WebSocket para progress updates real-time

### Priority 3 - UX
- [ ] Rate limiting
- [ ] Caching (Redis)
- [ ] Paginação de resultados
- [ ] Soft deletes (arquivo recuperável)

---

## Licença

MIT
