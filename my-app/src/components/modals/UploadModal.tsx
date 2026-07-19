import { IoCloudUpload, IoAlertCircle } from "react-icons/io5";

interface UploadModalProps {
  isOpen: boolean;
  uploadedFiles: { name: string; progress: number }[];
  error?: string | null;
  onClose: () => void;
}

export function UploadModal({ isOpen, uploadedFiles, error, onClose }: UploadModalProps) {
  if (!isOpen) return null;

  const allComplete = uploadedFiles.every((f) => f.progress === 100);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background-surface rounded-xl p-8 max-w-md w-full mx-4 border border-border-light">
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              error ? "bg-action-danger/20" : "bg-action-primary/20"
            }`}
          >
            {error ? (
              <IoAlertCircle className="w-5 h-5 text-action-danger" />
            ) : (
              <IoCloudUpload className="w-5 h-5 text-action-primary" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {error ? "Falha ao enviar" : "Carregando músicas"}
            </h2>
            <p className="text-sm text-text-low">
              {uploadedFiles.length} arquivo{uploadedFiles.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-6 p-3 rounded-lg bg-action-danger/10 border border-action-danger/30 text-sm text-action-danger">
            {error}
            <div className="mt-2 text-xs text-text-medium">
              Verifique se o servidor backend está rodando em{" "}
              <code className="px-1 py-0.5 rounded bg-background-elevated">http://localhost:3000</code>.
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6 max-h-48 overflow-y-auto">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="bg-background-elevated/30 rounded-lg p-4 border border-border-light/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-text-low">{Math.round(file.progress)}%</span>
                </div>
                <div className="h-1.5 bg-background-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-action-primary to-action-secondary transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {error || allComplete ? (
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-action-primary text-black font-semibold rounded-lg hover:bg-action-primaryHover transition-colors"
          >
            Fechar
          </button>
        ) : (
          <div className="text-center text-sm text-text-medium">
            Processando arquivos...
          </div>
        )}
      </div>
    </div>
  );
}
