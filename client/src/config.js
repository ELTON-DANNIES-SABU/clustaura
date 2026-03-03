// Dynamic Configuration for Local Network Access
const getBaseUrl = () => {
    // If we're on localhost, use relative paths (handled by proxy in package.json)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return '';
    }
    // If accessing via network IP, explicitly point to the backend port
    return `${window.location.protocol}//${window.location.hostname}:5000`;
};

export const BASE_URL = getBaseUrl();
export const API_BASE_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL || '/';
