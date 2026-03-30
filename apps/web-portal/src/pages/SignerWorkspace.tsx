import { useState, useRef, useEffect } from "react";
import { 
    X, 
     
     
    ZoomIn, 
    ZoomOut, 
    PenTool, 
    CheckCircle2, 
    Info, 
     
    Trash2,
    
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface SignaturePos {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function SignerWorkspace({ fileId, onClose, onSignSuccess }: { fileId: string; onClose: () => void; onSignSuccess?: (id: string) => void }) {

    const [zoom, setZoom] = useState(100);
    const [signatures, setSignatures] = useState<SignaturePos[]>([]);
    const [activeSignId, setActiveSignId] = useState<number | null>(null);
    const [showSignPad, setShowSignPad] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Auto-adjust zoom on mobile
    useEffect(() => {
        if (window.innerWidth < 768) setZoom(45);
    }, []);

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx?.lineTo(x, y);
        ctx?.stroke();
    };

    const handleCompleteSign = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            onSignSuccess?.(fileId);
            onClose();
        }, 2000);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col overflow-hidden"
        >
            {/* Top Bar - High Contrast Cyberpunk */}
            <header className="h-16 lg:h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 lg:px-8 shadow-2xl relative z-10">
                <div className="flex items-center gap-3 lg:gap-5">
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                    <div className="hidden sm:block">
                        <h2 className="text-sm lg:text-base font-black tracking-tight">Hợp đồng - 2024.pdf</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Chế độ trình ký chuyên nghiệp</span>
                        </div>
                    </div>
                </div>

                {/* Controls - Adaptive for Mobile */}
                <div className="flex items-center gap-2 lg:gap-4">
                    <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                        <button onClick={() => setZoom(Math.max(30, zoom - 10))} className="p-2 hover:text-primary"><ZoomOut className="w-4 h-4" /></button>
                        <span className="text-[10px] font-black w-12 text-center">{zoom}%</span>
                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-2 hover:text-primary"><ZoomIn className="w-4 h-4" /></button>
                    </div>

                    <button 
                        onClick={() => setShowSignPad(true)}
                        className="flex items-center gap-2 px-4 lg:px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] lg:text-xs font-black shadow-neon transition-all hover:scale-105"
                    >
                        <PenTool className="w-4 h-4" /> <span className="hidden sm:inline">THÊM CHỮ KÝ</span>
                    </button>
                    
                    <button 
                        onClick={handleCompleteSign}
                        disabled={signatures.length === 0 || isSaving}
                        className={cn(
                            "flex items-center gap-2 px-4 lg:px-6 py-2.5 rounded-xl text-[10px] lg:text-xs font-black transition-all shadow-lg",
                            signatures.length > 0 ? "bg-success text-white hover:brightness-110" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {isSaving ? <span className="animate-spin">⌛</span> : <CheckCircle2 className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isSaving ? "ĐANG XỬ LÝ..." : "HOÀN TẤT & GỬI"}</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* PDF Rendering Area */}
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-4 lg:p-12 flex justify-center custom-scrollbar">
                    <div 
                        className="relative bg-white shadow-[0_30px_100px_rgba(0,0,0,0.2)] origin-top transition-transform duration-300 mb-20"
                        style={{ width: '800px', height: '1100px', transform: `scale(${zoom / 100})` }}
                    >
                        {/* Mock PDF Content */}
                        <div className="absolute inset-0 p-12 lg:p-20 flex flex-col gap-8 select-none pointer-events-none">
                            <div className="h-10 w-1/2 bg-slate-100 rounded-lg" />
                            <div className="space-y-4">
                                <div className="h-4 w-full bg-slate-50 rounded" />
                                <div className="h-4 w-full bg-slate-50 rounded" />
                                <div className="h-4 w-4/5 bg-slate-50 rounded" />
                            </div>
                            <div className="h-64 w-full bg-slate-100/50 rounded-2xl flex items-center justify-center text-slate-300 font-black uppercase tracking-widest">Nội dung văn bản</div>
                            <div className="mt-auto flex justify-between pt-20">
                                <div className="space-y-4 border-2 border-dashed border-slate-200 p-8 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase text-center">Bên A đã ký</p>
                                    <div className="h-16 w-32 bg-primary/5 rounded-xl" />
                                </div>
                                <div className="space-y-4 border-2 border-dashed border-primary/20 p-8 rounded-2xl bg-primary/5">
                                    <p className="text-[10px] font-black text-primary uppercase text-center tracking-widest">Ký tại đây (Bên B)</p>
                                    <div className="h-16 w-32" />
                                </div>
                            </div>
                        </div>

                        {/* Draggable Signatures */}
                        {signatures.map((sig, idx) => (
                            <motion.div
                                key={idx}
                                drag
                                dragMomentum={false}
                                className={cn(
                                    "absolute cursor-move border-2 transition-all p-2",
                                    activeSignId === idx ? "border-primary shadow-neon bg-primary/5" : "border-transparent hover:border-primary/40"
                                )}
                                style={{ left: sig.x, top: sig.y, width: sig.width, height: sig.height }}
                                onDragStart={() => setActiveSignId(idx)}
                            >
                                <svg viewBox="0 0 100 40" className="w-full h-full text-slate-900 drop-shadow-md">
                                    <path d="M10,30 Q30,10 50,30 T90,10" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                                <button 
                                    onClick={() => setSignatures(signatures.filter((_, i) => i !== idx))}
                                    className="absolute -top-3 -right-3 p-1.5 bg-destructive text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 lg:opacity-100"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Info Panel - Hidden on Mobile */}
                <aside className="hidden xl:flex w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 p-8 flex-col gap-8">
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Chi tiết quy trình</h3>
                        <div className="p-5 rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase">Trạng thái hiện tại</p>
                                <p className="text-sm font-bold text-warning">Đang đợi quản lý ký</p>
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-white/10" />
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase">Thời hạn</p>
                                <p className="text-sm font-bold">Còn 2 ngày</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto p-6 rounded-[24px] cyber-gradient text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <Info className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase">Hướng dẫn</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed opacity-90">
                            Nhấn "Thêm chữ ký" để vẽ chữ ký mới, sau đó kéo thả chữ ký vào vị trí cần đóng dấu trên văn bản.
                        </p>
                    </div>
                </aside>
            </div>

            {/* Signature Pad Modal */}
            <AnimatePresence>
                {showSignPad && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
                            onClick={() => setShowSignPad(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/20"
                        >
                            <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-black tracking-tight">Vẽ chữ ký số</h3>
                                <button onClick={() => setShowSignPad(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 lg:p-10 space-y-8">
                                <div className="bg-slate-50 dark:bg-black/20 rounded-[24px] border-2 border-dashed border-slate-200 dark:border-white/10 touch-none">
                                    <canvas 
                                        ref={canvasRef}
                                        width={600} height={300}
                                        className="w-full h-[250px] lg:h-[300px] cursor-crosshair"
                                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)}
                                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0,0,600,300)}
                                        className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-white/10 font-black text-xs text-muted-foreground hover:bg-slate-50 transition-all"
                                    >
                                        LÀM TRỐNG
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setSignatures([...signatures, { x: 450, y: 850, width: 180, height: 100 }]);
                                            setShowSignPad(false);
                                        }}
                                        className="flex-[2] cyber-gradient py-4 rounded-2xl text-white font-black text-xs shadow-neon transition-all hover:scale-[1.02]"
                                    >
                                        SỬ DỤNG CHỮ KÝ
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
