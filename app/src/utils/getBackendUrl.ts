export const getBackendUrl = (): string => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
}; 