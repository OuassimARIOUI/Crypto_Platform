import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileDetails from "@/components/profile/ProfileDetails";
import ProfileActivity from "@/components/profile/ProfileActivity";
import AddFunds from "@/components/profile/AddFunds";

export default function ProfilePage() {
    return (
        <DashboardLayout>
            <div className="p-6 lg:p-10 space-y-10">
                <h1 className="text-4xl font-black text-white">User Profile</h1>

                <ProfileDetails />
                <AddFunds />
                <ProfileActivity />
            </div>
        </DashboardLayout>
    );
}