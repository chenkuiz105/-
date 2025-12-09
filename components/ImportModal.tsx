import React, { useRef, useState } from 'react';
import { Upload, X, FileText, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { parseScheduleFile } from '../services/geminiService';
import { CalendarEvent } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (events: CalendarEvent[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv'];
    if (validTypes.includes(file.type)) {
      setFile(file);
      setError(null);
    } else {
      setError("請上傳 PDF, CSV (Excel 匯出), 或圖片檔案。");
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const result = await parseScheduleFile(base64String, file.type);
          onImportComplete(result.events);
          onClose();
        } catch (err) {
            console.error(err);
          setError("文件解析失敗，請檢查文件格式或重試。");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("讀取文件時出錯。");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-sprite-50 to-white">
          <div>
            <h3 className="text-xl font-bold text-slate-800">匯入日程</h3>
            <p className="text-xs text-slate-500 mt-1">上傳 PDF 教學大綱、排班表或 Excel (CSV) 匯出檔案。</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
              ${isDragging ? 'border-sprite-500 bg-sprite-50 scale-[1.02]' : 'border-slate-300 hover:border-sprite-400 hover:bg-slate-50'}
              ${file ? 'bg-sprite-50 border-sprite-500' : ''}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.csv,.png,.jpg,.jpeg"
              onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
            />
            
            {file ? (
              <div className="animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-4">
                    {file.type.includes('pdf') ? (
                        <FileText size={32} className="text-red-500" />
                    ) : (
                        <FileSpreadsheet size={32} className="text-green-500" />
                    )}
                </div>
                <p className="font-semibold text-slate-800">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-4 text-xs text-red-500 hover:underline"
                >
                  移除檔案
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-sprite-100 text-sprite-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Upload size={32} />
                </div>
                <h4 className="text-lg font-medium text-slate-700">點擊上傳 或 拖曳檔案至此</h4>
                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                  支援 PDF, CSV, PNG, JPG。我們使用 Gemini 2.5 AI 智能提取事件。
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
             <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleProcess}
              disabled={!file || loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-sprite-600 hover:bg-sprite-700 active:bg-sprite-800 rounded-lg shadow-lg shadow-sprite-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  處理中...
                </>
              ) : (
                "匯入事件"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;