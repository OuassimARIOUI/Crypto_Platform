export function addDurationToNow(duration) {
    const now = new Date();

    if (!duration || typeof duration !== "object") return null;

    const days = Number(duration.days ?? 0);
    const hours = Number(duration.hours ?? 0);
    const minutes = Number(duration.minutes ?? 0);
    const months = Number(duration.months ?? 0);

    if ([days, hours, minutes, months].every((v) => !v || Number.isNaN(v))) {
        return null;
    }

    const result = new Date(now);

    if (months) result.setMonth(result.getMonth() + months);
    if (days) result.setDate(result.getDate() + days);
    if (hours) result.setHours(result.getHours() + hours);
    if (minutes) result.setMinutes(result.getMinutes() + minutes);

    return result;
}
