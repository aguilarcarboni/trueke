export interface Map {
    [key: string]: any
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
    error?: string
}
