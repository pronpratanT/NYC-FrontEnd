import React, { useEffect, useState } from 'react';

import { useToken } from '../../context/TokenContext';

type Data = {
    id: number;
    group_name: string;
    pr_id: number;
    note: string;
    list: List[];
}

type List = {
    id: number;
    member_id: number;
    pcl_id: number;
    part_no: string;
    prod_code: string;
    part_name: string;
    objective: string;
    qty: number;
    unit: string;
    vendor: string;
    stock: number;
    price_per_unit: number;
    plant: string;
    status: string;
}

interface GroupPRModalProps {
    open: boolean;
    onClose: () => void;
    pr_id?: string | null;
}

const GroupPRModal: React.FC<GroupPRModalProps> = ({ open, onClose, pr_id }) => {
    const [data, setData] = useState<Data[]>([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const token = useToken();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch groups");
                const result = await response.json();
                console.log("Fetched groups data:", result);
                // ปรับให้รองรับโครงสร้างข้อมูลที่แตกต่างกัน
                setData(result.data || result.groups || result || []);
            } catch (error) {
                setError("Error fetching groups");
                console.error("Error fetching groups:", error);
            } finally {
                setLoading(false);
            }
        };
        if (open && pr_id && token) fetchData();
    }, [open, pr_id, token]);


    const handleAddGroup = async () => {
        if (!newGroupName.trim() || !pr_id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    group_name: newGroupName.trim(), 
                    pr_id: parseInt(pr_id) 
                })
            });
            if (!response.ok) throw new Error("Failed to create group");
            setNewGroupName('');
            
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
        } catch (error) {
            setError("Error creating group");
            console.error("Error creating group:", error);
        } finally {
            setLoading(false);
        }
    };

    // แยกข้อมูล Ungrouped กับ Groups อื่นๆ
    const ungroupedData = data.find(group => group.group_name === 'Ungrouped');
    const groupedData = data.filter(group => group.group_name !== 'Ungrouped');

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-6xl w-full mx-4 h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">จัดการ Group PR</h2>
                        {pr_id && (
                            <div className="text-sm text-gray-500">PR ID: <span className="font-mono text-gray-700">{pr_id}</span></div>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold">&times;</button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Left Side - Groups */}
                    <div className="w-1/2 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-700">Groups</h3>
                            {/* Inline Group Creation */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="border border-gray-300 rounded px-3 py-1 text-sm w-32"
                                    placeholder="ชื่อ Group..."
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); }}
                                    disabled={loading}
                                />
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                    onClick={handleAddGroup}
                                    disabled={loading || !newGroupName.trim() || !pr_id}
                                >
                                    เพิ่ม
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-4">
                            {loading ? (
                                <div className="text-gray-400 text-sm text-center">กำลังโหลด...</div>
                            ) : error ? (
                                <div className="text-red-500 text-sm text-center">{error}</div>
                            ) : groupedData.length === 0 ? (
                                <div className="text-gray-400 text-sm text-center">ยังไม่มี Group</div>
                            ) : (
                                <div className="space-y-4">
                                    {groupedData.map(group => (
                                        <div key={group.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="font-semibold text-gray-800 mb-2 flex items-center justify-between">
                                                <span>{group.group_name}</span>
                                                <span className="text-xs text-gray-500">({group.list?.length || 0} รายการ)</span>
                                            </div>
                                            
                                            {group.list && group.list.length > 0 ? (
                                                <div className="space-y-1">
                                                    {group.list.map((item, idx) => (
                                                        <div key={item.id} className="text-sm bg-gray-50 p-2 rounded border-l-2 border-blue-300">
                                                            <div className="font-medium">{item.part_no} - {item.part_name}</div>
                                                            <div className="text-gray-600">จำนวน: {item.qty} {item.unit}</div>
                                                            <div className="text-gray-500 text-xs">{item.objective}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 text-sm">ไม่มีรายการ</div>
                                            )}
                                            
                                            {group.note && (
                                                <div className="mt-2 p-2 bg-yellow-50 border-l-3 border-yellow-300">
                                                    <div className="text-xs text-yellow-700 font-medium">หมายเหตุ:</div>
                                                    <div className="text-sm text-yellow-800">{group.note}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Ungrouped */}
                    <div className="w-1/2 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">
                            Ungrouped <span className="text-sm text-gray-500">({ungroupedData?.list?.length || 0} รายการ)</span>
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-4">
                            {ungroupedData && ungroupedData.list && ungroupedData.list.length > 0 ? (
                                <div className="space-y-2">
                                    {ungroupedData.list.map((item, idx) => (
                                        <div key={item.id} className="bg-white p-3 rounded border border-gray-200 hover:shadow-sm transition-shadow">
                                            <div className="font-medium text-gray-800">{item.part_no} - {item.part_name}</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                <div>จำนวน: {item.qty} {item.unit}</div>
                                                <div>วัตถุประสงค์: {item.objective}</div>
                                                <div>ผู้จัดจำหน่าย: {item.vendor}</div>
                                                <div>Plant: {item.plant}</div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {ungroupedData.note && (
                                        <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-300 rounded">
                                            <div className="text-sm text-yellow-700 font-medium">หมายเหตุ:</div>
                                            <div className="text-sm text-yellow-800 mt-1">{ungroupedData.note}</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-400 text-center">ไม่มีรายการที่ยังไม่ได้จัดกลุ่ม</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupPRModal;
