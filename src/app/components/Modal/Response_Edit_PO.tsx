import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../ThemeProvider';
import { HiOutlinePencilSquare, HiXMark, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { BiMessageEdit } from 'react-icons/bi';
import { useToken } from '@/app/context/TokenContext';

interface ResponseEditPOModalProps {
  open: boolean;
  onClose: () => void;
  // Removed unused onSubmit prop to resolve ESLint warning
  poNo?: string;
}

type ReviewedPO = {
  po_id: number;
  po_no: string;
  po_date: string;
  dept_request: string;
  delivery_place: string;
  delivery_date: string;
  mail_out_date: string;
  sub_total: number;
  ext_discount: number;
  vat: number;
  total_minus_discount: number;
  total: number;
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  tax_id: string;
  tel_no: string;
  fax_no: string;
  credit_term: string;
  contact_name: string;
  email: string;
  remark: string;
  issued_by: string;
  approved_by: string;
  rejected_by: string;
  edit_reason: string;
  po_lists: POList[];
  pcl_id?: number;
};

type POList = {
  po_list_id: number;
  part_no: string;
  part_name: string;
  prod_code: string;
  pr_no: string;
  qty: number;
  unit: string;
  unit_price: number;
  discount: [];
  cal_discount: number;
  amount: number;
  deli_date: string;
  free_item: FreeItems[];
  req: boolean;
  pcl_id?: number;
}

type FreeItems = {
  po_list_id: number;
  part_no: string;
  part_name?: string;
  prod_code?: string;
  qty: number;
  remark: string;
}

const ResponseEditPOModal: React.FC<ResponseEditPOModalProps> = ({ open, onClose, poNo }) => {
  const { isDarkMode } = useTheme();
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [reason, setReason] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);
  const token = useToken();
  const [poData, setPoData] = useState<ReviewedPO | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!poNo) {
      setError("ไม่พบ PO ID");
      return;
    }
    try {
      setError("");
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/doc?poNo=${poNo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("โหลดข้อมูล PO ไม่สำเร็จ");
      const data = await response.json();
      if (data.poDoc) {
        const poInfo = data.poDoc;
        if (!poInfo.po_lists) {
          poInfo.po_lists = [];
        }
        setPoData(poInfo);
      } else {
        setError("ไม่พบข้อมูล PO ใน response");
      }
    } catch {
      setError("เกิดข้อผิดพลาด");
    }
  }, [poNo, token]);

  useEffect(() => {
    if (open && poNo) {
      fetchData();
    }
  }, [open, poNo, token, fetchData]);

  const handleSelect = (pcl_id: number) => {
    setSelectedItems(prev =>
      prev.includes(pcl_id) ? prev.filter(id => id !== pcl_id) : [...prev, pcl_id]
    );
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!selectedItems.length) {
    //   setError('กรุณาเลือกรายการที่ต้องการร้องขอและระบุเหตุผล');
    //   return;
    // }
    // for (const pcl_id of selectedItems) {
    //   const reason = reasons[pcl_id];
    //   if (!reason || !reason.trim()) {
    //     setError('กรุณาระบุเหตุผลให้ครบทุกอัน');
    //     return;
    //   }
    // }
    setError('');
    try {
      // เตรียม payload สำหรับส่งข้อมูล
      const payload = {
        po_id: poData?.po_id || null,
        po_list_id: selectedItems,
        note: reason,
      };
      // console.log('Payload for request edit PO:', payload);
      await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/edited-res`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // เรียก reject-pcl ทีละอัน
    //   for (const pclId of selectedItems) {
    //     try {
    //       const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/reject-pcl?pclId=${pclId}&reason=${encodeURIComponent(reason)}`, {
    //         method: 'PUT',
    //         headers: {
    //           'Content-Type': 'application/json',
    //           Authorization: `Bearer ${token}`
    //         }
    //       });
    //       if (!res.ok) {
    //         const data = await res.json().catch(() => ({}));
    //         throw new Error(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
    //       }
    //     } catch (err) {
    //       alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    //       console.error(err);
    //     }
    //   }

      alert('อนุมัติคำร้องเรียบร้อยแล้ว');
      if (onClose) onClose();
      setSelectedItems([]);
      setReason('');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
      console.error(err);
    }
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-black/70' : 'bg-black/40'}`}
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-full p-4">
        <div
          ref={modalRef}
          className={`relative w-full max-w-lg mx-4 transform transition-all duration-300 scale-100 ${isDarkMode
            ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900'
            : 'bg-gradient-to-br from-white via-white to-gray-50'
            } rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'
            }`}
          onClick={e => e.stopPropagation()}
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
                  อนุมัติการแก้ไข
                </h2>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                  รายการสินค้าใน PO
                </p>
              </div>
            </div>
          </div>
          {/* Form Section */}
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {poData && poData.po_lists && poData.po_lists.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BiMessageEdit className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                      <label className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                        เลือกรายการที่ต้องการอนุมัติการแก้ไข
                      </label>
                    </div>

                    <div className="relative">
                      <div className={`w-full rounded-xl border-2 ${isDarkMode
                        ? 'border-slate-600 bg-slate-900/50'
                        : 'border-gray-200 bg-gray-50/50'
                        } backdrop-blur-sm max-h-48 overflow-y-auto`}>

                        <div className={`sticky top-0 p-3 border-b ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-gray-100'}`}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-amber-600 rounded focus:ring-amber-500"
                              checked={selectedItems.length === poData.po_lists.filter(item => item.req === true && typeof item.po_list_id === 'number').length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Select all
                                  const allPoListIds = poData.po_lists
                                    .filter(item => item.req === true && typeof item.po_list_id === 'number')
                                    .map(item => item.po_list_id!);
                                  setSelectedItems(allPoListIds);
                                } else {
                                  // Deselect all
                                  setSelectedItems([]);
                                }
                              }}
                            />
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                              เลือกทั้งหมด ({poData.po_lists.filter(item => item.req === true).length} รายการ)
                            </span>
                          </label>
                        </div>

                        <div className="p-2">
                          {poData.po_lists
                            .filter(item => item.req === true)
                            .map((item, index) => (
                              <label
                                key={item.pcl_id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isDarkMode
                                  ? 'hover:bg-slate-700/50'
                                  : 'hover:bg-gray-100'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                                  checked={selectedItems.includes(item.po_list_id!)}
                                  onChange={() => handleSelect(item.po_list_id!)}
                                />
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-amber-500 text-white'
                                    }`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`font-semibold text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                      {item.part_no}
                                    </span>
                                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                      |
                                    </span>
                                    <span className={`text-xs truncate ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                      {item.part_name}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    </div>

                    {selectedItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <BiMessageEdit className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                          <label className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                            Note เพิ่มเติม (สำหรับทั้งหมด {selectedItems.length} รายการ)
                          </label>
                        </div>
                        <textarea
                          className={`w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:outline-none resize-none ${isDarkMode
                            ? 'border-slate-600 bg-slate-900/50 text-slate-100 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder-slate-400'
                            : 'border-gray-200 bg-white text-gray-800 focus:ring-amber-400/50 focus:border-amber-400/50 placeholder-gray-500'
                            }`}
                          rows={4}
                          placeholder="ระบุเหตุผลในการขอแก้ไขรายการที่เลือก..."
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                        />
                      </div>
                    )}
                    {/* <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <BiMessageEdit className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                        <label className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                          เหตุผลในการขอแก้ไข
                        </label>
                      </div>
                      <textarea
                        className={`w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:outline-none resize-none ${isDarkMode
                          ? 'border-slate-600 bg-slate-900/50 text-slate-100 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder-slate-400'
                          : 'border-gray-200 bg-white text-gray-800 focus:ring-amber-400/50 focus:border-amber-400/50 placeholder-gray-500'
                          }`}
                        rows={4}
                        placeholder="ระบุเหตุผลในการขอแก้ไขรายการที่เลือก..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                      />
                    </div> */}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">ไม่พบรายการสินค้าใน PO</div>
                )}

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
                  อนุมัติการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseEditPOModal;
