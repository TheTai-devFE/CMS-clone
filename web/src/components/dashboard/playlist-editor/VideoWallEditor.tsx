import React from "react";
import { Device, MediaItem } from "@/types/dashboard";
import { Film, Settings, Check } from "lucide-react";

interface VideoWallEditorProps {
  videoWallRows: number;
  setVideoWallRows: (val: number) => void;
  videoWallCols: number;
  setVideoWallCols: (val: number) => void;
  videoWallMapping: Record<string, string>;
  setVideoWallMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  deviceList: Device[];
  mediaList: MediaItem[];
  videoWallSourceMediaId: string;
  setVideoWallSourceMediaId: (id: string) => void;
}

export const VideoWallEditor: React.FC<VideoWallEditorProps> = ({
  videoWallRows,
  setVideoWallRows,
  videoWallCols,
  setVideoWallCols,
  videoWallMapping,
  setVideoWallMapping,
  deviceList,
  mediaList,
  videoWallSourceMediaId,
  setVideoWallSourceMediaId,
}) => {
  return (
    <div className="flex gap-4 items-start bg-card border border-border p-3 rounded-2xl shadow-sm w-full">
      <div className="flex-1 min-h-[500px] bg-muted/20 border border-border/40 rounded-xl p-6 flex flex-col justify-between space-y-4">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Sơ đồ lắp ráp màn hình (Video Wall Simulator)
          </h4>
          <p className="text-xs text-muted-foreground">
            Gán từng Player (màn hình hiển thị) vật lý vào đúng vị trí tương ứng trong lưới để đồng bộ phát hình ảnh đã cắt.
          </p>
        </div>

        {/* Grid Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="grid gap-3 w-full max-w-4xl transition-all duration-300"
            style={{
              gridTemplateRows: `repeat(${videoWallRows}, minmax(0, 1fr))`,
              gridTemplateColumns: `repeat(${videoWallCols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: videoWallRows }).map((_, rIdx) =>
              Array.from({ length: videoWallCols }).map((_, cIdx) => {
                const cellKey = `${rIdx}-${cIdx}`;
                const selectedDevId = videoWallMapping[cellKey] || "";
                const cellNumber = rIdx * videoWallCols + cIdx + 1;

                return (
                  <div
                    key={cellKey}
                    className={`border rounded-xl p-4 bg-card/60 backdrop-blur-md flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/50 relative overflow-hidden group ${
                      selectedDevId
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/80"
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                          {cellNumber}
                        </span>
                        Ô {rIdx + 1}x{cIdx + 1}
                      </span>
                    </div>

                    <div className="space-y-1 z-10">
                      <select
                        value={selectedDevId}
                        onChange={(e) => {
                          const devId = e.target.value;
                          setVideoWallMapping((prev) => ({
                            ...prev,
                            [cellKey]: devId,
                          }));
                        }}
                        className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-[11px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="">-- Chọn Player --</option>
                        {deviceList.map((dev) => (
                          <option key={dev.id} value={dev.id}>
                            {dev.deviceName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 leading-relaxed">
          💡 **Hướng dẫn:** Video wall sẽ cắt video nguồn ra làm **{videoWallRows * videoWallCols}** phần theo lưới trên. Khi phát, mỗi thiết bị ở ô tương ứng sẽ tự động tải phần video của mình về và chạy đồng bộ tuyệt đối với các ô còn lại qua cơ chế NTP Clock.
        </div>
      </div>

      {/* Video Wall Right Panel: Video Source + Device List */}
      <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col h-[calc(100vh-20rem)] min-h-[400px] rounded-r-xl overflow-hidden">
        <div className="p-3 border-b border-border/60 bg-muted/20">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-primary shrink-0" />
            Cấu hình Video Wall
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
          {/* Rows & Cols */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Số hàng
              </label>
              <input
                type="number"
                value={videoWallRows}
                onChange={(e) => setVideoWallRows(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                min="1"
                max="10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Số cột
              </label>
              <input
                type="number"
                value={videoWallCols}
                onChange={(e) => setVideoWallCols(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full h-8 rounded-md border border-input px-2 py-1 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                min="1"
                max="10"
              />
            </div>
          </div>

          {/* Video Source */}
          <div className="space-y-2 pt-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Chọn Video nguồn *
            </label>
            <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto divide-y divide-border/60 bg-muted/10 pr-1 scrollbar-thin">
              {mediaList
                .filter((media) => media.mimeType.startsWith("video/"))
                .map((media) => {
                  const isSelected = videoWallSourceMediaId === media.id;
                  return (
                    <div
                      key={media.id}
                      onClick={() => setVideoWallSourceMediaId(media.id)}
                      className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 font-bold border-l-2 border-primary"
                          : "hover:bg-muted/80 bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-2 max-w-[80%]">
                        <div className="h-6 w-6 rounded overflow-hidden shrink-0 border border-border/40 bg-zinc-100 flex items-center justify-center">
                          <Film className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <span className="truncate text-[11px] text-foreground">
                          {media.fileName}
                        </span>
                      </div>
                      <div
                        className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                      </div>
                    </div>
                  );
                })}
              {mediaList.filter((media) => media.mimeType.startsWith("video/")).length === 0 && (
                <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                  Không tìm thấy tệp video nào trong thư viện
                </div>
              )}
            </div>
          </div>

          {/* Device List for Video Wall */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Danh sách thiết bị
            </label>
            <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {deviceList.map((dev) => (
                <div key={dev.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/20 text-[11px]">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dev.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  <span className="truncate text-foreground">{dev.deviceName}</span>
                </div>
              ))}
              {deviceList.length === 0 && (
                <div className="text-[10px] text-muted-foreground italic text-center py-2">
                  Không có thiết bị khả dụng
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
