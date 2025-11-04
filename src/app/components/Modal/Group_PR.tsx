"use client";
import React, { useEffect, useState } from 'react';

import { useToken } from '../../context/TokenContext';
import { useTheme } from '../ThemeProvider';

import { IoTrashBinOutline } from "react-icons/io5";
import { SlOptionsVertical } from "react-icons/sl";
import { BiEditAlt } from "react-icons/bi";
import { LuNotebookPen } from "react-icons/lu";
import { MdLockOutline } from "react-icons/md";

type Data = {
    id: number;
    group_name: string;
    pr_id: number;
    note: Note[];
    list: List[];
}

type Note = {
    id: number;
    note: string;
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
    pr_no?: string | null;
    onSuccess?: () => void;
}

const GroupPRModal: React.FC<GroupPRModalProps> = ({ open, onClose, pr_id, pr_no, onSuccess }) => {
    const [data, setData] = useState<Data[]>([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [editingGroup, setEditingGroup] = useState<{ id: number; name: string } | null>(null);
    const [editingNote, setEditingNote] = useState<{ id: number; note: string } | null>(null);
    const [editingNoteItem, setEditingNoteItem] = useState<{ noteId: number; groupId: number; note: string } | null>(null);
    // const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [draggedItem, setDraggedItem] = useState<List | null>(null);

    const token = useToken();
    const { isDarkMode } = useTheme();

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
                // console.log("Fetched groups data:", result);
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
            const requestBody = {
                group_name: newGroupName.trim(),
                pr_id: parseInt(pr_id || '0')
            };
            // console.log("Creating group with data:", requestBody);

            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            // console.log("Response status:", response.status);
            const responseData = await response.json();
            // console.log("Response data:", responseData);

            if (!response.ok) throw new Error(`Failed to create group: ${responseData.message || response.statusText}`);
            setNewGroupName('');

            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
            if (onSuccess) onSuccess();
        } catch (error) {
            setError("Error creating group");
            console.error("Error creating group:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (groupId: number, groupName: string) => {
        if (!confirm(`คุณต้องการลบ Group "${groupName}" ใช่หรือไม่?`)) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?groupId=${groupId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Failed to delete group");
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
            setOpenDropdown(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            setError("Error deleting group");
            console.error("Error deleting group:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditGroup = async (groupId: number, newName: string) => {
        if (!newName.trim()) return;

        try {
            setLoading(true);
            setError(null);
            // console.log("Updating group:", groupId, "to new name:", newName);
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group/rename`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    group_id: groupId,
                    group_name: newName.trim()
                })
            });
            if (!response.ok) throw new Error("Failed to update group");
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
            setEditingGroup(null);
            setOpenDropdown(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            setError("Error updating group");
            console.error("Error updating group:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (groupId: number, newNote: string) => {
        try {
            setLoading(true);
            setError(null);
            console.log("Updating group note:", groupId, "to new note:", newNote);

            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group/note`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    group_id: groupId,
                    note: newNote.trim()
                })
            });

            if (!response.ok) throw new Error("Failed to update group note");
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
            setEditingNote(null);
            setOpenDropdown(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            setError("Error updating group note");
            console.error("Error updating group note:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditNoteItem = async (noteId: number, newNote: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group/note`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    note_id: noteId,
                    note: newNote.trim()
                })
            });

            if (!response.ok) throw new Error("Failed to edit note");
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
            setEditingNoteItem(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            setError("Error editing note");
            console.error("Error editing note:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNoteItem = async (noteId: number) => {
        if (!confirm("คุณต้องการลบหมายเหตุนี้ใช่หรือไม่?")) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group/note?noteId=${noteId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to delete note");
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
            if (onSuccess) onSuccess();
        } catch (error) {
            setError("Error deleting note");
            console.error("Error deleting note:", error);
        } finally {
            setLoading(false);
        }
    };

    // เพิ่ม item จาก ungrouped เข้า group
    const handleAddToGroup = async (memberId: number, groupId: number) => {
        try {
            setLoading(true);
            setError(null);
            console.log("Adding member to group from ungrouped:", { group_id: groupId, pcl_list: [memberId] });

            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group/member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    group_id: groupId,
                    pcl_list: [memberId]
                })
            });

            if (!response.ok) throw new Error("Failed to add item to group");
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
            if (onSuccess) onSuccess();
        } catch (error) {
            setError("Error adding item to group");
            console.error("Error adding item to group:", error);
        } finally {
            setLoading(false);
        }
    };

    // ย้าย item ระหว่าง groups
    const handleMoveBetweenGroups = async (memberId: number, sourceGroupId: number, targetGroupId: number) => {
        try {
            setLoading(true);
            setError(null);

            const apiBody = {
                group_member_id: memberId,
                source_group_id: sourceGroupId,
                new_group_id: targetGroupId,
                pr_id: parseInt(pr_id || '0'),
            };
            console.log("Moving member between groups:", apiBody);

            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group/member`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(apiBody)
            });

            if (!response.ok) throw new Error("Failed to move item between groups");
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
        } catch (error) {
            setError("Error moving item between groups");
            console.error("Error moving item between groups:", error);
        } finally {
            setLoading(false);
        }
    };

    // ลบ item ออกจาก group (ย้ายไป ungrouped)
    const handleRemoveFromGroup = async (memberIds: number) => {
        try {
            setLoading(true);
            setError(null);
            // ถ้าเป็น array และมีแค่ 1 ตัว ให้ส่งเป็นค่าเดียว
            let member_id: number | number[] = memberIds;
            if (Array.isArray(memberIds) && memberIds.length === 1) {
                member_id = memberIds[0];
            }
            console.log("Removing members:", member_id);

            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group/member/remove`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    member_id,
                })
            });
            if (!response.ok) throw new Error("Failed to remove item from group");
            // Refresh group list
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${pr_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await fetchResponse.json();
            setData(result.data || result.groups || result || []);
        } catch (error) {
            setError("Error removing item from group");
            console.error("Error removing item from group:", error);
        } finally {
            setLoading(false);
        }
    };

    // แยกข้อมูล Ungrouped กับ Groups อื่นๆ
    const ungroupedData = data.find(group => group.group_name === 'Ungrouped');
    const groupedData = data.filter(group => group.group_name !== 'Ungrouped');

    if (!open) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/80' : 'bg-slate-900/60'
            }`} onClick={() => {
                setOpenDropdown(null);
                setEditingNote(null);
                setEditingNoteItem(null);
                onClose();
            }}>
            <div className={`rounded-2xl shadow-2xl border p-8 max-w-7xl w-full mx-6 h-[85vh] flex flex-col ${isDarkMode
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white border-slate-200'
                }`} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={`flex items-center justify-between mb-8 pb-6 border-b-2 ${isDarkMode ? 'border-gray-600' : 'border-slate-100'
                    }`}>
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h2 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-slate-800'
                                }`}>
                                จัดการ Group PR
                            </h2>
                            {pr_id && (
                                <div className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                    }`}>
                                    PR NO: <span className={`font-mono px-3 py-1 rounded-md ${isDarkMode
                                        ? 'text-indigo-400 bg-indigo-900/30'
                                        : 'text-indigo-600 bg-indigo-50'
                                        }`}>{pr_no}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group border ${isDarkMode
                            ? 'bg-gray-700 hover:bg-red-900/30 border-gray-600'
                            : 'bg-slate-100 hover:bg-red-50 border-slate-200'
                            }`}
                    >
                        <svg className={`w-6 h-6 group-hover:text-red-500 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex gap-8 min-h-0">
                    {/* Left Side - Groups */}
                    <div className="w-1/2 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-slate-800'
                                        }`}>Groups</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                            }`}>{groupedData.length} กลุ่ม</span>
                                    </div>
                                </div>
                            </div>
                            {/* Inline Group Creation */}
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    className={`border-2 focus:ring-2 rounded-lg px-4 py-3 text-sm w-48 transition-all duration-200 font-medium ${isDarkMode
                                        ? 'border-gray-600 focus:border-indigo-400 focus:ring-indigo-900/30 bg-gray-700 text-gray-100 placeholder:text-gray-400'
                                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 bg-white text-slate-900 placeholder:text-slate-400'
                                        }`}
                                    placeholder="ชื่อกลุ่มใหม่..."
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); }}
                                    disabled={loading}
                                />
                                <button
                                    className={`bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all duration-200 flex items-center gap-2 ${isDarkMode
                                        ? 'hover:shadow-lg hover:shadow-indigo-900/30'
                                        : 'hover:shadow-lg hover:shadow-indigo-200'
                                        }`}
                                    onClick={handleAddGroup}
                                    disabled={loading || !newGroupName.trim() || !pr_id}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    เพิ่มกลุ่ม
                                </button>
                            </div>
                        </div>

                        <div
                            className={`flex-1 overflow-y-auto border-2 rounded-xl p-6 custom-scrollbar ${isDarkMode
                                ? 'border-gray-600 bg-gray-800 scrollbar-dark'
                                : 'border-slate-200 bg-slate-50 scrollbar-light'
                                }`}
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: isDarkMode ? '#4b5563 #1f2937' : '#cbd5e1 #f1f5f9'
                            }}
                            onClick={() => {
                                setOpenDropdown(null);
                                setEditingNote(null);
                                setEditingNoteItem(null);
                            }}
                        >
                            {loading ? (
                                <div className={`flex flex-col items-center justify-center h-40 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                    }`}>
                                    <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                                    <div className="text-sm font-medium">กำลังโหลดข้อมูล...</div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className={`text-red-600 text-sm p-6 rounded-xl border-2 max-w-md text-center ${isDarkMode
                                        ? 'bg-red-900/20 border-red-800'
                                        : 'bg-red-50 border-red-200'
                                        }`}>
                                        <svg className="w-6 h-6 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="font-medium">{error}</div>
                                    </div>
                                </div>
                            ) : groupedData.length === 0 ? (
                                <div className={`flex flex-col items-center justify-center h-40 ${isDarkMode ? 'text-gray-400' : 'text-slate-400'
                                    }`}>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-slate-200'
                                        }`}>
                                        <svg className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-slate-400'
                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <div className={`text-sm font-medium text-center ${isDarkMode ? 'text-gray-500' : 'text-slate-500'
                                        }`}>ยังไม่มีกลุ่ม<br />เพิ่มกลุ่มใหม่เพื่อเริ่มจัดระเบียบ PR</div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groupedData.map(group => (
                                        <div
                                            key={group.id}
                                            className={`rounded-xl p-6 border-2 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 hover:border-indigo-400'
                                                : 'bg-white border-slate-200 hover:border-indigo-300'
                                                }`}
                                            onClick={(e) => e.stopPropagation()}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                                            }}
                                            onDragLeave={(e) => {
                                                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                                                if (draggedItem) {
                                                    // เช็คสถานะก่อน - ถ้าไม่ใช่ pending หรือ Rejected ห้ามย้าย
                                                    if (draggedItem.status !== 'pending' && draggedItem.status !== 'Rejected') {
                                                        return;
                                                    }
                                                    // หา group ปัจจุบันของ item ที่ลาก
                                                    const currentGroup = data.find(g =>
                                                        g.list && g.list.some(item => item.id === draggedItem.id)
                                                    );
                                                    // ถ้าไม่ใช่ group เดียวกันถึงจะย้าย
                                                    if (currentGroup?.id !== group.id) {
                                                        if (currentGroup && currentGroup.group_name !== 'Ungrouped') {
                                                            // ย้ายระหว่าง groups
                                                            handleMoveBetweenGroups(draggedItem.member_id, currentGroup.id, group.id);
                                                        } else {
                                                            // เพิ่มจาก ungrouped เข้า group
                                                            handleAddToGroup(draggedItem.id, group.id);
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-100">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {editingGroup?.id === group.id ? (
                                                        <input
                                                            type="text"
                                                            value={editingGroup.name}
                                                            onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleEditGroup(group.id, editingGroup.name);
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingGroup(null);
                                                                }
                                                            }}
                                                            onBlur={() => handleEditGroup(group.id, editingGroup.name)}
                                                            className={`border-2 border-indigo-400 rounded-lg px-4 py-3 text-lg font-bold flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-slate-800'
                                                                }`}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <>
                                                            <div className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full"></div>
                                                            <span className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-slate-800'
                                                                }`}>{group.group_name}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className='flex items-center gap-4 relative'>
                                                    <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDarkMode
                                                        ? 'bg-indigo-900/30 text-indigo-400'
                                                        : 'bg-indigo-100 text-indigo-700'
                                                        }`}>
                                                        {group.list?.length || 0} รายการ
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdown(openDropdown === group.id ? null : group.id);
                                                        }}
                                                        className={`p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 border ${isDarkMode
                                                            ? 'hover:bg-gray-600 border-gray-600'
                                                            : 'hover:bg-slate-100 border-slate-200'
                                                            }`}
                                                    >
                                                        <SlOptionsVertical size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-slate-600'
                                                            }`} />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openDropdown === group.id && (
                                                        <div
                                                            className={`absolute top-14 right-0 border-2 rounded-xl shadow-xl z-20 min-w-[160px] overflow-hidden ${isDarkMode
                                                                ? 'bg-gray-700 border-gray-600'
                                                                : 'bg-white border-slate-200'
                                                                }`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setEditingGroup({ id: group.id, name: group.group_name });
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 font-medium ${isDarkMode
                                                                    ? 'text-gray-300 hover:bg-blue-900/30'
                                                                    : 'text-slate-700 hover:bg-blue-50'
                                                                    }`}
                                                            >
                                                                <BiEditAlt size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} /> แก้ไขชื่อกลุ่ม
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingNote({ id: group.id, note: '' });
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 font-medium ${isDarkMode
                                                                    ? 'text-gray-300 hover:bg-emerald-900/30'
                                                                    : 'text-slate-700 hover:bg-emerald-50'
                                                                    }`}
                                                            >
                                                                <LuNotebookPen size={18} className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} /> เพิ่มหมายเหตุ
                                                            </button>
                                                            <div className={`border-t-2 mx-2 ${isDarkMode ? 'border-gray-600' : 'border-slate-100'
                                                                }`}></div>
                                                            <button
                                                                onClick={() => handleDeleteGroup(group.id, group.group_name)}
                                                                className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 font-medium ${isDarkMode
                                                                    ? 'text-gray-300 hover:bg-red-900/30'
                                                                    : 'text-slate-700 hover:bg-red-50'
                                                                    }`}
                                                            >
                                                                <IoTrashBinOutline size={18} className={isDarkMode ? 'text-red-400' : 'text-red-600'} /> ลบกลุ่ม
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {group.list && group.list.length > 0 ? (
                                                <div className="space-y-3 mb-4">
                                                    {group.list.map((item) => {
                                                        const isLocked = item.status !== 'pending' && item.status !== 'Rejected';
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`p-3 rounded-xl border-l-4 transition-all duration-200 relative ${isLocked
                                                                        ? `border-gray-400 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'} cursor-not-allowed opacity-75`
                                                                        : `border-blue-400 hover:border-blue-500 cursor-grab hover:shadow-md hover:scale-[1.01] ${isDarkMode
                                                                            ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20'
                                                                            : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                                                                        }`
                                                                    }`}
                                                                draggable={!isLocked}
                                                                onDragStart={() => !isLocked && setDraggedItem(item)}
                                                                onDragEnd={() => setDraggedItem(null)}
                                                            >
                                                                <div className={`font-semibold text-sm flex items-center justify-between ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                                                    <span>{item.part_no} - {item.part_name}</span>
                                                                    {isLocked && (
                                                                        <MdLockOutline className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                                    )}
                                                                </div>
                                                                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                    จำนวน: {item.qty} {item.unit}
                                                                </div>
                                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    {item.objective}
                                                                </div>
                                                                {isLocked && (
                                                                    <div className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                                                        สถานะ: {item.status} (ไม่สามารถย้ายได้)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className={`text-sm text-center py-8 rounded-xl mb-4 ${isDarkMode
                                                    ? 'text-gray-400 bg-gray-800'
                                                    : 'text-gray-400 bg-gray-50'
                                                    }`}>
                                                    <div className="text-2xl mb-2">📦</div>
                                                    ไม่มีรายการในกลุ่มนี้
                                                </div>
                                            )}

                                            {/* Note Section */}
                                            {editingNote?.id === group.id ? (
                                                <div className={`p-4 border-2 border-emerald-200 rounded-xl ${isDarkMode
                                                    ? 'bg-gradient-to-r from-emerald-900/20 to-green-900/20'
                                                    : 'bg-gradient-to-r from-emerald-50 to-green-50'
                                                    }`}>
                                                    <div className={`flex items-center gap-2 text-sm font-semibold mb-3 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                                                        }`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        เพิ่มหมายเหตุใหม่
                                                    </div>
                                                    <textarea
                                                        value={String(editingNote?.note || '')}
                                                        onChange={(e) => {
                                                            if (editingNote) {
                                                                setEditingNote({ ...editingNote, note: e.target.value });
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && e.ctrlKey && editingNote) {
                                                                if (editingNote.note.trim()) {
                                                                    handleAddNote(group.id, editingNote.note);
                                                                }
                                                            } else if (e.key === 'Escape') {
                                                                setEditingNote(null);
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            if (editingNote && editingNote.note.trim()) {
                                                                handleAddNote(group.id, editingNote.note);
                                                            } else {
                                                                setEditingNote(null);
                                                            }
                                                        }}
                                                        className={`w-full text-sm border-2 border-emerald-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isDarkMode
                                                            ? 'bg-gray-800 text-gray-100'
                                                            : 'bg-white text-gray-800'
                                                            }`}
                                                        rows={3}
                                                        placeholder="กรอกหมายเหตุใหม่..."
                                                        autoFocus
                                                    />
                                                    <div className={`text-xs mt-2 flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                                        }`}>
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        กด Ctrl+Enter เพื่อบันทึก หรือ Esc เพื่อยกเลิก
                                                    </div>
                                                </div>
                                            ) : (group.note && group.note.length > 0) ? (
                                                <div className={`p-4 border-l-4 border-amber-400 rounded-xl ${isDarkMode
                                                    ? 'bg-gradient-to-r from-amber-900/20 to-yellow-900/20'
                                                    : 'bg-gradient-to-r from-amber-50 to-yellow-50'
                                                    }`}>
                                                    <div className={`flex items-center gap-2 text-sm font-semibold mb-3 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'
                                                        }`}>
                                                        <span>📝</span> หมายเหตุ
                                                    </div>
                                                    <div className={`text-sm space-y-3 ${isDarkMode ? 'text-amber-300' : 'text-amber-800'
                                                        }`}>
                                                        {group.note.map((noteItem, index) => (
                                                            <div key={noteItem.id || index} className={`flex items-start justify-between group/note p-3 rounded-lg border transition-all duration-200 ${isDarkMode
                                                                ? 'bg-gray-700 border-amber-600 hover:border-amber-500'
                                                                : 'bg-white border-amber-200 hover:border-amber-300'
                                                                }`}>
                                                                {editingNoteItem?.noteId === noteItem.id ? (
                                                                    <div className="flex-1 mr-3">
                                                                        <textarea
                                                                            value={editingNoteItem.note}
                                                                            onChange={(e) => setEditingNoteItem({ ...editingNoteItem, note: e.target.value })}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                                                    handleEditNoteItem(noteItem.id, editingNoteItem.note);
                                                                                } else if (e.key === 'Escape') {
                                                                                    setEditingNoteItem(null);
                                                                                }
                                                                            }}
                                                                            onBlur={() => handleEditNoteItem(noteItem.id, editingNoteItem.note)}
                                                                            className={`w-full text-sm border-2 border-green-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-200 ${isDarkMode
                                                                                ? 'bg-gray-800 text-gray-100'
                                                                                : 'bg-white text-gray-800'
                                                                                }`}
                                                                            rows={2}
                                                                            autoFocus
                                                                        />
                                                                        <div className={`text-xs mt-2 flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'
                                                                            }`}>
                                                                            <span>💡</span> กด Ctrl+Enter เพื่อบันทึก หรือ Esc เพื่อยกเลิก
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className={`flex-1 mr-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                                            }`}>{noteItem.note}</div>
                                                                        <div className="flex gap-2 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={() => setEditingNoteItem({ noteId: noteItem.id, groupId: group.id, note: noteItem.note })}
                                                                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 
                                                                                    ${isDarkMode
                                                                                        ? 'text-blue-400 bg-gray-700 hover:bg-blue-900/30'
                                                                                        : 'text-blue-600 hover:bg-blue-100'}
                                                                                `}
                                                                                title="แก้ไข"
                                                                            >
                                                                                <BiEditAlt size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteNoteItem(noteItem.id)}
                                                                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 
                                                                                    ${isDarkMode
                                                                                        ? 'text-red-400 bg-gray-700 hover:bg-red-900/30'
                                                                                        : 'text-red-600 hover:bg-red-100'}
                                                                                `}
                                                                                title="ลบ"
                                                                            >
                                                                                <IoTrashBinOutline size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Ungrouped */}
                    <div className="w-1/2 flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-slate-800'
                                    }`}>Ungrouped</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                        }`}>{ungroupedData?.list?.length || 0} รายการ</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`flex-1 overflow-y-auto border-2 rounded-xl p-6 custom-scrollbar ${isDarkMode
                                ? 'border-gray-600 bg-gray-800 scrollbar-dark-amber'
                                : 'border-slate-200 bg-slate-50 scrollbar-light-amber'
                                }`}
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: isDarkMode ? '#d97706 #1f2937' : '#f59e0b #fef3c7'
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-red-400', 'bg-red-50');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                                if (draggedItem && ungroupedData) {
                                    // เช็คสถานะก่อน - ถ้าไม่ใช่ pending หรือ Rejected ห้ามย้าย
                                    if (draggedItem.status !== 'pending' && draggedItem.status !== 'Rejected') {
                                        return;
                                    }
                                    // หา group ปัจจุบันของ item ที่ลาก
                                    const currentGroup = data.find(g =>
                                        g.list && g.list.some(item => item.id === draggedItem.id)
                                    );
                                    // ถ้าไม่ใช่ ungrouped อยู่แล้วถึงจะลบออกจาก group (ย้ายไป ungrouped)
                                    if (currentGroup?.id !== ungroupedData.id) {
                                        handleRemoveFromGroup(draggedItem.member_id);
                                    }
                                }
                            }}
                        >
                            {ungroupedData && ungroupedData.list && ungroupedData.list.length > 0 ? (
                                <div className="space-y-4">
                                    {ungroupedData.list.map((item) => {
                                        const isLocked = item.status !== 'pending' && item.status !== 'Rejected';
                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-4 rounded-2xl border-2 shadow-md transition-all duration-300 relative group ${isLocked
                                                        ? `cursor-not-allowed opacity-75 ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-600'
                                                            : 'bg-gray-100 border-gray-300'
                                                        }`
                                                        : `cursor-grab hover:shadow-lg hover:scale-[1.02] ${isDarkMode
                                                            ? 'bg-gray-700 border-gray-600 hover:border-orange-400'
                                                            : 'bg-white border-gray-100 hover:border-orange-200'
                                                        }`
                                                    }`}
                                                draggable={!isLocked}
                                                onDragStart={() => !isLocked && setDraggedItem(item)}
                                                onDragEnd={() => setDraggedItem(null)}
                                            >
                                                <div className={`font-medium flex items-center justify-between ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                                    <span>{item.part_no} - {item.part_name}</span>
                                                    {isLocked && (
                                                        <MdLockOutline className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                    )}
                                                </div>
                                                <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    <div>จำนวน: {item.qty} {item.unit}</div>
                                                    {/* <div>วัตถุประสงค์: {item.objective}</div> */}
                                                    {/* <div>ผู้จัดจำหน่าย: {item.vendor}</div> */}
                                                    <div>Plant: {item.plant}</div>
                                                    {isLocked && (
                                                        <div className={`font-medium mt-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                                            สถานะ: {item.status} (ไม่สามารถย้ายได้)
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Quick Move Buttons - Show only for unlocked items */}
                                                {!isLocked && groupedData.length > 0 && (
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <select
                                                            className={`text-xs border rounded px-2 py-1 ${isDarkMode
                                                                ? 'bg-blue-900/30 border-blue-600 text-gray-100'
                                                                : 'bg-blue-50 border-blue-200 text-gray-800'
                                                                }`}
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    // เพิ่มจาก ungrouped เข้า group
                                                                    handleAddToGroup(item.member_id, parseInt(e.target.value));
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>เลือก Group</option>
                                                            {groupedData.map(group => (
                                                                <option key={group.id} value={group.id}>
                                                                    {group.group_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {(ungroupedData?.note && ungroupedData.note.length > 0) && (
                                        <div className={`mt-4 p-3 border-l-4 border-yellow-300 rounded ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                                            }`}>
                                            <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                                                }`}>หมายเหตุ:</div>
                                            <div className={`text-sm space-y-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                                                }`}>
                                                {ungroupedData.note.map((noteItem, index) => (
                                                    <div key={noteItem.id || index} className="flex items-start justify-between group/note">
                                                        {editingNoteItem?.noteId === noteItem.id ? (
                                                            <div className="flex-1 mr-2">
                                                                <textarea
                                                                    value={editingNoteItem.note}
                                                                    onChange={(e) => setEditingNoteItem({ ...editingNoteItem, note: e.target.value })}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && e.ctrlKey) {
                                                                            handleEditNoteItem(noteItem.id, editingNoteItem.note);
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingNoteItem(null);
                                                                        }
                                                                    }}
                                                                    onBlur={() => handleEditNoteItem(noteItem.id, editingNoteItem.note)}
                                                                    className={`w-full text-sm border rounded px-2 py-1 resize-none ${isDarkMode
                                                                        ? 'border-green-600 bg-gray-700 text-gray-100'
                                                                        : 'border-green-300 bg-white text-gray-800'
                                                                        }`}
                                                                    rows={2}
                                                                    autoFocus
                                                                />
                                                                <div className={`text-xs mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'
                                                                    }`}>กด Ctrl+Enter เพื่อบันทึก หรือ Esc เพื่อยกเลิก</div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex-1 mr-2">{noteItem.note}</div>
                                                                <div className="flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => setEditingNoteItem({ noteId: noteItem.id, groupId: ungroupedData.id, note: noteItem.note })}
                                                                        className={`p-1 text-blue-600 rounded text-xs ${isDarkMode ? 'hover:bg-blue-900/30' : 'hover:bg-blue-100'
                                                                            }`}
                                                                        title="แก้ไข"
                                                                    >
                                                                        <BiEditAlt size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteNoteItem(noteItem.id)}
                                                                        className={`p-1 text-red-600 rounded text-xs ${isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-100'
                                                                            }`}
                                                                        title="ลบ"
                                                                    >
                                                                        <IoTrashBinOutline size={12} />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`flex flex-col items-center justify-center h-40 ${isDarkMode ? 'text-gray-400' : 'text-slate-400'
                                    }`}>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'
                                        }`}>
                                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className={`text-sm font-medium text-center ${isDarkMode ? 'text-gray-500' : 'text-slate-500'
                                        }`}>ไม่มีรายการที่ยังไม่ได้จัดกลุ่ม<br />รายการทั้งหมดได้รับการจัดระเบียบแล้ว</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupPRModal;
