import { useState, useEffect } from "react";

import { 
  Database, HardDrive, Trash2, Search, RefreshCw, 
  FileText, ShieldAlert, Cpu, CheckCircle2, 
  Trash, SaveAll, AlertTriangle
} from "lucide-react";
import { gooeyToast as toast } from "goey-toast";
import { cn } from "../lib/utils";
import { 
  searchDocuments, restoreDocument, hardDeleteDocument
} from "../services/documentService";
import { 
  getDashboardOverview, getDashboardStorage, getGlobalTrash, emptyGlobalTrash 
} from "../services/adminService";

export function StorageManagement() {
  const [activeTab, setActiveTab] = useState<'FILES' | 'TRASH'>('FILES');
  
  // States - Dashboard Overview
  const [overview, setOverview] = useState<any>(null);
  const [storageUsage, setStorageUsage] = useState<any>(null);

  // States - Files
  const [files, setFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTotal, setFileTotal] = useState(0);

  // States - Trash
  const [trashData, setTrashData] = useState<any[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);

  // Computed Stats from real API data
  const stats = {
    totalFiles: overview?.totalDocuments ?? 0,
    trashCount: (trashData || []).length,
    usedGb: storageUsage?.usedGb ?? 0
  };

  const fetchOverview = async () => {
    try {
      const [overviewRes, storageRes] = await Promise.all([
        getDashboardOverview(),
        getDashboardStorage()
      ]);
      setOverview(overviewRes.data);
      setStorageUsage(storageRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thống kê tổng quan");
    }
  };

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const params: any = { size: 50 };
      if (searchTerm.trim()) params.keyword = searchTerm.trim();
      
      const res = await searchDocuments(params);
      const data = res.data;
      setFiles(Array.isArray(data?.content) ? data.content : []);
      setFileTotal(data?.totalElements ?? 0);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi lấy danh sách tài liệu");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const fetchTrash = async () => {
    setIsLoadingTrash(true);
    try {
      const res = await getGlobalTrash();
      setTrashData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi lấy danh sách thùng rác toàn hệ thống");
    } finally {
      setIsLoadingTrash(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'FILES') {
      fetchFiles();
    } else {
      fetchTrash();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles();
  };

  const handleRestore = async (id: number) => {
    const tId = toast("Đang khôi phục...", { description: "Đang phục hồi tệp từ thùng rác", duration: 15000 });
    try {
      await restoreDocument(id);
      toast.dismiss(tId);
      toast.success("Thành công", { description: "Tài liệu đã được khôi phục về hệ thống" });
      fetchTrash();
      fetchOverview();
    } catch (err) {
      toast.dismiss(tId);
      toast.error("Thất bại", { description: "Không thể khôi phục tài liệu này" });
    }
  };

  const handleHardDelete = async (id: number) => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn tệp vật lý trên MinIO và Database. Không thể khôi phục! Tiếp tục?")) return;
    
    const tId = toast("Đang tiêu hủy...", { description: "Đang xóa cứng tài liệu...", duration: 15000 });
    try {
      await hardDeleteDocument(id);
      toast.dismiss(tId);
      toast.success("Đã tiêu hủy", { description: "Tài liệu đã bị xóa vĩnh viễn khỏi hệ thống" });
      fetchTrash();
      fetchOverview();
    } catch (err) {
      toast.dismiss(tId);
      toast.error("Thất bại", { description: "Không thể xóa cứng tài liệu này" });
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm("CẢNH BÁO NGUY HIỂM: Hành động này sẽ xóa vĩnh viễn TOÀN BỘ tài liệu trong thùng rác hệ thống. Sẽ không thể khôi phục bằng bất cứ cách nào. Bạn có CHẮC CHẮN muốn dọn dẹp hệ thống không?")) return;

    const tId = toast("Đang dọn dẹp hệ thống...", { description: "Quá trình này có thể mất thời gian...", duration: 30000 });
    try {
      await emptyGlobalTrash();
      toast.dismiss(tId);
      toast.success("Thành công", { description: "Thùng rác hệ thống đã được dọn sạch hoàn toàn" });
      fetchTrash();
      fetchOverview();
    } catch (err) {
      toast.dismiss(tId);
      toast.error("Thất bại", { description: "Có lỗi khi dọn dẹp hệ thống" });
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic gradient-text flex items-center gap-3">
             <Database className="w-8 h-8 text-primary" />
             Kho Tài Liệu Tổng
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Theo dõi, rà soát và quản lý rủi ro dung lượng trên toàn hệ thống Server.
          </p>
        </div>
      </div>

       {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-panel p-6 rounded-[32px] overflow-hidden relative shadow-lg bg-white/40">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] -z-10" />
           <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><HardDrive className="w-6 h-6" /></div>
             <div>
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Dung lượng MinIO</p>
               <h3 className="text-2xl font-black">{stats.usedGb} GB</h3>
             </div>
           </div>
           <p className="text-[10px] font-bold text-success mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Real-time tracking</p>
         </div>

         <div className="glass-panel p-6 rounded-[32px] shadow-lg bg-white/40 flex items-center gap-6">
           <div className="w-16 h-16 rounded-3xl cyber-gradient text-white flex items-center justify-center shadow-neon">
             <FileText className="w-8 h-8" />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tổng Tài Liệu</p>
             <h3 className="text-4xl font-black text-primary">{stats.totalFiles}</h3>
             <p className="text-xs font-medium text-success mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã phân mục</p>
           </div>
         </div>

         <div className="glass-panel p-6 rounded-[32px] shadow-lg bg-white/40 border-l-4 border-l-destructive flex items-center justify-between gap-6">
           <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center">
               <Trash2 className="w-8 h-8" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Rác chờ tiêu hủy</p>
               <h3 className="text-4xl font-black text-destructive">{stats.trashCount}</h3>
               <p className="text-xs font-medium text-muted-foreground mt-1">Cần giải phóng định kỳ</p>
             </div>
           </div>
         </div>
      </div>

      {/* MANAGE AREA */}
      <div className="glass-panel rounded-[40px] shadow-2xl bg-white/70 overflow-hidden border-white/60">
        
        {/* TABS HEADER */}
        <div className="flex items-center border-b border-white/60 bg-white/40 px-6 pt-6 gap-6 relative">
           <button 
             onClick={() => setActiveTab('FILES')}
             className={cn("pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2", activeTab === 'FILES' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-slate-800")}
           >
             <Cpu className="w-4 h-4" /> Toàn bộ hệ thống ({fileTotal})
           </button>
           <button 
             onClick={() => setActiveTab('TRASH')}
             className={cn("pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2", activeTab === 'TRASH' ? "border-destructive text-destructive" : "border-transparent text-muted-foreground hover:text-slate-800")}
           >
             <ShieldAlert className="w-4 h-4" /> Thùng rác System
           </button>

           {activeTab === 'TRASH' && (
             <div className="absolute right-6 top-4">
               <button onClick={handleEmptyTrash} className="px-4 py-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                 <AlertTriangle className="w-3 h-3" />
                 Dọn sạch tất cả
               </button>
             </div>
           )}
        </div>

        {/* TAB CONTENT: FILES */}
        {activeTab === 'FILES' && (
          <div className="p-6 lg:p-10 animate-in slide-in-from-bottom-4 duration-500">
             <form onSubmit={handleSearch} className="flex gap-4 mb-8">
               <div className="flex-1 relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                 <input 
                   type="text" 
                   placeholder="Tra cứu tên file nhanh qua API..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full bg-white/50 border border-white/60 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20"
                 />
               </div>
               <button type="submit" className="px-8 py-4 rounded-2xl cyber-gradient text-white text-xs font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                 Tìm Kiếm
               </button>
             </form>

             {isLoadingFiles ? (
                <div className="py-20 flex flex-col items-center justify-center text-primary/50">
                  <RefreshCw className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-bold">Đang tải dữ liệu...</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(files || []).length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="font-bold text-lg">Không tìm thấy tài liệu</p>
                    </div>
                  ) : (
                    files.map(f => (
                      <div key={f.id} className="p-5 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate" title={f.originalName || f.name}>{f.originalName || f.name}</h4>
                          <div className="flex justify-between items-end mt-2">
                             <div>
                               <p className="text-[10px] text-muted-foreground uppercase font-bold">UID: {f.ownerId || f.createdBy || 'Unknown'}</p>
                               <p className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">{formatSize(f.sizeBytes || f.fileSize || 0)}</p>
                             </div>
                             <span className={cn("px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest", f.status === 'APPROVED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                               {f.status || 'DRAFT'}
                             </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             )}
          </div>
        )}

        {/* TAB CONTENT: TRASH */}
        {activeTab === 'TRASH' && (
          <div className="p-6 lg:p-10 bg-slate-50/50 animate-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6 bg-destructive/5 border border-destructive/20 p-4 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-destructive shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-destructive">Khu vực nhạy cảm</h4>
                  <p className="text-xs text-destructive/80 mt-1">Files ở đây đã bị xóa mềm bởi người dùng. Bạn có thể phục hồi giúp họ, hoặc bấm "Tiêu hủy" để dọn sạch dung lượng MinIO vĩnh viễn.</p>
                </div>
             </div>

             {isLoadingTrash ? (
                <div className="py-20 flex justify-center text-destructive/50"><RefreshCw className="w-12 h-12 animate-spin" /></div>
             ) : (
                <div className="space-y-4">
                  {(trashData || []).length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success/40" />
                      <p className="font-bold text-lg">Thùng rác trống!</p>
                      <p className="text-xs mt-1">Hệ thống đang rất gọn gàng Sạch Sẽ.</p>
                    </div>
                  ) : (
                    trashData.map(f => (
                      <div key={f.id} className="glass-panel p-5 rounded-3xl bg-white/80 border-l-4 border-l-destructive flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <Trash className="w-8 h-8 text-destructive/40" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm line-through text-slate-500 truncate max-w-[200px] md:max-w-sm">{f.originalName || f.name}</h4>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 text-destructive/60">UID: {f.ownerId || f.createdBy || 'Unknown'} • Đã xóa lúc {f.updatedAt || f.deletedAt}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                          <button onClick={() => handleRestore(f.id)} className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 hover:border-success hover:text-success rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <SaveAll className="w-4 h-4" /> Khôi phục
                          </button>
                          <button onClick={() => handleHardDelete(f.id)} className="flex-1 md:flex-none px-5 py-2.5 bg-destructive text-white hover:bg-red-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors shadow-[0_8px_16px_rgba(239,68,68,0.3)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.5)]">
                            <Trash2 className="w-4 h-4" /> Tiêu hủy
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}