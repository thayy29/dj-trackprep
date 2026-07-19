export interface Track {
  id: string;
  title: string;
  artist?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  duration_ms?: number;
  bpm?: number;
  key_camelot?: string;
  key_note?: string;
  energy_level?: number;
  waveform_data?: string;
  status: "analyzing" | "analyzed" | "error";
  uploaded_at: string;
  analyzed_at?: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  total_duration_ms: number;
  total_tracks: number;
  tracks?: Track[];
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  track?: Track;
}

export interface ConvertPreset {
  id: string;
  name: string;
  format: "wav" | "aiff" | "flac" | "mp3" | "m4a";
  sample_rate: number;
  bit_depth?: number;
  loudness_lufs?: number;
  description?: string;
  created_at: string;
}

export interface Export {
  id: string;
  playlistId?: string;
  playlist_id?: string;
  presetId?: string;
  preset_id?: string;
  status: "pending" | "processing" | "completed" | "error";
  outputPath?: string;
  output_path?: string;
  createdAt?: string;
  created_at?: string;
  completedAt?: string;
  completed_at?: string;
}

export interface AudioAnalysis {
  bpm: number;
  key_camelot: string;
  key_note: string;
  energy_level: number;
  duration_ms: number;
  waveform_data?: string;
}
