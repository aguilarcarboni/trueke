import { APIResponse } from "@/lib/api";

export const fetchAPI = async <T>(endpoint: string): Promise<APIResponse> => {
    const response = await fetch(endpoint);
    const data = await response.json();
    return {
        message: data.message,
        error: data.error,
    };
};