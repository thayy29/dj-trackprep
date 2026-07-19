import { useEffect, useState } from "react";
import { Export } from "../../types/index.js";
import { IoCheckmarkCircle, IoAlertCircle, IoDownload } from "react-icons/io5";

interface ExportModalProps {
  isOpen: boolean;
  export: Export | null;
  playlistTitle: string;
  onClose: () => void;
}

export function ExportModal({
  isOpen,
  export: exportJob,
  playlistTitle,
  onClose,
}: ExportModalProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Aguardando processamento...";
      case "processing":
        return "Processando...";
      case "completed":
        return "Concluído!";
      case "error":
        return "Erro na conversão";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-action-primary";
      case "error":
        return "text-action-danger";
      case "processing":
        return "text-action-secondary";
      default:
        return "text-text-medium";
    }
  };

  if (!isOpen || !exportJob) return null;

  const isComplete = exportJob.status === "completed" || exportJob.status === "error";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background-surface rounded-xl p-8 max-w-md w-full mx-4 border border-border-light">
        <h2 className="text-xl font-semibold mb-2">Exportando set</h2>
        <p className="text-sm text-text-medium mb-6">{playlistTitle}</p>

        <div className="space-y-4 mb-6">
          <div className="bg-background-elevated/30 rounded-lg p-4 border border-border-light/20">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${getStatusColor(exportJob.status)}`}>
                {getStatusLabel(exportJob.status)}
              </span>
            </div>

            {exportJob.status === "processing" && (
              <div className="h-2 bg-border-light rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-action-secondary animate-pulse" />
              </div>
            )}

            {exportJob.status === "completed" && (
              <div className="flex items-center gap-2">
                <IoCheckmarkCircle className="w-5 h-5 text-action-primary" />
                <span className="text-sm text-action-primary font-medium">
                  Pronto para download
                </span>
              </div>
            )}

            {exportJob.status === "error" && (
              <div className="flex items-center gap-2">
                <IoAlertCircle className="w-5 h-5 text-action-danger" />
                <span className="text-sm text-action-danger">
                  Falha na conversão
                </span>
              </div>
            )}
          </div>

          {exportJob.output_path && (
            <a
              href={exportJob.output_path}
              download
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-action-primary text-black text-center rounded-lg text-sm font-semibold hover:bg-action-primaryHover transition-colors"
            >
              <IoDownload className="w-4 h-4" />
              Baixar
            </a>
          )}
        </div>

        <button
          onClick={onClose}
          disabled={!isComplete}
          className="w-full py-2.5 px-4 border border-border-light rounded-lg text-sm font-medium hover:border-text-medium disabled:opacity-50"
        >
          {isComplete ? "Fechar" : "Processando..."}
        </button>
      </div>
    </div>
  );
}
