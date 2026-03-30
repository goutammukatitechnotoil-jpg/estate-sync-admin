import React from 'react';
import { Bell } from 'lucide-react';

interface DashboardHeaderProps {
    title?: string;
    showNotification?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title = "Dashboard", showNotification = true }) => {
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 h-16">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

            <div className="flex items-center gap-6">
                <div className="relative">
                    {showNotification && (
                        <>
                            <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-900" />
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                        </>
                    )}
                </div>

                <span className="text-sm text-gray-600 whitespace-nowrap">
                    {dateString}
                </span>
            </div>
        </div>
    );
};

export default DashboardHeader;