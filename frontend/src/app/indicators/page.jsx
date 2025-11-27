import DashboardLayout from "@/components/dashboard/DashboardLayout";
import IndicatorsPanel from "@/components/indicators/IndicatorsPanel";

export default function IndicatorsPage() {
    return (
        <DashboardLayout>
            <div className="p-6 lg:p-10 space-y-10">
                <IndicatorsPanel />
            </div>
        </DashboardLayout>
    );
}