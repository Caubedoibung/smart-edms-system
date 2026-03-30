import { useState, useEffect } from "react";
import {
  History, Search, RefreshCw, Filter, FileText, UserCog, 
  Trash2, Upload, ShieldCheck, AlertTriangle, CheckCircle2, Eye,
  Trash, SaveAll
} from "lucide-react";
import { gooeyToast as toast } from "goey-toast";
import { cn } from "../lib/utils";
import { getAuditLogs } from "../services/auditService";

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'CREATE_DOCUMENT': { label: 'Tạo tài liệu', color: 'bg-emerald-100 text-emerald-700', icon: FileText },
  'DELETE_DOCUMENT': { label: 'Xóa tài liệu', color: 'bg-red-100 text-red-700', icon: Trash2 },
  'UPLOAD_DOCUMENT': { label: 'Upload file', color: 'bg-blue-100 text-blue-700', icon: Upload },
  'APPROVE_DOCUMENT': { label: 'Phê duyệt', color: 'bg-green-100 text-green-700', icon: ShieldCheck },
  'REJECT_DOCUMENT': { label: 'Từ chối', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  'CREATE_USER': { label: 'Tạo User', color: 'bg-violet-100 text-violet-700', icon: UserCog },
  'LOGIN': { label: 'Đăng nhập', color: 'bg-cyan-100 text-cyan-700', icon: CheckCircle2 },
  'VIEW_DOCUMENT': { label: 'Xem tài liệu', color: 'bg-slate-100 text-slate-700', icon: Eye },
  'EMPTY_ALL_TRASH': { label: 'Dọn sạch thùng rác', color: 'bg-rose-100 text-rose-700', icon: Trash },
  'RESTORE_DOCUMENT': { label: 'Khôi phục tài liệu', color: 'bg-teal-100 text-teal-700', icon: RefreshCw },
  'UPLOAD_NEW_VERSION': { label: 'Cập nhật phiên bản', color: 'bg-indigo-100 text-indigo-700', icon: SaveAll },
};

export function SystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filterAction) params.action = filterAction;
      const res = await getAuditLogs(params);
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải nhật ký", { description: "Không thể kết nối Audit Service" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction]);

  const filteredLogs = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(term) ||
      (log.performedBy || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term)
    );
  });

  const getActionInfo = (action: string) => {
    return ACTION_CONFIG[action] || { label: action, color: 'bg-slate-100 text-slate-600', icon: History };
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic gradient-text flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Nhật Ký Hệ Thống
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Giám sát và kiểm tra toàn bộ hành vi hoạt động trong hệ thống.
          </p>
        </div>
        <button
          onClick={fetchLogs}
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
          <p className="text-3xl font-black text-primary">{logs.length}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Tổng sự kiện</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl bg-white/40 text-center">
          <p className="text-3xl font-black text-emerald-600">{logs.filter(l => l.action === 'CREATE_DOCUMENT' || l.action === 'UPLOAD_DOCUMENT').length}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Tạo / Upload</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl bg-white/40 text-center">
          <p className="text-3xl font-black text-red-600">{logs.filter(l => l.action === 'DELETE_DOCUMENT').length}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Xóa tài liệu</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl bg-white/40 text-center">
          <p className="text-3xl font-black text-violet-600">{logs.filter(l => l.action === 'LOGIN' || l.action === 'CREATE_USER').length}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Auth Events</p>
        </div>
      </div>

      {/* FILTER + SEARCH */}
      <div className="glass-panel rounded-[40px] shadow-2xl bg-white/70 overflow-hidden border-white/60">
        <div className="p-6 lg:p-8 border-b border-white/60 bg-white/40 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm theo hành vi, người thực hiện..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/50 border border-white/60 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="appearance-none bg-white/50 border border-white/60 rounded-2xl pl-11 pr-10 py-4 text-sm font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[200px]"
            >
              <option value="">Tất cả hành vi</option>
              {Object.entries(ACTION_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* LOG TABLE */}
        <div className="p-6 lg:p-8">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-primary/50">
              <RefreshCw className="w-12 h-12 animate-spin mb-4" />
              <p className="font-bold">Đang tải nhật ký hệ thống...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">Chưa có sự kiện nào được ghi nhận</p>
              <p className="text-xs mt-1">Audit Service đang lắng nghe... Mọi hành vi sẽ được ghi lại tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, idx) => {
                const info = getActionInfo(log.action);
                const IconComp = info.icon;
                return (
                  <div
                    key={log._id || idx}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", info.color)}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest", info.color)}>
                          {info.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold">
                          bởi <strong className="text-slate-700">{log.actorName || log.performedBy || log.userId || '—'}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate" title={log.details}>
                        {log.details || log.description || 'Không có mô tả chi tiết'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">{formatTime(log.timestamp || log.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
