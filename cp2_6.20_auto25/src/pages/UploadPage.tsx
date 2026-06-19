import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Send } from "lucide-react";
import DropzoneUploader from "@/components/DropzoneUploader";
import ProgressBar from "@/components/ProgressBar";
import { uploadWork } from "@/api/client";
import { useWorkStore } from "@/stores/useWorkStore";

export default function UploadPage() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    uploader: "",
    email: "",
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileAccepted = async (files: File[]) => {
    const file = files[0];
    if (!formData.title.trim()) {
      setError("请填写作品标题");
      return;
    }
    if (!formData.uploader.trim()) {
      setError("请填写上传者姓名");
      return;
    }
    if (!formData.email.trim()) {
      setError("请填写联系邮箱");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("uploader", formData.uploader);
    data.append("email", formData.email);
    data.append("file", file);

    try {
      await uploadWork(data, (p: number) => setProgress(p));
      setUploadSuccess(true);
      setShowSuccessMessage(true);
      useWorkStore.getState().refresh();

      setTimeout(() => {
        setShowSuccessMessage(false);
        setUploading(false);
        setProgress(0);
        setFormData({ title: "", uploader: "", email: "" });
      }, 2200);

      setTimeout(() => navigate("/"), 2800);
    } catch (err: any) {
      setError(err?.message || "上传失败，请重试");
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-xl rounded-2xl bg-surface-light p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          上传作品
        </h1>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">作品标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-indigo focus:outline-none"
              placeholder="请输入作品标题"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">上传者姓名</label>
            <input
              type="text"
              value={formData.uploader}
              onChange={(e) => updateField("uploader", e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-indigo focus:outline-none"
              placeholder="请输入您的姓名"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">联系邮箱</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-indigo focus:outline-none"
              placeholder="请输入联系邮箱"
              disabled={uploading}
            />
          </div>

          <DropzoneUploader
            onFilesAccepted={handleFileAccepted}
            disabled={uploading}
          />

          {(uploading || uploadSuccess) && (
            <div className="space-y-2">
              <ProgressBar progress={progress} visible={!showSuccessMessage || progress >= 100} />
              {uploading && !uploadSuccess && (
                <p className="text-center text-sm text-gray-400">
                  上传中... {Math.min(progress, 100)}%
                </p>
              )}
            </div>
          )}

          {showSuccessMessage && (
            <div className="flex items-center justify-center gap-2 text-green-400 animate-pulse py-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">上传成功！即将跳转至展示墙...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              const input = document.querySelector(
                'input[type="file"]'
              ) as HTMLInputElement;
              input?.click();
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white transition-all duration-300 ${
              showSuccessMessage
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showSuccessMessage ? (
              <><CheckCircle className="h-4 w-4" /> 上传成功</>
            ) : uploading ? (
              <><span className="animate-pulse">上传中...</span></>
            ) : (
              <><Send className="h-4 w-4" /> 提交上传</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
