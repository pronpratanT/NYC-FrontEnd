import React, { useState } from "react";
import { useToken } from "../../context/TokenContext";
import { useTheme } from "../ThemeProvider";

interface CreatPartNoProps {
  onConfirm?: (data: { partNo: string; partName: string; productCode: string; productDetail: string }) => void;
  onCancel?: () => void;
}

const CreatPartNo: React.FC<CreatPartNoProps> = ({ onConfirm, onCancel }) => {
  // state สำหรับแต่ละช่อง
  const [productCode, setProductCode] = useState("");
  const [productDetail, setProductDetail] = useState("");
  const [partNo, setPartNo] = useState("");
  const [partName, setPartName] = useState("");
  const token = useToken();
  const { isDarkMode } = useTheme();

  // validation: ทุกช่องต้องไม่ว่าง
  const isValid = partNo.trim() && partName.trim();

  const handlerConfirm = async () => {
    const body = {
      prod_code: productCode,
      prod_detail: productDetail,
      part_no: partNo,
      part_name: partName
    };
    // console.log("Token: ", token);
    console.log("Submitting data:", body);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/inventory/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(body)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const result = await response.json();
      console.log('Response data:', result);
      
      // ตรวจสอบทั้ง response.ok และ result.success หรือ result.status
      if (response.ok || result.success || result.status === 'success') {
        if (onConfirm) onConfirm({ partNo, partName, productCode, productDetail });
        alert('สร้าง Part No. สำเร็จ');
        if (onCancel) onCancel();
      } else {
        throw new Error(result.message || 'Failed to add inventory');
      }
    } catch (err: unknown) {
      console.error('Error:', err);
      const message = err instanceof Error ? err.message : String(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + message);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center backdrop-blur-md transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/70' : 'bg-black/30'}`}
      onClick={e => {
        // ถ้ากดที่พื้นหลัง (target === currentTarget) ให้ปิด modal
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
    >
      <div
        className={`relative rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform transition-all duration-300 ${isDarkMode ? 'bg-slate-800/95 border border-slate-700' : 'bg-white/95 border border-emerald-200'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={`relative px-8 pt-8 pb-6 ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/40 to-slate-800' : 'bg-gradient-to-br from-emerald-50 to-white'}`}>
          <button
            onClick={onCancel}
            className={`absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-500'}`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>สร้าง Part No.</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>กรอกข้อมูลเพื่อเพิ่ม Part ใหม่</p>
            </div>
          </div>
        </div>
        {/* Form Content */}
        <form className="px-8 py-6 space-y-5">
          <div className="group">
            <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Product Code
            </label>
            <div className="relative">
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-700' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                placeholder="กรอก Product Code"
                value={productCode}
                onChange={e => setProductCode(e.target.value)}
              />
            </div>
          </div>
          <div className="group">
            <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Product Detail
            </label>
            <div className="relative">
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-700' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                placeholder="กรอก Product Detail"
                value={productDetail}
                onChange={e => setProductDetail(e.target.value)}
              />
            </div>
          </div>
          <div className="group">
            <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Part No.
            </label>
            <div className="relative">
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-700' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                placeholder="กรอก Part No."
                value={partNo}
                onChange={e => setPartNo(e.target.value)}
              />
            </div>
          </div>
          <div className="group">
            <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Part Name
            </label>
            <div className="relative">
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-700' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                placeholder="กรอก Part Name"
                value={partName}
                onChange={e => setPartName(e.target.value)}
              />
            </div>
          </div>
        </form>
        {/* Footer Actions */}
        <div className={`px-8 py-6 border-t ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 shadow-lg ${!isValid ? 'opacity-50 cursor-not-allowed bg-gray-400' : isDarkMode ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-500/30' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 shadow-emerald-500/50'} hover:shadow-xl transform hover:scale-[1.02]`}
              onClick={handlerConfirm}
              disabled={!isValid}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                บันทึก
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatPartNo;