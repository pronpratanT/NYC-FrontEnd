import React, { useState } from "react";

interface CreatPartNoProps {
  partNo?: string;
  pclId?: string;
  onConfirm?: (data: { partNo: string; pclId: string }) => void;
  onCancel?: () => void;
}

const CreatPartNo: React.FC<CreatPartNoProps> = ({ partNo = "", pclId = "", onConfirm, onCancel }) => {
  const [inputPartNo, setInputPartNo] = useState(partNo);
  const [inputPclId, setInputPclId] = useState(pclId);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 w-full max-w-sm mx-auto border border-green-200 dark:border-slate-700">
        <h2 className="text-lg font-bold mb-4 text-green-700 dark:text-emerald-400">สร้าง Part No.</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Product Code</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
            value={inputPartNo}
            onChange={e => setInputPartNo(e.target.value)}
            placeholder="กรอก Product Code"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Product Detail</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
            value={inputPartNo}
            onChange={e => setInputPartNo(e.target.value)}
            placeholder="กรอก Product Detail"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Part No.</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
            value={inputPartNo}
            onChange={e => setInputPartNo(e.target.value)}
            placeholder="กรอก Part No."
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Part Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
            value={inputPclId}
            onChange={e => setInputPclId(e.target.value)}
            placeholder="กรอก Part Name"
          />
        </div>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            className="px-4 py-2 rounded-lg font-bold shadow bg-green-500 hover:bg-green-600 text-white transition-all duration-150"
            onClick={() => {
              if (onConfirm) onConfirm({ partNo: inputPartNo, pclId: inputPclId });
            }}
            disabled={!inputPartNo || !inputPclId}
          >บันทึก</button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg font-bold shadow bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all duration-150"
            onClick={onCancel}
          >ยกเลิก</button>
        </div>
      </div>
    </div>
  );
};

export default CreatPartNo;