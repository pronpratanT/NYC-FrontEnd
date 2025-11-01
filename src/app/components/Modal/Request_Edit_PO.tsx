import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../ThemeProvider';
import { HiOutlinePencilSquare, HiXMark, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { BiMessageEdit } from 'react-icons/bi';

interface RequestEditPOModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (detail: string) => void;
}

const RequestEditPOModal: React.FC<RequestEditPOModalProps> = ({ open, onClose, onSubmit }) => {
  const { isDarkMode } = useTheme();
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim()) {
      setError('กรุณากรอกรายละเอียด');
      return;
    }
    // try {
    //   const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/reject-pcl?pclId=${compareData?.pcl_id}&reason=${encodeURIComponent(detail)}`, {
    //     method: 'PUT',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${token}`
    //     }
    //   });
    //   if (!res.ok) {
    //     const data = await res.json().catch(() => ({}));
    //     throw new Error(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
    //   }
    //   alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    //   setShowRejectModal(false);
    //   setRejectReason("");
    //   if (onSuccess) await onSuccess();
    //   router.refresh();
    //   if (onClose) onClose();
    // } catch (err) {
    //   alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    //   console.error(err);
    // }
    setError('');
    onSubmit(detail);
    setDetail('');
  };

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[10000] backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-black/70' : 'bg-black/40'}`} onClick={onClose}>
      <div className="flex items-center justify-center min-h-full p-4">
        <div
          ref={modalRef}
          className={`relative w-full max-w-lg mx-4 transform transition-all duration-300 scale-100 ${isDarkMode
            ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900'
            : 'bg-gradient-to-br from-white via-white to-gray-50'
            } rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'
            }`}
        >
          {/* Header Section with Gradient */}
          <div className={`relative px-6 pt-6 pb-4 ${isDarkMode
            ? 'bg-gradient-to-r from-amber-900/20 via-orange-900/20 to-red-900/20'
            : 'bg-gradient-to-r from-amber-50 via-orange-50 to-red-50'
            }`}>
            {/* Close Button */}
            <button
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${isDarkMode
                ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-700/50'
                : 'text-gray-400 hover:text-red-500 hover:bg-white/80'
                } focus:outline-none focus:ring-2 focus:ring-rose-400/60`}
              onClick={onClose}
              aria-label="ปิด"
            >
              <HiXMark className="h-5 w-5" />
            </button>

            {/* Header Content */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode
                ? 'bg-gradient-to-br from-amber-600 to-orange-600'
                : 'bg-gradient-to-br from-amber-500 to-orange-500'
                } shadow-lg`}>
                <HiOutlinePencilSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-800'
                  }`}>
                  ร้องขอการแก้ไข
                </h2>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                  รายละเอียด Purchase Order
                </p>
              </div>
            </div>
          </div>
          {/* Form Section */}
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Input Label with Icon */}
                <div className="flex items-center gap-2 mb-3">
                  <BiMessageEdit className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'
                    }`} />
                  <label className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                    รายละเอียดคำร้องขอ
                  </label>
                </div>

                {/* Textarea with Enhanced Design */}
                <div className="relative">
                  <textarea
                    className={`w-full rounded-xl border-2 p-4 min-h-[120px] resize-vertical transition-all duration-200 focus:ring-2 focus:outline-none ${isDarkMode
                      ? 'border-slate-600 bg-slate-900/50 text-slate-100 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder-slate-400'
                      : 'border-gray-200 bg-gray-50/50 text-gray-800 focus:ring-amber-400/50 focus:border-amber-400/50 placeholder-gray-500'
                      } backdrop-blur-sm`}
                    value={detail}
                    onChange={e => setDetail(e.target.value)}
                    placeholder="โปรดระบุรายละเอียดคำร้องขอที่ต้องการแก้ไข..."
                    required
                  />
                  {/* Character Counter */}
                  <div className={`absolute bottom-2 right-3 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'
                    }`}>
                    {detail.length} ตัวอักษร
                  </div>
                </div>

                {/* Error Message with Icon */}
                {error && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${isDarkMode
                    ? 'bg-red-900/20 border border-red-800/30 text-rose-300'
                    : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                    <HiOutlineExclamationTriangle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}
              </div>
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-2 pt-4">
                <button
                  type="button"
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 focus:ring-slate-500/40 border border-slate-600/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400/60 border border-gray-200'
                    } hover:scale-105`}
                  onClick={onClose}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-xl font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all duration-200 hover:scale-105 ${isDarkMode
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    }`}
                >
                  ส่งคำร้องขอ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestEditPOModal;
