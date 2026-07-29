import { Header } from "../../components/header";
import { useState, useRef, useEffect } from "react";
import { PlaylistProvider, usePlaylist } from "../../context/PlaylistContext";
import { useAudioAnalysis } from "../../hooks/useAudioAnalysis";
import { useDragDrop } from "../../hooks/useDragDrop";
import { useExport } from "../../hooks/useExport";
import { ConvertModal } from "../../components/modals/ConvertModal";
import { EditTrackModal } from "../../components/modals/EditTrackModal";
import { ExportModal } from "../../components/modals/ExportModal";
import { UploadModal } from "../../components/modals/UploadModal";
import { Waveform } from "../../components/Waveform";
import { LoadingSpinner, Skeleton, SkeletonWaveform } from "../../components/global";
import { api } from "../../services/api";
import { Track } from "../../types/index";
import {
  IoCloudUpload,
  IoDownload,
  IoRefresh,
  IoTrash,
  IoCheckmark,
  IoClose,
  IoMenu,
  IoSearch,
  IoSwapVertical,
} from "react-icons/io5";
import { MdAutoFixHigh } from "react-icons/md";

type Step = { n: number; label: string; state: "done" | "active" | "todo" };

const steps: Step[] = [
  { n: 1, label: "Enviar músicas", state: "done" },
  { n: 2, label: "Analisar BPM e Camelot", state: "done" },
  { n: 3, label: "Organizar ordem e energia", state: "active" },
  { n: 4, label: "Converter formato", state: "todo" },
  { n: 5, label: "Exportar / baixar", state: "todo" },
];

function Info({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-text-low text-text-low text-[9px] font-serif italic font-semibold cursor-help hover:border-text-medium hover:text-text-medium">
      i
      <span className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-black text-text-high text-xs not-italic font-sans font-normal p-3 rounded-lg w-64 text-left leading-snug border border-border-light z-20 shadow-xl">
        {text}
      </span>
    </span>
  );
}

