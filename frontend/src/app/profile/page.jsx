import React from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileDetails from "@/components/profile/ProfileDetails";

export default function ProfilePage() {
    return (
        <DashboardLayout>
            <div className="p-6 lg:p-10 space-y-10">
                <h1 className="text-4xl font-black text-white">User Profile</h1>

                <ProfileDetails />
            </div>
        </DashboardLayout>
    );
}