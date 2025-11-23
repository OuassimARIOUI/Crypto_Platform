import DashboardLayout from "@/components/dashboard/DashboardLayout";
import IndicatorsChart from "@/components/indicators/IndicatorsChart";
import IndicatorsHeader from "@/components/indicators/IndicatorsHeader";

export default function IndicatorsPage() {
    return (
        <DashboardLayout>
            <div className="p-6 lg:p-10 space-y-10">
                <IndicatorsHeader />
                <IndicatorsChart />
            </div>
        </DashboardLayout>
    );
}
