
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { gooeyToast as toast } from "goey-toast";
import { 
    FolderPlus, 
    FileUp, 
    Grid, 
    List, 
    MoreVertical, 
    FileText, 
    Search,
    
    
    X,
    ShieldAlert,
    Trash2,
    PenTool,
    Download,
    
    Folder,
    ChevronRight,
    Home,
    Clock,
    Users,
    CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FileItem, User } from "../lib/types";
import { cn } from "../lib/utils";
import { getFolderContents, createFolder, deleteFolder, getPersonalTree, getDepartmentTree, shareFolder } from "../services/folderService";
import { uploadDocument, getDocumentStreamUrl, getFolderDocuments, deleteDocument, getDocumentVersions, getDocumentVersionStreamUrl, uploadNewDocumentVersion, signDocument, submitForApproval, rejectDocument, approveDocument } from "../services/documentService";

interface FileExplorerProps {
    title: string;
    currentFolderId: string | null;
    ownerId?: string | null;
    user?: User | null;
    folderType: 'PERSONAL' | 'DEPARTMENT';
    onFolderChange: (id: string | null) => void;
}

// --- SUB-COMPONENT: CYBER LOADING SKELETON ---
const FileSkeleton = ({ viewMode }: { viewMode: 'grid' | 'list' }) => {
    return (
        <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-1"
        )}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                    key={i} 
                    className={cn(
                        "glass-panel rounded-[32px] bg-white/20 dark:bg-slate-900/20 overflow-hidden relative",
                        viewMode === 'grid' ? "p-8 flex flex-col items-center" : "p-4 flex items-center justify-between px-8"
                    )}
                >
                    {/* Pulsing Gradient Overlay */}
                    <motion.div 
                        animate={{ 
                            x: ['-100%', '100%'],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            ease: "linear" 
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent skew-x-12"
                    />

                    <div className={cn("flex items-center w-full", viewMode === 'grid' ? "flex-col" : "gap-6")}>
                        <div className={cn("bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse", viewMode === 'grid' ? "w-16 h-16 mb-4" : "w-10 h-10")} />
                        <div className={cn("flex flex-col flex-1", viewMode === 'grid' ? "items-center space-y-2" : "gap-2")}>
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-24 animate-pulse" />
                            <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full w-16 animate-pulse" />
                        </div>
                    </div>
                    {viewMode === 'list' && (
                        <div className="w-20 h-2 bg-slate-100 dark:bg-slate-900 rounded-full animate-pulse hidden md:block" />
                    )}
                </div>
            ))}
        </div>
    );
};

export function FileExplorer({ title, currentFolderId, ownerId, user, folderType, onFolderChange }: FileExplorerProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    
    const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
    const [viewFileId, setViewFileId] = useState<string | null>(null);
    const [viewFileVersionId, setViewFileVersionId] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([]);
    
    // History Modal State
    const [historyFileId, setHistoryFileId] = useState<string | null>(null);
    const [fileVersions, setFileVersions] = useState<any[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Signing Modal State
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [signPassword, setSignPassword] = useState("");
    const [signReason, setSignReason] = useState("Phê duyệt chuyên môn");
    const [signP12File, setSignP12File] = useState<File | null>(null);

    // Submit Approval Modal State
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [approverId, setApproverId] = useState("");

    // Share Folder Modal State
    const [shareFolderId, setShareFolderId] = useState<string | null>(null);
    const [shareUserId, setShareUserId] = useState("");
    const [shareRole, setShareRole] = useState<'VIEWER'|'EDITOR'>('VIEWER');

    // Fetch PDF Blob URL when viewing a file
    useEffect(() => {
        if (!viewFileId) {
            setPdfUrl(null);
            setViewFileVersionId(null);
            return;
        }

        let blobUrl: string | null = null;
        const fetchPdf = async () => {
            try {
                const response = viewFileVersionId 
                    ? await getDocumentVersionStreamUrl(viewFileId, viewFileVersionId)
                    : await getDocumentStreamUrl(viewFileId);
                const blob = new Blob([response.data], { type: 'application/pdf' });
                blobUrl = URL.createObjectURL(blob);
                setPdfUrl(blobUrl);
            } catch (error) {
                console.error("Failed to fetch PDF", error);
                toast.error("Không thể xem trước", { description: "Định dạng không hỗ trợ hoặc file PDF bị hỏng." });
            }
        };

        fetchPdf();

        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [viewFileId, viewFileVersionId]);

    // Fetch data from API
    const fetchFilesAndFolders = async () => {
        setIsLoading(true);
        try {
            // Map 'root' or 'dept_root' to null for backend
            const apiParentId = (currentFolderId === 'root' || currentFolderId === 'dept_root') ? null : currentFolderId;
            
            const [folderRes, documentRes] = await Promise.all([
                getFolderContents(apiParentId, folderType),
                getFolderDocuments(apiParentId)
            ]);
            
            // Ensure response data exists
            const rawFolders = Array.isArray(folderRes.data) ? folderRes.data : folderRes.data.content || [];
            const rawDocuments = Array.isArray(documentRes.data) ? documentRes.data : documentRes.data.content || [];
            
            // Map Backend Category to Frontend FileItem
            const mappedFolders: FileItem[] = rawFolders.map((cat: any) => ({
                id: `folder_${cat.id}`,
                name: cat.name,
                type: 'folder',
                size: '--',
                updatedAt: new Date().toLocaleDateString(), // BE doesn't have updatedAt yet
                owner: ownerId || user?.id || 'sys', // default owner
                status: 'draft',
                parentId: cat.parentId ? String(cat.parentId) : null,
                isDeleted: cat.isDeleted
            }));

            // Map Backend Document to Frontend FileItem
            const mappedDocuments: FileItem[] = rawDocuments.map((doc: any) => ({
                id: `doc_${doc.id}`,
                name: doc.name,
                type: 'file',
                size: doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '--',
                updatedAt: new Date().toLocaleDateString(), // Use actual date if available
                owner: ownerId || user?.id || 'sys',
                status: doc.status || 'DRAFT',
                parentId: doc.folderId ? String(doc.folderId) : null,
                isDeleted: doc.isDeleted
            }));

            setFiles([...mappedFolders, ...mappedDocuments]);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Tải dữ liệu thất bại", { description: "Không thể lấy danh sách tài liệu. Vui lòng kiểm tra kết nối mạng." });
        } finally {
            setIsLoading(false);
        }
    };

    // Click outside to close context menu
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Fetch data and build breadcrumbs when folder changes
    useEffect(() => {
        fetchFilesAndFolders();

        // Build Breadcrumbs from backend tree
        const buildBreadcrumbs = async () => {
            if (!currentFolderId || currentFolderId === 'root' || currentFolderId === 'dept_root') {
                setBreadcrumbs([]);
                return;
            }
            try {
                const treeFn = folderType === 'PERSONAL' ? getPersonalTree : getDepartmentTree;
                const res = await treeFn();
                const tree = Array.isArray(res.data) ? res.data : [];
                const path: {id: string, name: string}[] = [];
                
                const findPath = (nodes: any[], targetId: string, currentPath: any[]): boolean => {
                    for (const node of nodes) {
                        const newPath = [...currentPath, { id: String(node.id), name: node.name }];
                        if (String(node.id) === targetId) {
                            path.push(...newPath);
                            return true;
                        }
                        if (node.children && node.children.length > 0) {
                            if (findPath(node.children, targetId, newPath)) return true;
                        }
                    }
                    return false;
                };

                findPath(tree, currentFolderId, []);
                setBreadcrumbs(path);
            } catch (err) {
                console.error("Failed to get breadcrumbs", err);
            }
        };

        buildBreadcrumbs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFolderId, ownerId, title]);

    const currentFiles = useMemo(() => {
        const filtered = files.filter(f => {
            if (f.isDeleted) return false;
            // API now already returns correct filtered data by parentId
            return true;
        });

        // Sort: Folders first, then files
        return filtered.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return 0;
        });
    }, [files]);

    const handleFileClick = (e: React.MouseEvent, file: FileItem) => {
        e.preventDefault();
        e.stopPropagation();
        const rawId = file.id.replace('folder_', '').replace('doc_', '');
        if (file.type === 'folder') {
            onFolderChange(rawId);
        } else {
            setViewFileId(rawId);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const menuWidth = 192; // 48 * 4 (w-48)
        const menuHeight = 200; // Estimated height based on items
        
        let x = e.clientX;
        let y = e.clientY;
        
        // Constrain X
        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }
        
        // Constrain Y
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 10;
        }
        
        setContextMenu({ id: fileId, x, y });
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        
        try {
            const apiParentId = (currentFolderId === 'root' || currentFolderId === 'dept_root') ? null : currentFolderId;
            await createFolder({ name: newFolderName, parentId: apiParentId, folderType });
            toast.success("Tạo thư mục thành công", { description: `Đã khởi tạo không gian lưu trữ mới: ${newFolderName}` });
            
            // Re-fetch folders to get the real ID from DB
            fetchFilesAndFolders();
            
            setShowNewFolderModal(false);
            setNewFolderName("");
        } catch (error: any) {
            toast.error("Tạo thư mục thất bại", { description: error?.response?.data?.message || "Lỗi hệ thống khi tạo thư mục." });
        }
    };

    const handleUpload = async (e?: React.ChangeEvent<HTMLInputElement>) => {
        if (!e || !e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        setIsUploadModalOpen(false);

        try {
            const apiParentId = (currentFolderId === 'root' || currentFolderId === 'dept_root') ? null : currentFolderId;
            
            const uploadTask = uploadDocument(file, apiParentId);
            
            toast.promise(
                uploadTask, 
                {
                    loading: `Đang tải lên tài liệu...`,
                    success: `Tải lên thành công!`,
                    error: 'Tải lên thất bại',
                    description: {
                        loading: `Đang chuyển file ${file.name} lên máy chủ...`,
                        success: "Tệp tin đã được lưu trữ an toàn và sẵn sàng sử dụng.",
                        error: "Hệ thống chỉ hỗ trợ định dạng PDF, DOCX (Tối đa 50MB)."
                    }
                }
            );
            
            uploadTask.then(() => {
                fetchFilesAndFolders();
            });
        } catch (error) {
            console.error("Upload error", error);
        }
    };

    const handleDelete = async (id: string) => {
        const fileToDelete = files.find(f => f.id === id);
        const rawId = id.replace('folder_', '').replace('doc_', '');
        
        try {
            if (fileToDelete?.type === 'folder') {
                await deleteFolder(rawId);
                toast.success("Đã xóa thư mục", { description: `Thư mục "${fileToDelete.name}" đã được chuyển vào thùng rác`, icon: '🗑️' });
                fetchFilesAndFolders();
            } else {
                await deleteDocument(rawId);
                toast.success("Đã xóa tài liệu", { description: `Tệp tin "${fileToDelete?.name}" đã được chuyển vào thùng rác`, icon: '🗑️' });
                fetchFilesAndFolders();
            }
        } catch (error: any) {
            toast.error("Thao tác xóa thất bại", { description: error?.response?.data?.message || "Hệ thống bận, vui lòng thử lại sau" });
        }
        
        setContextMenu(null);
    };

    const handleRecall = (id: string) => {
        setFiles(files.map(f => {
            if (f.id === id) {
                toast.success("Đã thu hồi tài liệu", { description: `Tài liệu "${f.name}" đã được chuyển về trạng thái nháp.` });
                return { ...f, status: 'DRAFT' };
            }
            return f;
        }));
        setContextMenu(null);
    };

    const handleOpenHistory = async (fileId: string) => {
        setContextMenu(null);
        const rawId = fileId.replace('folder_', '').replace('doc_', '');
        setHistoryFileId(rawId);
        setIsHistoryLoading(true);
        try {
            const res = await getDocumentVersions(rawId);
            setFileVersions(res.data || []);
        } catch(e) {
            console.error(e);
            toast.error("Lỗi xem lịch sử", { description: "Lỗi kết nối khi tải lịch sử phiên bản." });
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleViewVersion = (fileId: string, versionId: string) => {
        setHistoryFileId(null);
        setViewFileId(fileId);
        setViewFileVersionId(versionId);
    };

    const handleUpdateVersion = (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const rawId = fileId.replace('doc_', '');
        
        const uploadTask = uploadNewDocumentVersion(rawId, file);
        toast.promise(uploadTask, {
            loading: `Đang tải lên phiên bản mới...`,
            success: `Cập nhật thành công!`,
            error: 'Cập nhật thất bại',
            description: {
                loading: "Tài liệu đang được đồng bộ và cập nhật phiên bản...",
                success: "Phiên bản mới đã được lưu vào hệ thống.",
                error: "Dữ liệu không hợp lệ hoặc lỗi kết nối. Vui lòng thử lại."
            }
        });
        
        uploadTask.then(() => {
            fetchFilesAndFolders();
            setContextMenu(null);
        }).catch(err => console.error(err));
    };

    const handleSignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewFileId || !signP12File || !signPassword) {
            toast.error("Vui lòng chọn file chứng thư (.p12) và nhập mật khẩu");
            return;
        }

        const signTask = signDocument(viewFileId, signP12File, signPassword, signReason, "Smart EDMS Core");
        
        toast.promise(signTask, {
            loading: "Đang xử lý chữ ký...",
            success: "Ký duyệt thành công!",
            error: "Ký số thất bại",
            description: {
                loading: "Hệ thống đang mật mã hóa và đóng dấu PDF...",
                success: "Tài liệu đã được ký số và lưu trữ an toàn.",
                error: "Sai mật khẩu hoặc file chứng thư số bị lỗi."
            }
        });

        try {
            await signTask;
            setIsSignModalOpen(false);
            setSignP12File(null);
            setSignPassword("");
            
            fetchFilesAndFolders();
            
            // Tắt tạm view để refresh PDF stream
            const oldId = viewFileId;
            setViewFileId(null);
            setTimeout(() => setViewFileId(oldId), 300);
        } catch (error) {
            console.error("Sign error:", error);
        }
    };

    const handleShareSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shareFolderId || !shareUserId) return;
        try {
            await shareFolder(shareFolderId, parseInt(shareUserId), shareRole);
            toast.success("Đã cấp quyền truy cập", { description: "Thư mục đã được chia sẻ thành công theo yêu cầu." });
            setShareFolderId(null);
            setShareUserId("");
        } catch (error: any) {
            toast.error("Chia sẻ thất bại", { description: error?.response?.data?.message || "Không xác định được mã nhân viên nhận." });
        }
    };

    const handleSubmitForApprovalForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewFileId || !approverId) return;
        try {
            await submitForApproval(viewFileId, approverId);
            toast.success("Trình ký thành công", { description: "Tài liệu đã được gửi và đang chờ quản lý phê duyệt." });
            setIsSubmitModalOpen(false);
            setApproverId("");
            fetchFilesAndFolders();
            setViewFileId(null);
        } catch (e: any) {
            toast.error("Lỗi trình ký", { description: e?.response?.data?.message || "Không thể gửi yêu cầu trình duyệt." });
        }
    };

    const handleReject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await rejectDocument(id);
            toast.success("Từ chối thành công", { description: "Đã hủy yêu cầu cấp phép cho tài liệu." });
            fetchFilesAndFolders();
            setViewFileId(null);
        } catch (e: any) {
            toast.error("Thao tác thất bại", { description: e?.response?.data?.message || "Lỗi khi xử lý thao tác từ chối." });
        }
    };

    const handleApproveWithoutSign = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await approveDocument(id);
            toast.success("Phê duyệt thành công", { description: "Tài liệu đã được duyệt mà không cần chữ ký số." });
            fetchFilesAndFolders();
            setViewFileId(null);
        } catch (e: any) {
            toast.error("Thao tác thất bại", { description: e?.response?.data?.message || "Lỗi khi phê duyệt tài liệu." });
        }
    };

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'folder': return <Folder className="w-10 h-10 text-primary" />;
            default: return <FileText className="w-10 h-10 text-destructive" />;
        }
    };

    const fileToView = files.find(f => f.id.replace('folder_', '').replace('doc_', '') === String(viewFileId));

    return (
        <div 
            className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative min-h-[600px] pb-20"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
        >
            {/* Drag Overlay */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 rounded-[40px] border-[4px] border-dashed border-primary bg-primary/10 flex items-center justify-center backdrop-blur-sm pointer-events-none"
                    >
                        <div className="text-center p-12 glass-panel rounded-3xl animate-bounce">
                            <FileUp className="w-20 h-20 text-primary mx-auto mb-4" />
                            <h2 className="text-3xl font-black gradient-text">Thả file vào đây</h2>
                            <p className="text-sm font-bold text-muted-foreground mt-2">Tài liệu sẽ được tải lên thư mục hiện tại</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-4 w-full lg:w-auto">
                    <h2 className="text-3xl font-black tracking-tight uppercase italic gradient-text">{title}</h2>
                    
                    {/* Modern Breadcrumbs */}
                    <div className="inline-flex items-center gap-1 px-3 py-2 glass-panel rounded-2xl bg-white/40 dark:bg-slate-900/40 shadow-sm border border-white/60 backdrop-blur-md overflow-x-auto max-w-full no-scrollbar">
                        <button 
                            onClick={() => onFolderChange(null)} 
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary hover:bg-white/60 dark:hover:bg-slate-800/60 px-3 py-1.5 rounded-xl transition-all duration-300"
                        >
                            <Home className="w-4 h-4" />
                            <span className="max-w-[120px] truncate">{title}</span>
                        </button>
                        
                        <AnimatePresence>
                            {breadcrumbs.map((b, index) => {
                                const isLast = index === breadcrumbs.length - 1;
                                return (
                                    <motion.div 
                                        key={b.id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-1"
                                    >
                                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                        <button 
                                            onClick={() => onFolderChange(b.id)} 
                                            disabled={isLast}
                                            className={cn(
                                                "text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-300 truncate max-w-[150px]",
                                                isLast 
                                                    ? "text-primary bg-primary/10 cursor-default" 
                                                    : "text-slate-500 hover:text-primary hover:bg-white/60 dark:hover:bg-slate-800/60 cursor-pointer"
                                            )}
                                        >
                                            {b.name}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-white/50 dark:bg-white/5 p-1 rounded-2xl border border-white/40">
                        <button onClick={() => setViewMode('grid')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-muted-foreground")}><Grid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-muted-foreground")}><List className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => setShowNewFolderModal(true)} className="p-3.5 rounded-2xl glass-panel border-white/60 hover:text-primary transition-all shadow-sm"><FolderPlus className="w-5 h-5" /></button>
                    <button onClick={() => setIsUploadModalOpen(true)} className="cyber-gradient px-6 py-3.5 rounded-2xl text-white font-black text-xs shadow-neon hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        <FileUp className="w-4 h-4" /> TẢI LÊN
                    </button>
                </div>
            </div>

            {/* --- CONTENT AREA WITH SKELETON --- */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <FileSkeleton viewMode={viewMode} />
                    </motion.div>
                ) : (
                    <motion.div
                        key={currentFolderId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full"
                    >
                        <div className={cn(
                            "grid gap-6",
                            viewMode === 'grid' ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-1"
                        )}>
                            {currentFiles.map(file => (
                                <div 
                                    key={file.id} 
                                    onDoubleClick={(e) => handleFileClick(e, file)} 
                                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                                    className={cn(
                                        "glass-panel rounded-[32px] group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/40 shadow-xl bg-white/40 dark:bg-slate-900/40 relative",
                                        viewMode === 'grid' ? "p-8 text-center" : "p-4 flex items-center justify-between px-8"
                                    )}
                                >
                                    <div className={cn("flex items-center", viewMode === 'grid' ? "flex-col" : "gap-6")}>
                                        <div className="relative mb-3 flex justify-center">
                                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            {getFileIcon(file.type)}
                                        </div>
                                        <div className={viewMode === 'grid' ? "mt-2" : ""}>
                                            <h4 className="text-xs lg:text-sm font-black truncate max-w-[150px] group-hover:text-primary transition-colors">{file.name}</h4>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase mt-1 opacity-60">{file.type === 'folder' ? 'Dữ liệu nội bộ' : file.size}</p>
                                        </div>
                                    </div>
                                    {viewMode === 'list' && (
                                        <div className="flex items-center gap-8">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">{file.updatedAt}</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleContextMenu(e, file.id); }} 
                                                className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl"
                                            >
                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    )}
                                    {viewMode === 'grid' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleContextMenu(e, file.id); }} 
                                            className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 hover:bg-white/60 rounded-xl transition-all"
                                        >
                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {currentFiles.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 glass-panel rounded-[40px] border-dashed bg-white/20">
                                <Search className="w-16 h-16 text-muted-foreground opacity-10 mb-6" />
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Hệ thống chưa tìm thấy dữ liệu</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        className="fixed z-[999] glass-panel rounded-2xl w-48 shadow-2xl border-white/60 overflow-hidden bg-white/90"
                    >
                        <div className="p-1.5 space-y-1">
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors">
                                <PenTool className="w-4 h-4" /> Đổi tên
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors">
                                <Download className="w-4 h-4" /> Tải xuống
                            </button>
                            {contextMenu && files.find(f => f.id === contextMenu.id)?.type === 'folder' && folderType === 'DEPARTMENT' && (
                                <button onClick={() => {setShareFolderId(contextMenu.id.replace('folder_', '')); setContextMenu(null);}} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors">
                                    <Users className="w-4 h-4" /> Chia sẻ
                                </button>
                            )}
                            {contextMenu && files.find(f => f.id === contextMenu.id)?.type !== 'folder' && (
                                <>
                                    <label className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors cursor-pointer">
                                        <FileUp className="w-4 h-4" /> Cập nhật bản mới
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept=".pdf"
                                            onChange={(e) => handleUpdateVersion(e, contextMenu.id)} 
                                        />
                                    </label>
                                    <button onClick={() => handleOpenHistory(contextMenu.id)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors">
                                        <Clock className="w-4 h-4" /> Lịch sử phiên bản
                                    </button>
                                </>
                            )}
                            {contextMenu && files.find(f => f.id === contextMenu.id)?.status === 'PENDING_APPROVAL' && (
                                <button onClick={() => handleRecall(contextMenu.id)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-warning hover:bg-warning/10 rounded-xl transition-colors">
                                    <ShieldAlert className="w-4 h-4" /> Thu hồi
                                </button>
                            )}
                            <div className="h-px bg-slate-200/60 my-1 mx-2" />
                            <button onClick={() => handleDelete(contextMenu.id)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                                <Trash2 className="w-4 h-4" /> Xóa
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Folder Modal */}
            <AnimatePresence>
                {showNewFolderModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm glass-panel rounded-[40px] p-8 border-white/60 shadow-[0_32px_128px_rgba(0,0,0,0.4)] bg-white/95"
                        >
                            <button onClick={() => setShowNewFolderModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                                <FolderPlus className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black mb-1">Tạo thư mục mới</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Tổ chức không gian lưu trữ</p>

                            <form onSubmit={handleCreateFolder}>
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Nhập tên thư mục..." 
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all mb-8" 
                                />
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowNewFolderModal(false)} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase text-muted-foreground bg-slate-100 hover:bg-slate-200 transition-colors">Hủy</button>
                                    <button type="submit" disabled={!newFolderName.trim()} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase bg-primary text-white shadow-neon hover:scale-[1.02] disabled:opacity-50 transition-all">Tạo mới</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md glass-panel rounded-[40px] p-8 border-white/60 shadow-2xl bg-white/95"
                        >
                            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <h3 className="text-2xl font-black tracking-tighter uppercase italic gradient-text mb-1">Tải lên tài liệu</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-8">Hỗ trợ PDF, DOCX tối đa 50MB</p>

                            <div className="border-2 border-dashed border-primary/40 rounded-3xl p-12 text-center bg-primary/5 hover:bg-primary/10 transition-colors relative group">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    onChange={handleUpload} 
                                    title="Kéo thả hoặc click để chọn file"
                                />
                                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 text-primary">
                                    <FileUp className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-black text-primary mb-2">Click hoặc kéo thả file vào đây</p>
                            </div>

                            <button onClick={() => handleUpload()} className="w-full mt-6 py-4 rounded-2xl cyber-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-neon hover:scale-[1.02] transition-transform">
                                Bắt đầu tải lên
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {historyFileId && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl glass-panel rounded-[40px] p-8 border-white/60 shadow-2xl bg-white/95 max-h-[80vh] flex flex-col"
                        >
                            <button onClick={() => setHistoryFileId(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <h3 className="text-2xl font-black tracking-tighter uppercase italic gradient-text mb-1 flex items-center gap-2">
                                <Clock className="w-6 h-6" /> Lịch sử phiên bản
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">
                                Phiên bản tài liệu "{files.find(f => f.id === historyFileId)?.name}"
                            </p>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                {isHistoryLoading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                    </div>
                                ) : (
                                    fileVersions.map((v: any) => (
                                        <div key={v.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:border-primary/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                                                    V{v.versionNumber}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">
                                                        Phiên bản {v.versionNumber} 
                                                        {v.current && <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase rounded-full">Hiện Tại</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {new Date(v.createdAt).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleViewVersion(v.documentId, v.id)}
                                                className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-colors"
                                            >
                                                Xem bản này
                                            </button>
                                        </div>
                                    ))
                                )}
                                {!isHistoryLoading && fileVersions.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground py-10">Không tìm thấy lịch sử phiên bản nào.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Share Folder Modal */}
            {createPortal(
                <AnimatePresence>
                    {shareFolderId && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-sm glass-panel rounded-[40px] p-8 border-white/60 shadow-[0_32px_128px_rgba(0,0,0,0.4)] bg-white/95"
                            >
                                <button onClick={() => setShareFolderId(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-all">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-6">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black mb-1">Chia sẻ thư mục</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Thêm quyền truy cập cho nhân viên</p>

                                <form onSubmit={handleShareSubmit}>
                                    <div className="space-y-4 mb-8">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Mã Nhân Viên (User ID)</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ví dụ: 2" 
                                                value={shareUserId}
                                                onChange={e => setShareUserId(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Mức Quyền</label>
                                            <select 
                                                value={shareRole}
                                                onChange={e => setShareRole(e.target.value as any)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" 
                                            >
                                                <option value="VIEWER">VIEWER (Chỉ Xem)</option>
                                                <option value="EDITOR">EDITOR (Chỉnh Sửa)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setShareFolderId(null)} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase text-muted-foreground bg-slate-100 hover:bg-slate-200 transition-colors">Hủy</button>
                                        <button type="submit" disabled={!shareUserId.trim()} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase bg-indigo-600 text-white shadow-neon flex items-center gap-2 justify-center hover:scale-[1.02] disabled:opacity-50 transition-all">
                                            Chia Sẻ
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Submit Approval Modal */}
            {createPortal(
                <AnimatePresence>
                    {isSubmitModalOpen && viewFileId && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-sm glass-panel rounded-[40px] p-8 border-white/60 shadow-[0_32px_128px_rgba(0,0,0,0.4)] bg-white/95"
                            >
                                <button onClick={() => setIsSubmitModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-all">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-6">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black mb-1">Trình ký tài liệu</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Chọn người duyệt</p>

                                <form onSubmit={handleSubmitForApprovalForm}>
                                    <div className="space-y-4 mb-8">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">ID Người Duyệt (Manager)</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ví dụ: 2" 
                                                value={approverId}
                                                onChange={e => setApproverId(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground mt-2 italic">* Tạm thời nhập ID (vd: 1, 2) theo Database do đồ án chưa cung cấp danh sách Manager.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setIsSubmitModalOpen(false)} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase text-muted-foreground bg-slate-100 hover:bg-slate-200 transition-colors">Hủy</button>
                                        <button type="submit" disabled={!approverId.trim()} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase bg-blue-600 text-white shadow-neon flex items-center gap-2 justify-center hover:scale-[1.02] disabled:opacity-50 transition-all">
                                            <PenTool className="w-4 h-4" /> Gửi
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Sign Document Modal */}
            {createPortal(
                <AnimatePresence>
                    {isSignModalOpen && viewFileId && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-sm glass-panel rounded-[40px] p-8 border-white/60 shadow-[0_32px_128px_rgba(0,0,0,0.4)] bg-white/95"
                            >
                                <button onClick={() => setIsSignModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-all">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black mb-1">Ký số tài liệu</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6 truncate">File: {fileToView?.name}</p>

                                <form onSubmit={handleSignSubmit}>
                                    <div className="space-y-4 mb-8">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">File Chứng Thư Số (.p12/.pfx)</label>
                                            <input 
                                                type="file" 
                                                accept=".p12,.pfx,.pem"
                                                onChange={(e) => setSignP12File(e.target.files ? e.target.files[0] : null)}
                                                className="w-full text-sm font-medium file:cursor-pointer file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-black file:py-2 file:px-4 hover:file:bg-primary/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu khóa (Passphrase)</label>
                                            <input 
                                                type="password" 
                                                placeholder="Nhập mật khẩu..." 
                                                value={signPassword}
                                                onChange={e => setSignPassword(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Lý do ký</label>
                                            <input 
                                                type="text" 
                                                placeholder="Phê duyệt, Đồng ý..." 
                                                value={signReason}
                                                onChange={e => setSignReason(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setIsSignModalOpen(false)} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase text-muted-foreground bg-slate-100 hover:bg-slate-200 transition-colors">Hủy</button>
                                        <button type="submit" disabled={!signP12File || !signPassword.trim()} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase bg-primary text-white shadow-neon hover:scale-[1.02] disabled:opacity-50 transition-all">Khởi tạo Ký</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* View Document Modal */}
            {createPortal(
                <AnimatePresence>
                    {viewFileId && fileToView && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-5xl h-[90vh] glass-panel rounded-[40px] overflow-hidden border-white/60 shadow-2xl bg-white flex flex-col"
                            >
                                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 text-primary rounded-xl"><FileText className="w-5 h-5" /></div>
                                        <div>
                                            <h3 className="font-black text-lg">{fileToView.name}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                Trạng thái: 
                                                {fileToView.status === 'SIGNED' ? <span className="text-green-500 ml-1">Đã Ký Số</span> :
                                                 fileToView.status === 'PENDING_APPROVAL' ? <span className="text-warning ml-1">Đang chờ duyệt</span> :
                                                 fileToView.status === 'REJECTED' ? <span className="text-destructive ml-1">Từ chối thao tác</span> :
                                                 <span className="text-slate-500 ml-1">Nháp (DRAFT)</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {user?.role !== 'ADMIN' && fileToView.status === 'DRAFT' && (
                                            <button onClick={() => setIsSubmitModalOpen(true)} className="p-3 bg-blue-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                                <PenTool className="w-4 h-4" /> <span className="text-[10px] font-black uppercase hidden sm:inline">Trình Ký</span>
                                            </button>
                                        )}
                                        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (fileToView.status === 'DRAFT' || fileToView.status === 'PENDING_APPROVAL') && (
                                            <button onClick={() => setIsSignModalOpen(true)} className="p-3 bg-primary text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                                <PenTool className="w-4 h-4" /> <span className="text-[10px] font-black uppercase hidden sm:inline">Ký Số</span>
                                            </button>
                                        )}
                                        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && fileToView.status === 'PENDING_APPROVAL' && (
                                            <button onClick={(e) => handleApproveWithoutSign(e, fileToView.id)} className="p-3 bg-success text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" /> <span className="text-[10px] font-black uppercase hidden sm:inline">Duyệt nhanh</span>
                                            </button>
                                        )}
                                        {fileToView.status === 'PENDING_APPROVAL' && (user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                                            <button onClick={(e) => handleReject(e, fileToView.id)} className="p-3 bg-destructive text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                                <X className="w-4 h-4" /> <span className="text-[10px] font-black uppercase hidden sm:inline">Từ chối</span>
                                            </button>
                                        )}
                                        <button onClick={() => setViewFileId(null)} className="p-3 hover:bg-slate-200 rounded-xl transition-all bg-slate-100">
                                            <X className="w-5 h-5 text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-200/50 flex items-center justify-center p-8 overflow-auto">
                                    {pdfUrl ? (
                                        <iframe src={pdfUrl} className="w-full h-full rounded-xl shadow-xl border-0 bg-white" title="PDF Viewer" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl shadow-xl min-h-[400px] w-full max-w-2xl">
                                            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-6" />
                                            <h3 className="text-xl font-black mb-2">Đang tải tài liệu...</h3>
                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Vui lòng chờ giây lát</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
