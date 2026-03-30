
import { useState, useEffect, useMemo } from "react";
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
    Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FileItem, User } from "../lib/types";
import { cn } from "../lib/utils";

interface FileExplorerProps {
    title: string;
    currentFolderId: string | null;
    ownerId?: string | null;
    user?: User | null;
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

export function FileExplorer({ title, currentFolderId, ownerId, user, onFolderChange }: FileExplorerProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    
    const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
    const [viewFileId, setViewFileId] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Click outside to close context menu
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Simulate realtime loading when folder changes
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600); // 600ms of "Cyber Retrieval" time
        return () => clearTimeout(timer);
    }, [currentFolderId]);

    const currentFiles = useMemo(() => {
        const filtered = files.filter(f => {
            if (f.isDeleted) return false;
            const matchesParent = f.parentId === currentFolderId;
            
            // If viewing personal files
            if (ownerId) return matchesParent && f.owner === ownerId;
            
            // If viewing department files and user is Manager
            if (user && user.role === 'MANAGER' && title === "Kho phòng ban") {
                // A manager can only see folders/files that belong to users in their department
                const fileOwner = ([] as any[]).find(u => u.id === f.owner);
                if (fileOwner && fileOwner.department !== user.department) {
                    return false; // Filter out if owner is not in the same department
                }
            }
            
            return matchesParent;
        });

        // Sort: Folders first, then files
        return filtered.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return 0;
        });
    }, [currentFolderId, ownerId, user, title, files]);

    const handleFileClick = (e: React.MouseEvent, file: FileItem) => {
        e.preventDefault();
        e.stopPropagation();
        if (file.type === 'folder') {
            onFolderChange(file.id);
        } else {
            setViewFileId(file.id);
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

    const handleCreateFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        
        toast.success(`Đã tạo thư mục: ${newFolderName}`);

        const newFolder: FileItem = {
            id: `folder_${Date.now()}`,
            name: newFolderName,
            type: 'folder',
            size: '--',
            updatedAt: new Date().toLocaleDateString(),
            owner: ownerId || user?.id || 'sys',
            status: 'draft',
            parentId: currentFolderId
        };
        setFiles([newFolder, ...files]);
        setShowNewFolderModal(false);
        setNewFolderName("");
    };

    const handleMockUpload = (e?: React.ChangeEvent<HTMLInputElement>) => {
        let uploadedFileName = "Tai_Lieu_Moi_Upload.pdf";
        if (e && e.target.files && e.target.files.length > 0) {
            uploadedFileName = e.target.files[0].name;
        }
        
        setIsUploadModalOpen(false);

        const uploadTask = new Promise((resolve) => setTimeout(resolve, 1500));

        toast.promise(
            uploadTask, 
            {
                loading: `Đang tải lên: ${uploadedFileName}...`,
                success: `Tải lên thành công!`,
                error: 'Tải lên thất bại'
            }
        );
        
        uploadTask.then(() => {
            const fileExt = uploadedFileName.split('.').pop()?.toLowerCase();
            let validExt: 'pdf' | 'docx' | 'xlsx' | 'image' = 'pdf';
            if (fileExt === 'docx') validExt = 'docx';
            else if (fileExt === 'xlsx') validExt = 'xlsx';
            else if (['png', 'jpg', 'jpeg'].includes(fileExt || '')) validExt = 'image';

            const newDoc: FileItem = {
                id: `doc_${Date.now()}`,
                name: uploadedFileName,
                type: validExt,
                size: '2.5 MB',
                updatedAt: new Date().toLocaleDateString(),
                owner: ownerId || user?.id || 'sys',
                status: 'draft',
                parentId: currentFolderId
            };
            setFiles(prev => [newDoc, ...prev]);
        });
    };

    const handleDelete = (id: string) => {
        setFiles(files.map(f => {
            if (f.id === id) {
                toast(`Đã chuyển "${f.name}" vào thùng rác`, { icon: '🗑️' });
                // If it was pending or signed, we might want to log it or notify
                // But for now, we just mark it as deleted
                return { ...f, isDeleted: true, deletedAt: new Date().toISOString() };
            }
            return f;
        }));
        setContextMenu(null);
        // Dispatch custom event for notifications if needed, or simply let the app know (mocking)
    };

    const handleRecall = (id: string) => {
        setFiles(files.map(f => {
            if (f.id === id) {
                toast.success(`Đã thu hồi tài liệu "${f.name}"`);
                return { ...f, status: 'draft' };
            }
            return f;
        }));
        setContextMenu(null);
    };

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'folder': return <Folder className="w-10 h-10 text-primary" />;
            default: return <FileText className="w-10 h-10 text-destructive" />;
        }
    };

    const fileToView = files.find(f => f.id === viewFileId);

    // Build breadcrumbs optimally with useMemo to prevent unnecessary recalculations
    const breadcrumbs = useMemo(() => {
        const crumbs = [];
        let curr = currentFolderId;
        const visited = new Set<string>(); // Prevent infinite loops in case of malformed data
        while (curr && curr !== 'root' && curr !== 'dept_root' && !visited.has(curr)) {
            visited.add(curr);
            const f = files.find(x => x.id === curr);
            if (f) {
                crumbs.unshift({ id: f.id, name: f.name });
                curr = f.parentId;
            } else {
                break;
            }
        }
        return crumbs;
    }, [currentFolderId, files]);

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
                                <motion.div 
                                    key={file.id} 
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => handleFileClick(e, file)} 
                                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                                    className={cn(
                                        "glass-panel rounded-[32px] group cursor-pointer hover:border-primary/40 transition-all shadow-xl bg-white/40 dark:bg-slate-900/40 relative",
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
                                </motion.div>
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
                            {contextMenu && files.find(f => f.id === contextMenu.id)?.status === 'pending' && (
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
                                    onChange={handleMockUpload} 
                                    title="Kéo thả hoặc click để chọn file"
                                />
                                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 text-primary">
                                    <FileUp className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-black text-primary mb-2">Click hoặc kéo thả file vào đây</p>
                            </div>

                            <button onClick={() => handleMockUpload()} className="w-full mt-6 py-4 rounded-2xl cyber-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-neon hover:scale-[1.02] transition-transform">
                                Bắt đầu tải lên
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Document Modal */}
            <AnimatePresence>
                {viewFileId && fileToView && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-4xl h-[85vh] glass-panel rounded-[40px] overflow-hidden border-white/60 shadow-2xl bg-white flex flex-col"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-xl"><FileText className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="font-black text-lg">{fileToView.name}</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trạng thái: <span className="text-warning">Chờ xử lý</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-3 bg-primary text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                        <PenTool className="w-4 h-4" /> <span className="text-[10px] font-black uppercase hidden sm:inline">Trình Ký Ngay</span>
                                    </button>
                                    <button onClick={() => setViewFileId(null)} className="p-3 hover:bg-slate-200 rounded-xl transition-all bg-slate-100">
                                        <X className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-200/50 flex items-center justify-center p-8 overflow-auto">
                                <div className="w-full max-w-2xl bg-white shadow-xl min-h-[800px] p-12 relative animate-in slide-in-from-bottom-8 duration-700">
                                    <div className="text-center mb-10 border-b pb-6">
                                        <h1 className="text-2xl font-bold uppercase mb-2">Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</h1>
                                        <p className="font-bold underline">Độc lập - Tự do - Hạnh phúc</p>
                                    </div>
                                    <h2 className="text-xl font-bold text-center mb-8">{fileToView.name.replace('.pdf', '').replace('.docx', '')}</h2>
                                    <div className="space-y-4 text-sm leading-relaxed text-justify">
                                        <p>Đây là bản xem trước nội dung tài liệu. Hệ thống hỗ trợ đọc trực tiếp các định dạng PDF và Office mà không cần tải về máy.</p>
                                        <div className="h-4 bg-slate-100 rounded w-full mt-8"></div>
                                        <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        <div className="h-4 bg-slate-100 rounded w-4/6"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
