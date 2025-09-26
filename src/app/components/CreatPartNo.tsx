import React, { useState } from "react";
import { useToken } from "../context/TokenContext";

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

  // validation: ทุกช่องต้องไม่ว่าง
  const isValid = productCode.trim() && productDetail.trim() && partNo.trim() && partName.trim();

  const handlerConfirm = async () => {
    const body = {
      prod_code: productCode,
      prod_detail: productDetail,
      part_no: partNo,
      part_name: partName
    };
    console.log("Token: ", token);
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
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => {
        // ถ้ากดที่พื้นหลัง (target === currentTarget) ให้ปิด modal
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md mx-auto border border-green-200 dark:border-slate-700 flex flex-col gap-6"
        onClick={e => e.stopPropagation()} // ป้องกัน modal ถูกปิดเมื่อกดใน modal
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-emerald-900/30">
            <svg className="w-6 h-6 text-green-500 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h2m4 4v2a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4h2a4 4 0 014 4v2" /></svg>
          </span>
          <h2 className="text-xl font-bold text-green-700 dark:text-emerald-400">สร้าง Part No.</h2>
        </div>
        <form className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Product Code</label>
            <input
              type="text"
              className="w-full border-0 border-b border-green-300 dark:border-slate-600 bg-transparent px-0 py-1 focus:outline-none focus:border-green-500 dark:focus:border-emerald-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
              value={productCode}
              onChange={e => setProductCode(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 mt-2 text-gray-500 dark:text-slate-400">Product Detail</label>
            <input
              type="text"
              className="w-full border-0 border-b border-green-300 dark:border-slate-600 bg-transparent px-0 py-1 focus:outline-none focus:border-green-500 dark:focus:border-emerald-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
              value={productDetail}
              onChange={e => setProductDetail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 mt-2 text-gray-500 dark:text-slate-400">Part No.</label>
            <input
              type="text"
              className="w-full border-0 border-b border-green-300 dark:border-slate-600 bg-transparent px-0 py-1 focus:outline-none focus:border-green-500 dark:focus:border-emerald-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
              value={partNo}
              onChange={e => setPartNo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 mt-2 text-gray-500 dark:text-slate-400">Part Name</label>
            <input
              type="text"
              className="w-full border-0 border-b border-green-300 dark:border-slate-600 bg-transparent px-0 py-1 focus:outline-none focus:border-green-500 dark:focus:border-emerald-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
              value={partName}
              onChange={e => setPartName(e.target.value)}
            />
          </div>
        </form>
        <div className="flex gap-2 justify-center mt-2">
          <button
            type="button"
            className="px-5 py-1 rounded-lg font-semibold bg-green-500 hover:bg-green-600 text-white transition-all duration-150 text-sm shadow-none"
            onClick={handlerConfirm}
            disabled={!isValid}
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatPartNo;