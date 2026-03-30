export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
    avatar: string;
    status: 'active' | 'inactive' | 'pending';
}

export interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'pdf' | 'docx' | 'xlsx' | 'image';
    size?: string;
    owner: string;
    updatedAt: string;
    parentId: string | null;
    status?: 'DRAFT' | 'PENDING_APPROVAL' | 'SIGNED' | 'REJECTED';
    isDeleted?: boolean;
    deletedAt?: string;
}

export type Severity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
export type AuditCategory = 'AUTH' | 'DOCUMENT' | 'SYSTEM' | 'SECURITY';

export interface AuditLog {
    id: string;
    timestamp: string;
    actor: {
        name: string;
        email: string;
        id: string;
        avatar: string;
    };
    action: string;
    target: string;
    category: AuditCategory;
    severity: Severity;
    ip: string;
    device: string;
    details?: string;
}