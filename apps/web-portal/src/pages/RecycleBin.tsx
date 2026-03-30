import { useState, useEffect } from "react";
import {
  Trash2, Search, RefreshCw, RotateCcw, Flame, FileText, Folder,
  AlertTriangle, Clock, HardDrive
} from "lucide-react";
import { gooeyToast as toast } from "goey-toast";
import { cn } from "../lib/utils";
import { getTrashDocuments, restoreDocument, hardDeleteDocument } from "../services/documentService";
import axiosClient from "../lib/axiosClient";

type TrashTab = "documents" | "folders";

export function RecycleBin() {
  const [activeTab, setActiveTab] = useState<TrashTab>("documents");
  const [trashedDocs, setTrashedDocs] = useState<any[]>([]);
  const [trashedFolders, setTrashedFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ─── Fetch documents trash ───
  const fetchDocTrash = async () => {
    setIsLoading(true);
    try {
      const res = await getTrashDocuments();
      setTrashedDocs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Fetch folders trash ───
  const fetchFolderTrash = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any[]>("/categories/trash");
      setTrashedFolders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocTrash();
    fetchFolderTrash();
  }, []);

  // ─── Restore / Hard-Delete for Documents ───
  const handleRestoreDoc = async (id: number) => {
    const tId = toast("Đang khôi phục tài liệu...", { description: "Đang chuyển tệp ra khỏi thùng rác", duration: 15000 });
    try {
      await restoreDocument(id);
      toast.dismiss(tId);
      toast.success("Khôi phục thành công", { description: "Tài liệu đã được đưa trở lại thư mục gốc." });
      fetchDocTrash();
    } catch {
      toast.dismiss(tId);
      toast.error("Khôi phục thất bại", { description: "Không thể khôi phục tài liệu này." });
    }
  };

  const handleHardDeleteDoc = async (id: number) => {
    if (!window.confirm("⚠️ CẢNH BÁO: Tệp sẽ bị xóa VĨNH VIỄN khỏi MinIO + Database. Tiếp tục?")) return;
    const tId = toast("Đang tiêu hủy tài liệu...", { description: "Xóa cứng tệp trên hệ thống...", duration: 15000 });
    try {
      await hardDeleteDocument(id);
      toast.dismiss(tId);
      toast.success("Đã tiêu hủy", { description: "Tài liệu đã bị xóa vĩnh viễn." });
      fetchDocTrash();
    } catch {
      toast.dismiss(tId);
      toast.error("Thất bại", { description: "Không thể xóa cứng tài liệu này." });
    }
  };

  // ─── Restore / Hard-Delete for Folders ───
  const handleRestoreFolder = async (id: number) => {
    const tId = toast("Đang khôi phục thư mục...", { description: "Đang phục hồi thư mục...", duration: 15000 });
    try {
      await axiosClient.put(`/categories/${id}/restore`);
      toast.dismiss(tId);
      toast.success("Khôi phục thành công", { description: "Thư mục đã được đưa trở lại." });
      fetchFolderTrash();
    } catch {
      toast.dismiss(tId);
      toast.error("Khôi phục thất bại", { description: "Không thể khôi phục thư mục này." });
    }
  };

  const handleHardDeleteFolder = async (id: number) => {
    if (!window.confirm("⚠️ Thư mục sẽ bị xóa VĨNH VIỄN. Tiếp tục?")) return;
    const tId = toast("Đang tiêu hủy thư mục...", { duration: 15000 });
    try {
      await axiosClient.delete(`/categories/${id}/hard-delete`);
      toast.dismiss(tId);
      toast.success("Đã tiêu hủy", { description: "Thư mục đã bị xóa vĩnh viễn." });
      fetchFolderTrash();
    } catch {
      toast.dismiss(tId);
      toast.error("Thất bại", { description: "Không thể xóa cứng thư mục này." });
    }
  };

  // ─── Filter ───
  const filteredDocs = trashedDocs.filter(d => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return (d.fileName || '').toLowerCase().includes(t) || (d.title || '').toLowerCase().includes(t);
  });

  const filteredFolders = trashedFolders.filter(f => {
    if (!searchTerm.trim()) return true;
    return (f.name || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const totalTrash = trashedDocs.length + trashedFolders.length;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic gradient-text flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-destructive" />
            Thùng Rác
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Các tài liệu và thư mục bạn đã xóa. Có thể khôi phục hoặc tiêu hủy vĩnh viễn.
          </p>
        </div>
        <button
          onClick={() => { fetchDocTrash(); fetchFolderTrash(); }}
          disabled={isLoading}
          className="px-6 py-3 rounded-2xl cyber-gradient text-white text-xs font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Làm Mới
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl bg-white/40 text-center">
          <p className="text-3xl font-black text-destructive">{totalTrash}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Tổng trong rác</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl bg-white/40 text-center">
          <p className="text-3xl font-black text-primary">{trashedDocs.length}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Tài liệu</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl bg-white/40 text-center">
          <p className="text-3xl font-black text-amber-600">{trashedFolders.length}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Thư mục</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl bg-white/40 text-center">
          <p className="text-3xl font-black text-emerald-600">
            {formatSize(trashedDocs.reduce((sum, d) => sum + (d.fileSize || 0), 0))}
          </p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Dung lượng rác</p>
        </div>
      </div>

      {/* MAIN PANEL */}
      <div className="glass-panel rounded-[40px] shadow-2xl bg-white/70 overflow-hidden border-white/60">
        {/* TABS + SEARCH */}
        <div className="p-6 lg:p-8 border-b border-white/60 bg-white/40 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("documents")}
              className={cn(
                "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === "documents" ? "bg-primary text-white shadow-md" : "bg-white text-muted-foreground hover:bg-slate-50"
              )}
            >
              <FileText className="w-4 h-4" /> Tài liệu ({trashedDocs.length})
            </button>
            <button
              onClick={() => setActiveTab("folders")}
              className={cn(
                "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === "folders" ? "bg-primary text-white shadow-md" : "bg-white text-muted-foreground hover:bg-slate-50"
              )}
            >
              <Folder className="w-4 h-4" /> Thư mục ({trashedFolders.length})
            </button>
          </div>
          <div className="flex-1 relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm trong thùng rác..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/50 border border-white/60 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 lg:p-8">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-primary/50">
              <RefreshCw className="w-12 h-12 animate-spin mb-4" />
              <p className="font-bold">Đang tải thùng rác...</p>
            </div>
          ) : activeTab === "documents" ? (
            /* ─── DOCUMENTS TAB ─── */
            filteredDocs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg">Thùng rác trống</p>
                <p className="text-xs mt-1">Chưa có tài liệu nào bị xóa.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{doc.fileName || doc.title || 'Không có tên'}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-bold">
                        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {formatSize(doc.fileSize)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(doc.updatedAt || doc.createdAt)}</span>
                        {doc.contentType && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] uppercase">{doc.contentType.split('/').pop()}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRestoreDoc(doc.id)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all text-[10px] font-black uppercase flex items-center gap-1.5"
                        title="Khôi phục"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Phục hồi
                      </button>
                      <button
                        onClick={() => handleHardDeleteDoc(doc.id)}
                        className="px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all text-[10px] font-black uppercase flex items-center gap-1.5"
                        title="Xóa vĩnh viễn"
                      >
                        <Flame className="w-3.5 h-3.5" /> Tiêu hủy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* ─── FOLDERS TAB ─── */
            filteredFolders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg">Không có thư mục nào trong rác</p>
                <p className="text-xs mt-1">Các thư mục bạn xóa sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFolders.map((folder, idx) => (
                  <div
                    key={folder.id || idx}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Folder className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{folder.name || 'Thư mục không tên'}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-bold">
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] uppercase">{folder.folderType || 'FOLDER'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(folder.updatedAt || folder.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRestoreFolder(folder.id)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all text-[10px] font-black uppercase flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Phục hồi
                      </button>
                      <button
                        onClick={() => handleHardDeleteFolder(folder.id)}
                        className="px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all text-[10px] font-black uppercase flex items-center gap-1.5"
                      >
                        <Flame className="w-3.5 h-3.5" /> Tiêu hủy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* WARNING FOOTER */}
        {totalTrash > 0 && (
          <div className="px-6 lg:px-8 pb-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800 text-sm">Lưu ý quan trọng</h4>
                <p className="text-xs text-amber-700 mt-1 font-medium leading-relaxed">
                  Các mục trong thùng rác vẫn chiếm dung lượng lưu trữ. Hãy xóa vĩnh viễn những tệp không cần thiết để giải phóng không gian.
                  Thao tác <strong>"Tiêu hủy"</strong> sẽ xóa vĩnh viễn và <strong>KHÔNG THỂ KHÔI PHỤC</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
