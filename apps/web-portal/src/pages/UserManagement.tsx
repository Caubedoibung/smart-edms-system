import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, UserCog, MoreHorizontal, Mail, Briefcase, AtSign, Loader2, X, RefreshCw, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";
import { gooeyToast as toast } from "goey-toast";
import { getUsers, createUser, toggleUserStatus, resetUserKeystore, updateUserJobTitle, getAllKeystores } from "../services/userService";

type RoleFilter = "ALL" | "ADMIN" | "MANAGER" | "STAFF";

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [isCreating, setIsCreating] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editJobTitle, setEditJobTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const [res, ksRes] = await Promise.all([
          getUsers(),
          getAllKeystores().catch(() => ({ data: [] })) // Fallback if API fails
      ]);
      const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      const keystores = Array.isArray(ksRes.data) ? ksRes.data : (ksRes.data?.content || []);
      
      const mergedData = data.map((u: any) => {
          const ksInfo = keystores.find((k: any) => String(k.userId) === String(u.id) || String(k.id) === String(u.id));
          return { ...u, hasKeystore: ksInfo ? ksInfo.hasKeystore : u.hasKeystore };
      });
      setUsers(mergedData);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải danh sách", { description: "Không thể lấy danh sách người dùng từ Backend" });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createUser({
        username: newUsername,
        fullName: newFullName,
        email: newEmail,
        role: newRole === 'STAFF' ? 'ROLE_USER' : `ROLE_${newRole}`
      });
      toast.success("Tạo tài khoản thành công", { description: "Mật khẩu mặc định đã được gửi. Tài khoản yêu cầu đổi pass lần đầu." });
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error("Thất bại", { description: err.response?.data?.message || "Lỗi khi tạo người dùng mới." });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await toggleUserStatus(user.id, !user.isActive);
      toast.success("Cập nhật thành công", { description: `Tài khoản ${user.username} đã được ${!user.isActive ? 'mở khóa' : 'tạm khóa'}.` });
      fetchUsers();
    } catch (err) {
      toast.error("Lỗi cập nhật");
    }
  };

  const handleResetKeystore = async (user: any) => {
    if (!window.confirm(`Bạn có chắc muốn reset trạng thái chữ ký số của ${user.fullName}? Người dùng này sẽ được phép khởi tạo chữ ký mới.`)) return;
    try {
      await resetUserKeystore(user.id);
      toast.success("Đã reset chứng thư", { description: `Người dùng ${user.username} hiện có thể tạo chữ ký số mới.` });
      fetchUsers();
    } catch (err) {
      toast.error("Lỗi hệ thống");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await updateUserJobTitle(editingUser.id, editJobTitle);
      toast.success("Cập nhật thành công", { description: "Thông tin nghề nghiệp đã được cập nhật." });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error("Lỗi cập nhật", { description: err.response?.data?.message || "Không thể cập nhật chức danh" });
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setNewUsername("");
    setNewFullName("");
    setNewEmail("");
    setNewRole("STAFF");
  };

  const getUserRole = (user: any) => {
    let roleStrings: string[] = [];
    if (Array.isArray(user.roles)) {
       roleStrings = [...roleStrings, ...user.roles.map((r: any) => typeof r === 'string' ? r : (r.name || r.authority || ''))];
    } 
    if (Array.isArray(user.authorities)) {
       roleStrings = [...roleStrings, ...user.authorities.map((r: any) => typeof r === 'string' ? r : (r.name || r.authority || ''))];
    }
    if (user.role) roleStrings.push(user.role);

    if (roleStrings.length === 0) return 'STAFF';

    roleStrings = roleStrings.map(r => String(r).toUpperCase());

    if (roleStrings.some(r => r.includes('ADMIN'))) return 'ADMIN';
    if (roleStrings.some(r => r.includes('MANAGER'))) return 'MANAGER';
    
    return 'STAFF';
  };

  const filteredUsers = users.filter(u => {
    const uRole = getUserRole(u);
    const matchesSearch = (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchedRole = false;
    if (roleFilter === "ALL") matchedRole = true;
    else matchedRole = (uRole === roleFilter);

    return matchesSearch && matchedRole;
  });

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic gradient-text">Quản Lý Nhân Sự</h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">Điều hành, phân quyền và giám sát tài khoản toàn hệ thống.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3.5 rounded-2xl cyber-gradient text-white font-black text-xs uppercase shadow-neon hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm Tài Khoản
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email, username..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-[20px] pl-12 pr-4 py-4 text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:text-white"
          />
        </div>
        <div className="flex bg-white/50 dark:bg-white/5 p-1.5 rounded-[20px] border border-white/60 dark:border-white/10 shrink-0">
          {(["ALL", "ADMIN", "MANAGER", "STAFF"] as const).map(r => (
            <button 
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                roleFilter === r ? "bg-white dark:bg-white/10 text-primary shadow-sm" : "text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* USERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoadingUsers ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-primary/50">
            <RefreshCw className="w-12 h-12 animate-spin mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">Đang truy vấn Database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-20 glass-panel rounded-[40px] text-center border-dashed border-2">
             <AtSign className="w-16 h-16 mx-auto mb-4 opacity-10" />
             <p className="text-muted-foreground font-bold">Không tìm thấy nhân sự phù hợp.</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <motion.div 
              layout
              key={user.id} 
              className={cn(
                "glass-panel p-6 rounded-[32px] border-white/60 dark:border-white/10 transition-all hover:shadow-2xl hover:-translate-y-1 group relative overflow-hidden",
                !user.isActive ? "bg-slate-50 dark:bg-slate-900/50 grayscale opacity-60" : "bg-white/40 dark:bg-white/5"
              )}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl cyber-gradient text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                    {(user.fullName || user.username).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm truncate dark:text-white" title={user.fullName}>{user.fullName || user.username}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <AtSign className="w-3 h-3" /> {user.username}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border",
                  getUserRole(user) === 'ADMIN' ? "bg-primary/10 text-primary border-primary/20" :
                  getUserRole(user) === 'MANAGER' ? "bg-accent/10 text-accent border-accent/20" :
                  "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {getUserRole(user)}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 text-primary/60" /> <span className="truncate">{user.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <Briefcase className="w-4 h-4 text-primary/60" /> <span>{user.jobTitle || 'Chưa thiết lập'}</span>
                </div>
                {getUserRole(user) === 'MANAGER' && (
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <ShieldAlert className={cn("w-4 h-4", user.hasKeystore ? "text-success" : "text-warning")} />
                    <span className={user.hasKeystore ? "text-success" : "text-warning"}>
                      {user.hasKeystore ? "Đã có Chữ ký số" : "Chưa tạo Chữ ký số"}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/60 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", user.isActive ? "bg-success animate-pulse" : "bg-slate-400")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{user.isActive ? "Online" : "Offline"}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                        setEditingUser(user);
                        setEditJobTitle(user.jobTitle || "");
                    }}
                    className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" 
                    title="Sửa thông tin"
                  >
                    <UserCog className="w-4 h-4" />
                  </button>
                  {getUserRole(user) === 'MANAGER' && user.hasKeystore && (
                    <button 
                      onClick={() => handleResetKeystore(user)}
                      className="p-2 hover:bg-warning/10 hover:text-warning rounded-lg transition-colors" 
                      title="Reset Keystore"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleToggleStatus(user)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      user.isActive ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-success/10 hover:text-success"
                    )}
                    title={user.isActive ? "Khóa tài khoản" : "Mở khóa"}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-panel rounded-[40px] p-8 border-white/60 shadow-2xl bg-white/95 dark:bg-slate-900/95"
            >
              <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <UserCog className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black mb-1 dark:text-white">Cập nhật tài khoản</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">User: {editingUser.username}</p>

              <form onSubmit={handleUpdateUser}>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chức danh / Vị trí</label>
                    <input 
                      type="text" 
                      required
                      value={editJobTitle}
                      onChange={e => setEditJobTitle(e.target.value)}
                      placeholder="VD: Senior Developer..." 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:text-white" 
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase text-muted-foreground bg-slate-100 dark:bg-white/5 hover:bg-slate-200 transition-colors">Hủy</button>
                  <button type="submit" disabled={isUpdating} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase bg-primary text-white shadow-neon hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all">
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Lưu Thay Đổi"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-panel rounded-[40px] p-8 lg:p-10 border-white/60 shadow-[0_32px_128px_rgba(0,0,0,0.4)] bg-white/95 dark:bg-slate-900/95"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              <h3 className="text-2xl font-black tracking-tighter uppercase italic gradient-text mb-1">Thêm Tài Khoản Mới</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-8">Hệ thống sẽ tự cấp mật khẩu tạm thời</p>

              <form onSubmit={handleCreateUser} className="space-y-5">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                      <input 
                        type="text" required value={newUsername} onChange={e => setNewUsername(e.target.value)}
                        placeholder="VD: minh.nguyen" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:text-white" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Họ Tên</label>
                      <input 
                        type="text" required value={newFullName} onChange={e => setNewFullName(e.target.value)}
                        placeholder="VD: Nguyễn Văn Minh" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:text-white" 
                      />
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Công Ty</label>
                    <input 
                      type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                      placeholder="minh.nguyen@smartedms.com" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:text-white" 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vai trò hệ thống</label>
                    <div className="flex gap-3">
                      {(["ADMIN", "MANAGER", "STAFF"] as const).map(r => (
                        <button 
                          key={r} type="button"
                          onClick={() => setNewRole(r)}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                            newRole === r ? "bg-primary/10 border-primary text-primary" : "bg-transparent border-slate-100 dark:border-white/5 text-muted-foreground"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-all">Hủy</button>
                    <button type="submit" disabled={isCreating} className="flex-[2] py-4 rounded-2xl cyber-gradient text-white font-black text-[10px] uppercase shadow-neon hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">
                      {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác Nhận Tạo"}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
