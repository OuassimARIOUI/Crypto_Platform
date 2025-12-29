import { setMaintenanceConfig } from "../../../services/appSettingsService.js";

export async function disableMaintenance() {
  // Ensures maintenance is off AND updates the in-process cache
  await setMaintenanceConfig({ enabled: false, message: null });
}
