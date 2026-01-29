"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { agent: string; summary: string; fullText?: string }) => void;
  projectId: number;
}

const AGENT_OPTIONS = [
  "Antigravity",
  "Cursor",
  "Claude",
  "ChatGPT",
  "GitHub Copilot",
  "その他"
];

export default function ConversationModal({ isOpen, onClose, onSave }: ConversationModalProps) {
  const [agent, setAgent] = useState("Antigravity");
  const [summary, setSummary] = useState("");
  const [fullText, setFullText] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!summary.trim()) {
      alert("要約を入力してください");
      return;
    }

    onSave({
      agent,
      summary: summary.trim(),
      fullText: fullText.trim() || undefined
    });

    // Reset form
    setAgent("Antigravity");
    setSummary("");
    setFullText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-(--background) border border-(--border-color) rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border-color)">
          <h2 className="text-lg font-semibold text-(--foreground)">会話を記録</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-(--hover-bg) rounded transition-colors"
          >
            <X className="w-5 h-5 text-(--foreground)" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-(--foreground) mb-2">
              エージェント
            </label>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="w-full px-3 py-2 bg-(--background) border border-(--border-color) rounded-md text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--theme-primary)"
            >
              {AGENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-(--foreground) mb-2">
              要約 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="会話の要約を入力してください..."
              rows={4}
              className="w-full px-3 py-2 bg-(--background) border border-(--border-color) rounded-md text-(--foreground) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--theme-primary) resize-none"
            />
          </div>

          {/* Full Text (Optional) */}
          <div>
            <label className="block text-sm font-medium text-(--foreground) mb-2">
              詳細（オプション）
            </label>
            <textarea
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="会話の詳細や全文を入力できます（任意）..."
              rows={6}
              className="w-full px-3 py-2 bg-(--background) border border-(--border-color) rounded-md text-(--foreground) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--theme-primary) resize-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-(--border-color)">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-(--foreground) hover:bg-(--hover-bg) rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-(--theme-primary) text-white rounded-md hover:opacity-90 transition-opacity"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
