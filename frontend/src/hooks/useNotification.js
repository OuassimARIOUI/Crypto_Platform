"use client";

import { useState, useCallback } from "react";

export function useNotification() {
    const [notification, setNotification] = useState(null);

    const showNotification = useCallback((message, type = "info", duration = 5000) => {
        setNotification({ message, type, duration });
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return {
        notification,
        showNotification,
        hideNotification,
    };
}
