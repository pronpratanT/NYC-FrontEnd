'use client';
import React, { useEffect, useState } from 'react';

import { useToken } from '../context/TokenContext';
import { useTheme } from "../components/ThemeProvider";


export default function ChartsView() {
    const { isDarkMode } = useTheme();
    const token = useToken();
    
    return (
        <div className={`w-full p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} rounded-lg shadow-lg`}>
            {/* Header with Year Filter */}
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    กราฟประวัติการซื้อ
                </h2>
                
            </div>

            
        </div>
    );
}
