export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}