import { auth, isFirebaseConfigured } from './firebase';

let tokenRefreshInterval = null;

export async function getValidToken() {
    if (!isFirebaseConfigured || !auth || !auth.currentUser) {
        return null;
    }

    try {
        const token = await auth.currentUser.getIdToken(true);
        return token;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
    }
}

export function startTokenRefresh(callback) {
    if (!isFirebaseConfigured || !auth) {
        return;
    }

    if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
    }

    tokenRefreshInterval = setInterval(async () => {
        const token = await getValidToken();
        if (token && callback) {
            callback(token);
        }
    }, 50 * 60 * 1000);
}

export function stopTokenRefresh() {
    if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
    }
}

export async function makeAuthenticatedRequest(url, options = {}) {
    const token = await getValidToken();
    
    if (!token) {
        throw new Error('No valid token available');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        const freshToken = await getValidToken();
        if (freshToken && freshToken !== token) {
            headers['Authorization'] = `Bearer ${freshToken}`;
            return fetch(url, {
                ...options,
                headers,
            });
        }
    }

    return response;
}
