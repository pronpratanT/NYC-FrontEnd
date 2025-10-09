import React, { useState, useEffect } from "react";
import { useToken } from "../../context/TokenContext";

export type POData = {
    po_no: string;
    po_date: string;
    vendor_name: string;
    vendor_code: string;
    dept_request: string;
    delivery_place: string;
    delivery_date: string;
    approved_by: string;
    issued_by: string;
    po_lists: Array<{
        part_no: string;
        part_name: string;
        qty: number;
        unit: string;
        unit_price: number;
        discount: number;
        amount: number;
    }>;
};

interface PDF_POProps {
    po_no: string;
}

const PDF_PO: React.FC<PDF_POProps> = ({ po_no }) => {
    const [poData, setPoData] = useState<POData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const token = useToken();

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/doc?poNo=${po_no}`, {
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch PO data');
        } finally {
            setLoading(false);
        }
    }, [po_no, token]);

    useEffect(() => {
        if (po_no) {
            fetchData();
        }
    }, [po_no, fetchData]);

        const handleExportPDF = async () => {
        if (!poData) return;

        // Dynamic import jsPDF and plugin
        const jsPDFModule = await import('jspdf');
        const jsPDF = jsPDFModule.default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`ใบสั่งซื้อ (PO) #${poData.po_no}`, 14, 18);
        doc.setFontSize(12);
        doc.text(`วันที่: ${poData.po_date}`, 14, 28);
        doc.text(`ผู้ขาย: ${poData.vendor_code} ${poData.vendor_name}`, 14, 36);
        doc.text(`แผนกผู้ขอ: ${poData.dept_request}`, 14, 44);
        doc.text(`สถานที่จัดส่ง: ${poData.delivery_place}`, 14, 52);
        doc.text(`วันที่จัดส่ง: ${poData.delivery_date}`, 14, 60);
        doc.text(`ผู้จัดทำ: ${poData.issued_by || '-'}`, 14, 68);
        doc.text(`ผู้อนุมัติ: ${poData.approved_by || '-'}`, 14, 76);

        // Table
        const tableColumn = [
            "Part No.",
            "Part Name",
            "Qty",
            "Unit",
            "Unit Price",
            "Discount",
            "Amount",
        ];
        const tableRows = poData.po_lists.map((item: {
            part_no: string;
            part_name: string;
            qty: number;
            unit: string;
            unit_price: number;
            discount: number;
            amount: number;
        }) => [
            item.part_no,
            item.part_name,
            item.qty,
            item.unit,
            item.unit_price.toLocaleString(),
            item.discount + "%",
            item.amount.toLocaleString(),
        ]);
        // Use autoTable from plugin
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 84,
            styles: { font: "THSarabun", fontSize: 10 },
        });

        doc.save(`PO_${poData.po_no}.pdf`);
        };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mr-3"></div>
                <span className="text-gray-600">Loading PO data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">Error: {error}</p>
                <button
                    onClick={fetchData}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {poData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">PO Details:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>PO No:</strong> {poData.po_no}</p>
                        <p><strong>Date:</strong> {poData.po_date}</p>
                        <p><strong>Vendor:</strong> {poData.vendor_name}</p>
                        <p><strong>Department:</strong> {poData.dept_request}</p>
                    </div>
                </div>
            )}
            <button
                type="button"
                className="w-full px-4 py-2 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition disabled:opacity-50"
                onClick={handleExportPDF}
                disabled={!poData}
            >
                ดาวน์โหลด PDF
            </button>
        </div>
    );
};

export default PDF_PO;
