import React, { useState } from "react";

interface ApprovePOModalProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (reason: string) => void;
	poNo: string | null;
}

const ApprovePOModal: React.FC<ApprovePOModalProps> = ({ open, onClose, onConfirm, poNo }) => {
	const [reason, setReason] = useState("");
	const [error, setError] = useState("");

	const handleConfirm = () => {
		// if (!reason.trim()) {
		// 	setError("กรุณากรอกเหตุผลก่อนอนุมัติ");
		// 	return;
		// }
		onConfirm(reason);
		setReason("");
		setError("");
		onClose();
	};

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
			onClick={onClose}
			aria-modal="true"
			role="dialog"
		>
			<div
				className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-md p-6 relative"
				onClick={e => e.stopPropagation()}
			>
				<h2 className="text-xl font-bold mb-4 text-green-700 dark:text-green-300">อนุมัติ PO #{poNo}</h2>
				
				<label className="block mb-2 text-sm font-medium text-gray-700 dark:text-slate-200">กรุณากรอกเหตุผลในการอนุมัติ</label>
				<textarea
					className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-400 dark:bg-slate-900 dark:text-slate-100"
					rows={3}
					value={reason}
					onChange={e => { setReason(e.target.value); if (error) setError(""); }}
					placeholder="ระบุเหตุผล..."
				/>
                {/* {error && (
					<div className="text-red-600 dark:text-red-300 text-sm mb-3 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800/50">
						{error}
					</div>
				)} */}
				<div className="flex justify-end gap-3 mt-6">
					{/* <button
						className="px-5 py-2 rounded-lg font-semibold bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600"
						onClick={onClose}
					>
						ยกเลิก
					</button> */}
					<button
						className="px-5 py-2 rounded-lg font-semibold bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600"
						onClick={handleConfirm}
					>
						✔ อนุมัติ
					</button>
				</div>
			</div>
		</div>
	);
};

export default ApprovePOModal;
