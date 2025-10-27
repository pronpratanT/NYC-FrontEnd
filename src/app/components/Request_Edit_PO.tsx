import React, { useState } from 'react';

interface RequestEditPOModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (detail: string) => void;
}

const RequestEditPOModal: React.FC<RequestEditPOModalProps> = ({ open, onClose, onSubmit }) => {
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim()) {
      setError('กรุณากรอกรายละเอียด');
      return;
    }
    setError('');
    onSubmit(detail);
    setDetail('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="ปิด"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-slate-100">ร้องขอการแก้ไขรายละเอียด PO</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            รายละเอียดคำร้องขอ
            <textarea
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 p-2 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 min-h-[80px] resize-vertical"
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="โปรดระบุรายละเอียดที่ต้องการให้แก้ไข..."
              required
            />
          </label>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600"
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 focus:outline-none"
            >
              ส่งคำร้องขอ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestEditPOModal;
