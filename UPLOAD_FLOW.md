# TrackPrep Upload & Analysis Flow

## Complete Flow - Fixed Implementation

### 1. Frontend Upload Trigger
- User drags audio files or clicks "Selecionar arquivos"
- Files are collected in `handleFileSelect()` (home/index.tsx:210-245)
- Upload modal shows with progress animation
- `api.uploadTracks(fileArray)` is called

### 2. Backend File Upload Processing
**Endpoint:** `POST /api/tracks/upload`

```
1. Files arrive at multer middleware
   - Validated against audio MIME types
   - Stored in temporary location
   
2. For each file:
   - Generate UUID filename to avoid collisions
   - Move file from temp → permanent storage (UPLOAD_DIR)
   - Create Track record in database:
     {
       id: uuid,
       title: filename without extension,
       file_name: original filename,
       file_path: /path/to/uploaded/file,
       file_size: bytes,
       status: "analyzing",
       uploaded_at: ISO timestamp,
       created_at: ISO timestamp
     }
   
3. Return all created tracks immediately:
   {
     "tracks": [{ id, title, status: "analyzing", ... }]
   }
```

### 3. Frontend Track Addition
- Tracks from response are added to PlaylistContext via `addTracks(result.tracks)`
- Tracks immediately appear in "Suas faixas" list with "Analisando" status
- waveform shows SkeletonWaveform loading animation

### 4. Background Analysis (Non-blocking)
**In TrackService.createTrack()**

```
1. Track creation returns immediately
2. setImmediate() queues analysis to run next event loop cycle
3. analyzeTrackInBackground() executes async:
   - Reads audio file from disk
   - Calls analyzeAudio() from audioAnalyzer service
   - Analysis data returned:
     {
       bpm: number,
       key_camelot: "1A" to "12B",
       key_note: "C", "C#", etc,
       energy_level: 1-10,
       duration_ms: milliseconds,
       waveform_data: base64 string
     }
   
4. Update track record in database:
   - bpm
   - key_camelot
   - key_note
   - energy_level
   - duration_ms
   - waveform_data (JSON stringified)
   - status: "analyzed"
   - analyzed_at: ISO timestamp

5. Frontend polls via analyzeTrack() and periodically checks track status
   - Updates tracks in real-time via updateTrack() in PlaylistContext
```

### 5. Frontend Display Updates

**Before analysis completes:**
```
├─ [○] Track Title                    [═══════] Analisando 🔄
├─ artist info: — · — BPM
```

**After analysis completes:**
```
├─ [✓] Track Title                    [█████████] 🟢
├─ 8A · 128 BPM
├─ Energy: ●●●●●●●●●○
```

## Key Improvements

✅ **Immediate feedback** - Tracks appear in list within milliseconds of upload
✅ **Non-blocking analysis** - UI responsive while analysis runs
✅ **Batch processing** - Max 3 concurrent analyses to prevent API overload
✅ **Status indicators** - "Analisando" → "Analyzed" → Shows data
✅ **Database persistence** - All data saved before any frontend interaction
✅ **File handling** - UUID naming prevents collisions, proper temp file cleanup

## Files Involved

**Frontend:**
- `src/screen/home/index.tsx` - Upload trigger, UI updates
- `src/context/PlaylistContext.tsx` - State management
- `src/hooks/useAudioAnalysis.ts` - Queue-based analysis
- `src/services/api.ts` - API communication

**Backend:**
- `src/routes/tracks.ts` - Upload endpoint
- `src/services/trackService.ts` - Track creation & analysis
- `src/services/audioAnalyzer.ts` - Audio analysis implementation
- `src/repositories/TrackRepository.ts` - Database operations
- `src/db/database.ts` - Knex initialization
- `src/db/migrations/001_initial_schema.ts` - Database schema

## Database Schema

```sql
CREATE TABLE tracks (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  artist VARCHAR,
  file_path VARCHAR NOT NULL,
  file_name VARCHAR NOT NULL,
  file_size INTEGER NOT NULL,
  duration_ms INTEGER,
  bpm FLOAT,
  key_camelot VARCHAR,
  key_note VARCHAR,
  energy_level INTEGER,
  waveform_data TEXT,
  status ENUM('analyzing', 'analyzed', 'error'),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Batch Processing Configuration

- **BATCH_SIZE**: 3 concurrent analyses max
- **POLLING_INTERVAL**: 1000ms between status checks
- Prevents API overload while maintaining responsiveness

## Error Handling

- Invalid MIME types rejected at upload
- Analysis failures set track status to "error"
- File system errors logged and tracked
- Database transaction failures rolled back properly