function StepPill({ step }: { step: Step }) {
  const numCls =
    step.state === "active"
      ? "bg-action-primary text-black border-action-primary"
      : step.state === "done"
      ? "bg-transparent border-action-primary text-action-primary"
      : "bg-background-elevated border-border-light text-text-low";
  const labelCls =
    step.state === "active" ? "text-text-high font-medium" : "text-text-low";
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div
        className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center text-[11px] font-semibold ${numCls}`}
      >
        {step.state === "done" ? <IoCheckmark className="w-3 h-3" /> : step.n}
      </div>
      <div className={`text-xs ${labelCls} whitespace-nowrap`}>{step.label}</div>
    </div>
  );
}

function EnergyCurve() {
  return (
    <svg viewBox="0 0 600 56" preserveAspectRatio="none" className="w-full h-14">
      <defs>
        <linearGradient id="eg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7A3EFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7A3EFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,44 C60,40 100,36 140,32 C180,28 220,22 260,16 C300,10 340,8 380,12 C420,16 460,26 500,36 C540,44 570,48 600,46 L600,56 L0,56 Z"
        fill="url(#eg)"
      />
      <path
        d="M0,44 C60,40 100,36 140,32 C180,28 220,22 260,16 C300,10 340,8 380,12 C420,16 460,26 500,36 C540,44 570,48 600,46"
        stroke="#7A3EFF"
        strokeWidth="1.5"
        fill="none"
      />
      {[
        [0, 44],
        [140, 32],
        [260, 16],
        [380, 12],
        [500, 36],
        [600, 46],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={3} fill="#7A3EFF" />
      ))}
    </svg>
  );
}

function MiniWave({ active = true }: { active?: boolean }) {
  const bars = [3, 10, 7, 14, 9, 16, 11, 7, 14, 9, 5, 13, 9, 16, 11, 5, 13, 7, 14, 3];
  return (
    <svg viewBox="0 0 80 20" className="w-20 h-5">
      <g fill={active ? "#1DB954" : "#6A6A6A"}>
        {bars.map((h, i) => (
          <rect key={i} x={i * 4} y={(20 - h) / 2} width={2} height={h} />
        ))}
      </g>
    </svg>
  );
}

function EnergyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-[2px]">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`w-[5px] h-[5px] rounded-full ${
            i < level ? "bg-yellow-400" : "bg-border-light"
          }`}
        />
      ))}
    </span>
  );
}

interface CamelotWheelProps {
  activeTracks: string[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
}

function CamelotWheel({ activeTracks, selectedKey, onSelectKey }: CamelotWheelProps) {
  // Camelot wheel positions (key, x, y, label)
  const keys = [
    ["1A", 100, 18],
    ["2A", 145, 30],
    ["3A", 177, 62],
    ["4A", 188, 107],
    ["5A", 177, 150],
    ["6A", 145, 182],
    ["7A", 100, 195],
    ["8A", 55, 182],
    ["9A", 23, 150],
    ["10A", 12, 107],
    ["11A", 23, 62],
    ["12A", 55, 30],
  ] as const;

  // Harmonic neighbors for each key
  const harmonicNeighbors: Record<string, string[]> = {
    "1A": ["12A", "2A"],
    "2A": ["1A", "3A"],
    "3A": ["2A", "4A"],
    "4A": ["3A", "5A"],
    "5A": ["4A", "6A"],
    "6A": ["5A", "7A"],
    "7A": ["6A", "8A"],
    "8A": ["7A", "9A"],
    "9A": ["8A", "10A"],
    "10A": ["9A", "11A"],
    "11A": ["10A", "12A"],
    "12A": ["11A", "1A"],
  };

  const getKeyColor = (key: string) => {
    if (key === selectedKey) return "#7A3EFF"; // Purple - selected
    if (activeTracks.includes(key)) return "#1DB954"; // Green - in playlist
    if (selectedKey && harmonicNeighbors[selectedKey]?.includes(key)) return "#22d3ee"; // Cyan - compatible
    return "#6A6A6A"; // Gray - inactive
  };

  const getKeySize = (key: string) => {
    if (key === selectedKey) return 12;
    if (activeTracks.includes(key)) return 11;
    return 10;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] aspect-square cursor-pointer">
        {/* Outer circle */}
        <circle cx="100" cy="100" r="88" fill="none" stroke="#3A3A3A" strokeWidth="1" />

        {/* Keys */}
        <g fontSize="10" textAnchor="middle" fontFamily="SF Mono, monospace" dominantBaseline="middle">
          {keys.map(([k, x, y]) => (
            <g key={k as string} onClick={() => onSelectKey(k as string)}>
              {/* Highlight circle for active/selected */}
              {(k === selectedKey || activeTracks.includes(k as string)) && (
                <circle
                  cx={x as number}
                  cy={y as number}
                  r={getKeySize(k as string) + 4}
                  fill={getKeyColor(k as string)}
                  opacity="0.2"
                />
              )}
              {/* Key text */}
              <text
                x={x as number}
                y={y as number}
                fill={getKeyColor(k as string)}
                fontWeight={k === selectedKey || activeTracks.includes(k as string) ? 700 : 400}
                className="hover:opacity-100 opacity-80 transition-opacity"
              >
                {k}
              </text>
            </g>
          ))}
        </g>

        {/* Inner circle */}
        <circle cx="100" cy="100" r="40" fill="none" stroke="#3A3A3A" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[10px] w-full mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-action-primary" />
          <span className="text-text-low">Seu set</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7A3EFF" }} />
          <span className="text-text-low">Selecionado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-text-low">Compatível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-text-low" />
          <span className="text-text-low">Disponível</span>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.06em] text-text-medium mb-3 flex items-center gap-1.5">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-background-elevated border border-border-light text-[10px] font-semibold text-text-low">
        {step}
      </span>
      {children}
    </div>
  );
}

const MAX_TRACKS_PER_UPLOAD = 5; // Limit to prevent rendering issues

function HomeContent() {
  const { tracks, addTracks, removeTrack, updateTrack, reorderTracks, selectedIds, toggleSelection, selectAll, clearSelection, autoOrderPlaylist } =
    usePlaylist();
  const { analyzeTrack, isAnalyzing } = useAudioAnalysis();
  const { draggedItem, dropTarget, handleDragStart, handleDragEnd, handleDragOver, handleDrop } =
    useDragDrop();
  const { createExport, getExport } = useExport();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; progress: number }[]>([]);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentExport, setCurrentExport] = useState<any>(null);
  const [selectedCamelotKey, setSelectedCamelotKey] = useState<string | null>(null);
  const [suggestedNextTrack, setSuggestedNextTrack] = useState<any>(null);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [manualReorderInProgress, setManualReorderInProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadProcessingRef = useRef(false); // Prevent concurrent uploads

  const selectedCount = selectedIds.size;
  const totalTracks = tracks.length;

  // Calculate total duration
  const totalDurationMs = tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
  const hours = Math.floor(totalDurationMs / 3600000);
  const minutes = Math.floor((totalDurationMs % 3600000) / 60000);
  const seconds = Math.floor((totalDurationMs % 60000) / 1000);
  const formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const bpmValues = tracks.map((t) => t.bpm || 120).filter(Boolean);
  const bpmMin = Math.min(...bpmValues);
  const bpmMax = Math.max(...bpmValues);
  const bpmRange = `${Math.round(bpmMin)} – ${Math.round(bpmMax)}`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || uploadProcessingRef.current) return;

    const fileArray = Array.from(files);

    // CRITICAL FIX: Check max files limit
    if (fileArray.length > MAX_TRACKS_PER_UPLOAD) {
      setUploadError(`⚠️ Máximo ${MAX_TRACKS_PER_UPLOAD} faixas por vez. Você selecionou ${fileArray.length}. Por favor, selecione menos arquivos.`);
      setTimeout(() => setUploadError(null), 8000);
      // Reset input
      e.currentTarget.value = '';
      return;
    }

    uploadProcessingRef.current = true;
    setUploadError(null);
    setIsUploadModalOpen(true);
    setUploadedFiles(fileArray.map((f) => ({ name: f.name, progress: 0 })));

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 40;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
      }
      setUploadedFiles((prev) =>
        prev.map((f) => ({ ...f, progress: Math.min(currentProgress, 100) }))
      );
    }, 300);

    setTimeout(async () => {
      try {
        console.log(`[Upload] Starting upload of ${fileArray.length} files...`);
        const result = await api.uploadTracks(fileArray);

        // CRITICAL: Verify response structure
        if (!result || !result.tracks) {
          throw new Error("Invalid API response: missing 'tracks' field");
        }

        if (result.tracks.length === 0) {
          throw new Error("API returned empty tracks array");
        }

        if (result.tracks.length !== fileArray.length) {
          console.warn(`[Upload] Expected ${fileArray.length} tracks, got ${result.tracks.length}`);
        }

        console.log(`[Upload] ✅ Received ${result.tracks.length} tracks from API`);

        // CRITICAL FIX: Add tracks in a synchronous batch
        // Don't use setTimeout, execute immediately so React batches the update
        addTracks(result.tracks);
        console.log(`[Upload] ✅ Added ${result.tracks.length} tracks to playlist`);
        console.log(`[Upload] Current track count: ${tracks.length} + ${result.tracks.length} = ${tracks.length + result.tracks.length}`);

        // Verify tracks are actually in the list
        if (tracks.length === 0) {
          console.warn("[Upload] WARNING: tracks array still empty after addTracks()");
        }

        // Close modal AFTER tracks are definitely added
        // Use slightly longer delay to ensure React renders the update
        setTimeout(() => {
          console.log(`[Upload] Closing modal...`);
          setIsUploadModalOpen(false);
          setUploadedFiles([]);
          clearInterval(interval);
          uploadProcessingRef.current = false;
          console.log("[Upload] ✅ Modal closed");
        }, 1000);

        // Start analysis polling in background
        result.tracks.forEach((track) => {
          console.log(`[Upload] 🔄 Starting analysis for: ${track.file_name}`);
          analyzeTrack(track.id, (trackId, analyzedTrack) => {
            console.log(`[Upload] ✅ Analysis complete: ${trackId}`);
            updateTrack(trackId, analyzedTrack);
          });
        });
      } catch (err) {
        console.error("[Upload] ❌ Upload failed:", err);
        const errorMsg = err instanceof Error ? err.message : "Erro ao fazer upload";
        setUploadError(`❌ ${errorMsg}`);
        setIsUploadModalOpen(false);
        setUploadedFiles([]);
        clearInterval(interval);
        uploadProcessingRef.current = false;
        setTimeout(() => setUploadError(null), 8000);
      }
    }, 2500);

    // Reset file input
    e.currentTarget.value = '';
  };

  const handleDownloadSelected = async () => {
    if (selectedCount === 0) return;
    const selected = tracks.filter((t) => selectedIds.has(t.id));
    console.log("Baixando:", selected);
    alert(`Baixando ${selectedCount} faixa(s)...`);
  };

  const handleConvertSelected = async (presetId: string) => {
    setIsConvertModalOpen(false);
    alert(`Convertendo ${selectedCount} faixa(s) com preset ${presetId}...`);
  };

  const handleReanalyze = async () => {
    if (selectedCount === 0) return;
    const selected = tracks.filter((t) => selectedIds.has(t.id));
    for (const track of selected) {
      analyzeTrack(track.id, (trackId, analyzedTrack) => {
        updateTrack(trackId, analyzedTrack);
      });
    }
  };

  const handleDelete = () => {
    if (selectedCount === 0) return;
    if (confirm(`Excluir ${selectedCount} faixa(s)?`)) {
      selectedIds.forEach((id) => removeTrack(id));
      clearSelection();
    }
  };

  const handleEditTrack = (track: Track) => {
    setEditingTrack(track);
    setIsEditModalOpen(true);
  };

  const handleUpdateTrack = async (updates: Partial<Track>) => {
    if (!editingTrack) return;

    console.log(`[Edit] Starting update for track ${editingTrack.id}`);
    console.log(`[Edit] Updates to apply:`, updates);

    setIsEditLoading(true);
    setEditError(null);

    // Step 1: Optimistic update - show changes immediately
    const previousTrack = editingTrack;
    const updatedTrack = { ...editingTrack, ...updates };
    updateTrack(editingTrack.id, updatedTrack);
    console.log(`[Edit] ✅ Optimistic update applied for track ${editingTrack.id}`);
    console.log(`[Edit] Before:`, previousTrack);
    console.log(`[Edit] After:`, updatedTrack);

    try {
      // Step 2: Sync with backend
      console.log(`[Edit] 🔄 Syncing with backend...`);
      const result = await api.updateTrack(editingTrack.id, updates);

      // Verify backend response
      if (!result.track) {
        throw new Error("Invalid response from server");
      }

      // Step 3: Update with actual backend data (in case server made adjustments)
      updateTrack(editingTrack.id, result.track);
      console.log(`[Edit] ✅ Backend confirmed - track saved successfully`);
      console.log(`[Edit] Final state:`, result.track);

      // Close modal after short delay for feedback
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingTrack(null);
        setIsEditLoading(false);
        console.log(`[Edit] Modal closed`);
      }, 300);
    } catch (err) {
      console.error("[Edit] ❌ Update failed:", err);

      // Revert optimistic update on error
      console.log(`[Edit] Reverting optimistic update...`);
      updateTrack(previousTrack.id, previousTrack);
      setEditError(
        err instanceof Error ? err.message : "Erro ao salvar as alterações"
      );
      setIsEditLoading(false);

      // Clear error after 5 seconds
      setTimeout(() => setEditError(null), 5000);
    }
  };

  const handleExport = async (presetId: string) => {
    const playlistId = "temp-playlist";
    const exp = await createExport(playlistId, presetId);
    if (exp) {
      setCurrentExport(exp);
      setIsExportModalOpen(true);
    }
  };

  // Drag handlers with manual reorder flag - SAFE VERSION
  const handleDragStartWithFlag = (track: Track, idx: number) => {
    setManualReorderInProgress(true);
    handleDragStart(track, idx);
    console.log(`[Drag] START: Manual reorder started for track at index ${idx}`);
  };

  const handleDragEndWithFlag = () => {
    handleDragEnd();
    // IMPORTANT: Keep flag ON briefly after drop to prevent auto-reorder race
    console.log("[Drag] END: Drag ended, keeping manual reorder flag to prevent race");
  };

  const handleDropWithFlag = (idx: number) => {
    console.log(`[Drag] DROP: Reordering to index ${idx}. Current tracks: ${tracks.length}`);

    if (!draggedItem) {
      console.warn("[Drag] DROP: No draggedItem, aborting");
      setManualReorderInProgress(false);
      return;
    }

    // Execute the drop
    handleDrop(idx, tracks, reorderTracks);

    // Keep flag ON for a bit longer to ensure state settles
    // This prevents auto-reorder from firing during state updates
    setTimeout(() => {
      setManualReorderInProgress(false);
      console.log("[Drag] DROP: Manual reorder flag cleared after state settle");
    }, 500);
  };

  const handleCamelotKeySelect = async (key: string) => {
    setSelectedCamelotKey(key);
    setSuggestedLoading(true);
    setSuggestedNextTrack(null);

    try {
      // Get the last track with this key from current playlist
      const lastTrackWithKey = [...tracks].reverse().find((t) => t.key_camelot === key);

      if (!lastTrackWithKey) {
        console.log(`[Camelot] No tracks found with key ${key}`);
        setSuggestedLoading(false);
        return;
      }

      // Call backend to suggest next track
      const response = await fetch(`/api/playlists/suggest-next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastTrackKey: key,
          lastTrackBPM: lastTrackWithKey.bpm || 120,
          lastTrackEnergy: lastTrackWithKey.energy_level || 5,
          playlistTrackIds: tracks.map((t) => t.id),
        }),
      });

      if (!response.ok) throw new Error("Failed to get suggestion");

      const data = await response.json();
      setSuggestedNextTrack(data.suggestedTrack);
      console.log(`[Camelot] Suggested next track for key ${key}:`, data.suggestedTrack);
    } catch (err) {
      console.error("[Camelot] Error getting suggestion:", err);
    } finally {
      setSuggestedLoading(false);
    }
  };

  // Auto-reorder harmonically when tracks finish analysis
  // IMPORTANT: Skip if user is doing manual reordering to avoid conflicts
  // Also: Only run once per analysis cycle to prevent infinite loops
  const autoReorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (tracks.length < 2 || manualReorderInProgress) {
      console.log("[AutoOrder] Skipping: manual reorder in progress or too few tracks");
      return;
    }

    // Count tracks with full analysis data
    const fullyAnalyzedTracks = tracks.filter((t) => t.status === "analyzed" && t.bpm && t.key_camelot);

    // Only auto-reorder if we have at least 2 fully analyzed tracks
    if (fullyAnalyzedTracks.length >= 2) {
      // Clear any pending timeout
      if (autoReorderTimeoutRef.current) {
        clearTimeout(autoReorderTimeoutRef.current);
      }

      // Wait a moment for analysis to stabilize before reordering
      autoReorderTimeoutRef.current = setTimeout(() => {
        console.log(`[AutoOrder] Auto-ordering ${fullyAnalyzedTracks.length} analyzed tracks...`);
        autoOrderPlaylist();
        autoReorderTimeoutRef.current = null;
      }, 1200);

      // Cleanup on unmount
      return () => {
        if (autoReorderTimeoutRef.current) {
          clearTimeout(autoReorderTimeoutRef.current);
        }
      };
    }
  }, [tracks.filter((t) => t.status === "analyzed").map((t) => t.id).join(","), autoOrderPlaylist, manualReorderInProgress]);

  return (
    <div className="min-h-screen bg-background-main text-text-high">
      <Header totalTracks={totalTracks} />

      <main className="max-w-[1360px] mx-auto p-7">
        {/* STEPS */}
        <div className="flex items-center gap-2 py-3.5 mb-6 border-y border-border-light overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <StepPill step={s} />
              {i < steps.length - 1 && (
                <span className="text-text-low text-[10px]">→</span>
              )}
            </div>
          ))}
        </div>

        {/* KPIs */}
        <div className="flex gap-8 pb-6 mb-6 border-b border-border-light px-1">
          <div>
            <div className="text-[11px] text-text-medium mb-1 flex items-center gap-1">
              Duração do set
              <Info text="Soma da duração de todas as faixas na lista." />
            </div>
            <div className="text-[22px] font-semibold tracking-tight text-action-primary">
              {formattedDuration}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-text-medium mb-1 flex items-center gap-1">
              Faixa de BPM
              <Info text="Menor e maior BPM do set. Diferenças menores que 6 BPM permitem mixagem sem esticar demais o tempo." />
            </div>
            <div className="text-[22px] font-semibold tracking-tight">{bpmRange}</div>
          </div>
          <div>
            <div className="text-[11px] text-text-medium mb-1 flex items-center gap-1">
              Tons (Camelot)
              <Info text="Tons detectados nas faixas do set, no sistema Camelot. Tons adjacentes na roda são compatíveis." />
            </div>
            <div className="text-[22px] font-semibold tracking-tight">
              {[...new Set(tracks.map((t) => t.key_camelot))].join(" · ")}
            </div>
          </div>
          <div className="ml-auto self-center text-[11px] text-text-medium">
            {totalTracks} faixa{totalTracks !== 1 ? "s" : ""} · {tracks.filter((t) => t.status === "analyzing").length}{" "}
            analisando
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-[1fr_240px] gap-6">
          <div>
            {/* Step 1: Upload */}
            <SectionLabel step={1}>Enviar músicas</SectionLabel>
            <div
              className="bg-background-elevated/50 rounded-xl p-8 mb-6 border border-border-light/50 hover:border-border-light/80 transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-action-primary", "bg-action-primary/5");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-action-primary", "bg-action-primary/5");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-action-primary", "bg-action-primary/5");
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  const event = new Event("change", { bubbles: true });
                  Object.defineProperty(event, "target", {
                    writable: false,
                    value: { files: files } as any,
                  });
                  fileInputRef.current?.dispatchEvent(event);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full cursor-pointer"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-action-primary to-action-secondary flex items-center justify-center text-3xl hover:from-action-primaryHover hover:to-action-secondaryHover transition-all">
                    <IoCloudUpload className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-base font-semibold text-text-high mb-1">
                      Arraste suas músicas aqui
                    </div>
                    <div className="text-sm text-text-medium mb-1">
                      ou clique para selecionar arquivos MP3, WAV, AIFF
                    </div>
                    <div className="text-[11px] text-text-low/70 mb-3">
                      💡 Máximo {MAX_TRACKS_PER_UPLOAD} faixas por vez para melhor performance
                    </div>
                    <div className="inline-block px-4 py-2 rounded-lg bg-action-primary text-black font-semibold text-sm hover:bg-action-primaryHover transition-colors">
                      Selecionar arquivos
                    </div>
                  </div>
                  <div className="text-xs text-text-low">
                    Análise automática de BPM, Tom e Energia
                  </div>
                </div>
              </button>
            </div>

            {/* Step 3: Energy curve */}
            <div className="bg-background-elevated/30 rounded-lg p-5 mb-6 border border-border-light/30">
              <SectionLabel step={3}>
                Curva de energia
                <Info text="Visualiza como o set evolui em intensidade. Arraste os pontos para reordenar as faixas — o app recalcula a ordem respeitando compatibilidade harmônica." />
              </SectionLabel>
              <EnergyCurve />
            </div>

            {/* Track list */}
            <div className="bg-background-elevated/20 rounded-lg p-4 border border-border-light/20">
              <div className="flex justify-between items-baseline px-1 pb-3 mb-3 border-b border-border-light/30">
                <div className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
                  <IoSwapVertical className="w-4 h-4" />
                  Suas faixas
                </div>
                <div className="text-xs text-text-medium">
                  ↕ ordenadas por Camelot
                </div>
              </div>

              {/* Selection toolbar */}
              {tracks.length > 0 && (
                <div className="flex gap-2 items-center p-3 px-4 rounded-lg mb-4 bg-background-surface border border-action-secondary/20">
                  <button
                    onClick={() =>
                      selectAll(tracks.every((t) => selectedIds.has(t.id))
                        ? []
                        : tracks)
                    }
                    className="inline-flex items-center gap-2"
                  >
                    <span className="text-text-medium hover:text-text-high cursor-pointer text-lg">
                      {tracks.every((t) => selectedIds.has(t.id)) ? (
                        <IoCheckmark className="w-5 h-5" />
                      ) : (
                        <IoClose className="w-5 h-5 opacity-50" />
                      )}
                    </span>
                  </button>
                  <span className="text-xs text-action-secondary font-semibold">
                    {selectedCount} selecionada{selectedCount !== 1 ? "s" : ""}
                  </span>

                  <div className="w-px h-5 bg-border-light/30" />

                  <button
                    onClick={handleDownloadSelected}
                    disabled={selectedCount === 0}
                    className="px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-action-primary/20 enabled:text-action-primary"
                  >
                    <IoDownload className="w-4 h-4" />
                    Baixar
                  </button>
                  <button
                    onClick={() => setIsConvertModalOpen(true)}
                    disabled={selectedCount === 0}
                    className="px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-action-secondary/20 enabled:text-action-secondary"
                  >
                    🔄 Converter
                    <Info text="Convert Preset: pacote de configurações (formato, sample rate, loudness, cues e tags) otimizado para um destino — CDJ Pioneer, Serato, Engine DJ, streaming ou club." />
                  </button>
                  <button
                    onClick={handleReanalyze}
                    disabled={selectedCount === 0}
                    className="px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-text-low/10"
                  >
                    <IoRefresh className="w-4 h-4" />
                    Reanalisar
                  </button>
                  <button
                    onClick={autoOrderPlaylist}
                    className="px-3 py-1.5 rounded-md text-xs font-medium ml-auto transition-all hover:bg-action-secondary/20 text-action-secondary inline-flex items-center gap-1.5"
                  >
                    <MdAutoFixHigh className="w-4 h-4" />
                    Auto-order
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={selectedCount === 0}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-action-danger/20 enabled:text-action-danger inline-flex items-center gap-1.5"
                  >
                    <IoTrash className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="mb-4 p-3 bg-action-danger/20 border border-action-danger/40 rounded-lg">
                  <div className="text-sm text-action-danger">{uploadError}</div>
                </div>
              )}

              {tracks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-sm text-text-low mb-2">Nenhuma faixa ainda</div>
                  <div className="text-xs text-text-low/60 mb-4">
                    Comece enviando suas músicas acima
                  </div>
                  <div className="text-[11px] text-text-low/50 bg-background-elevated/30 inline-block px-3 py-2 rounded-md">
                    💡 Dica: Máximo {MAX_TRACKS_PER_UPLOAD} faixas por vez para melhor desempenho
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {tracks.map((t, idx) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => handleDragStartWithFlag(t, idx)}
                      onDragEnd={handleDragEndWithFlag}
                      onDragOver={() => handleDragOver(idx)}
                      onDrop={() => handleDropWithFlag(idx)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-move ${
                        selectedIds.has(t.id)
                          ? "bg-action-secondary/10 border border-action-secondary/30"
                          : "hover:bg-background-elevated/30 border border-transparent"
                      } ${draggedItem?.index === idx ? "opacity-50" : ""} ${
                        dropTarget === idx ? "border-action-secondary/60" : ""
                      }`}
                    >
                      <button
                        onClick={() => toggleSelection(t.id)}
                        className="text-text-medium hover:text-action-primary cursor-pointer"
                      >
                        {selectedIds.has(t.id) ? (
                          <IoCheckmark className="w-5 h-5" />
                        ) : (
                          <IoClose className="w-5 h-5 opacity-50" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.title || t.file_name}</div>
                        <div className="text-xs text-text-low mt-1 flex items-center gap-2">
                          {t.artist && <span title="Artista">{t.artist}</span>}
                          {t.artist && <span>·</span>}
                          <span title="Camelot key (estimated from audio analysis)">{t.key_camelot || "—"}</span>
                          <span>·</span>
                          <span title="BPM detected from audio">{t.bpm || "—"} BPM</span>
                          <span>·</span>
                          <span title="Energy level (estimated)">🔋 {t.energy_level || "—"}</span>
                          {t.status === "analyzed" && (
                            <span className="text-[10px] bg-action-secondary/20 text-action-secondary px-1.5 py-0.5 rounded">
                              estimated
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {t.status === "analyzing" ? (
                          <SkeletonWaveform width="w-20" height="h-5" />
                        ) : (
                          <Waveform data={t.waveform_data} height={24} className="flex-shrink-0" />
                        )}
                      </div>

                      <EnergyDots level={t.energy_level || 5} />

                      {t.status === "analyzing" && (
                        <div className="flex items-center gap-1.5 text-[11px] text-action-secondary">
                          <div className="w-3 h-3 border-2 border-action-secondary border-t-transparent rounded-full animate-spin" />
                          Analisando
                        </div>
                      )}

                      {t.status === "analyzed" && (
                        <span className="inline-block w-2 h-2 rounded-full bg-action-primary" />
                      )}

                      <button
                        onClick={() => handleEditTrack(t)}
                        className="text-text-medium hover:text-action-secondary ml-2"
                        title="Editar metadados"
                      >
                        ✏️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-6">
            <div className="bg-background-elevated/30 rounded-lg p-4 border border-border-light/30">
              <div className="text-[11px] uppercase tracking-[0.06em] text-text-medium mb-3 flex items-center gap-1.5">
                Roda Camelot
                <Info text="Clique em um tom para ver a próxima sugestão harmônica. Verde = tons no seu set. Roxo = selecionado. Ciano = compatível." />
              </div>
              <div className="flex justify-center">
                <CamelotWheel
                  activeTracks={tracks.filter((t) => t.key_camelot).map((t) => t.key_camelot!)}
                  selectedKey={selectedCamelotKey}
                  onSelectKey={handleCamelotKeySelect}
                />
              </div>
            </div>

            {selectedCamelotKey && (
              <div className="bg-background-elevated/30 rounded-lg p-4 border border-border-light/30 hover:border-action-secondary/30 transition-colors">
                <div className="text-[11px] uppercase tracking-[0.06em] text-text-medium mb-3 flex items-center gap-1.5">
                  Próxima Sugerida
                  <Info text="Compatível harmonicamente com a seleção. Clique para adicionar." />
                </div>

                {suggestedLoading ? (
                  <div className="flex items-center justify-center py-4 text-text-low">
                    <div className="w-4 h-4 border-2 border-action-secondary border-t-transparent rounded-full animate-spin mr-2" />
                    Buscando sugestão...
                  </div>
                ) : suggestedNextTrack ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-background-surface/60 rounded-lg text-[13px] border border-border-light/20 hover:border-action-secondary/40 transition-colors">
                      <div className="font-medium mb-1">{suggestedNextTrack.title || suggestedNextTrack.file_name}</div>
                      <div className="text-text-low text-[11px] mb-2">
                        {suggestedNextTrack.key_camelot} · {suggestedNextTrack.bpm} BPM · 🔋 {suggestedNextTrack.energy_level}
                      </div>
                      <div className="text-[10px] text-action-secondary font-medium">
                        Compatibilidade: {Math.round((suggestedNextTrack.compatibilityScore || 0) * 100)}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addTracks([suggestedNextTrack]);
                        setSuggestedNextTrack(null);
                        console.log("[Camelot] Added suggested track to playlist");
                      }}
                      className="w-full py-2 px-3 text-xs font-medium bg-action-secondary/20 text-action-secondary hover:bg-action-secondary/30 rounded-md transition-colors"
                    >
                      Adicionar à playlist
                    </button>
                  </div>
                ) : (
                  <div className="py-4 text-center text-text-low text-[12px]">
                    Selecione um tom na roda acima
                  </div>
                )}
              </div>
            )}

            <div className="bg-background-elevated/30 rounded-lg p-4 border border-border-light/30">
              <div className="text-[11px] uppercase tracking-[0.06em] text-text-medium mb-2 flex items-center gap-1.5">
                Exportar para
                <Info text="Gera arquivos no formato nativo da plataforma." />
              </div>
              <div className="text-[11px] text-text-low mb-3">
                Passo 5 — quando pronto
              </div>
              <div className="flex flex-col gap-0.5">
                {[
                  { name: "Rekordbox", preset: "rekordbox" },
                  { name: "Serato", preset: "serato" },
                  { name: "Engine DJ", preset: "engine" },
                  { name: "Gig bag", preset: "gig" },
                ].map((x) => (
                  <button
                    key={x.preset}
                    onClick={() => handleExport(x.preset)}
                    className="py-2 px-2 text-left text-[13px] text-text-medium hover:text-action-primary hover:bg-action-primary/10 rounded-md transition-colors font-medium"
                  >
                    {x.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        uploadedFiles={uploadedFiles}
      />
      <ConvertModal
        isOpen={isConvertModalOpen}
        trackCount={selectedCount}
        onClose={() => setIsConvertModalOpen(false)}
        onSubmit={handleConvertSelected}
      />
      <EditTrackModal
        isOpen={isEditModalOpen}
        track={editingTrack}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditError(null);
        }}
        onSubmit={handleUpdateTrack}
        isLoading={isEditLoading}
        error={editError}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        export={currentExport}
        playlistTitle="My Set"
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

export function Home() {
  return (
    <PlaylistProvider>
      <HomeContent />
    </PlaylistProvider>
  );
}
