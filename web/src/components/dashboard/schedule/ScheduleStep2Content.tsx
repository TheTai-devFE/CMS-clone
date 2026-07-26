import React from "react";
import { Playlist, Template } from "@/types/dashboard";
import { Check, Layers, Layout } from "lucide-react";
import { UseFormSetValue } from "react-hook-form";

interface ScheduleStep2ContentProps {
  scheduleType: "playlist" | "template";
  selectedPlaylistId: string;
  selectedTemplateId: string;
  playlists: Playlist[];
  templates: Template[];
  setValue: UseFormSetValue<any>;
}

export const ScheduleStep2Content: React.FC<ScheduleStep2ContentProps> = ({
  scheduleType,
  selectedPlaylistId,
  selectedTemplateId,
  playlists,
  templates,
  setValue,
}) => {
  return (
    <div className="space-y-6">
      {/* Loại nội dung */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground block">
          Kiểu nội dung phát
        </label>
        <div className="flex border border-border/80 p-1 bg-muted/30 rounded-xl w-fit gap-1">
          <button
            type="button"
            onClick={() => {
              setValue("scheduleType", "playlist");
              setValue("selectedTemplateId", "");
            }}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
              scheduleType === "playlist"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            Danh sách phát (Playlist)
          </button>
          <button
            type="button"
            onClick={() => {
              setValue("scheduleType", "template");
              setValue("selectedPlaylistId", "");
            }}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
              scheduleType === "template"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            Bố cục hiển thị (Template)
          </button>
        </div>
      </div>

      {/* Danh sách Playlist Card Grid */}
      {scheduleType === "playlist" ? (
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-foreground block">
            Chọn Playlist muốn gán lịch phát *
          </label>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[350px] overflow-y-auto pr-1">
            {playlists.map((pl) => {
              const isSelected = selectedPlaylistId === pl.id;
              return (
                <div
                  key={pl.id}
                  onClick={() => setValue("selectedPlaylistId", pl.id)}
                  className={`p-4.5 border rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between h-[130px] relative overflow-hidden group ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50 shadow-sm"
                      : "border-border/60 bg-card/50 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-semibold text-foreground truncate max-w-[85%]">
                        {pl.playlistName}
                      </h5>
                      {isSelected && (
                        <span className="h-4.5 w-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border/30 pt-2 shrink-0">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase text-muted-foreground">
                      {pl.isSyncGroup ? "Đồng bộ" : "Đơn lẻ"}
                    </span>
                    <span>
                      {new Date(pl.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              );
            })}
            {playlists.length === 0 && (
              <div className="col-span-full py-16 border border-dashed border-border/60 rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-2">
                <Layers className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground italic">
                  Chưa có Playlist nào.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Danh sách Bố cục layout Card Grid */
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-foreground block">
            Chọn Bố cục hiển thị muốn gán lịch phát *
          </label>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[350px] overflow-y-auto pr-1">
            {templates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setValue("selectedTemplateId", tpl.id)}
                  className={`p-4.5 border rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between h-[130px] relative overflow-hidden group ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50 shadow-sm"
                      : "border-border/60 bg-card/50 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-semibold text-foreground truncate max-w-[85%]">
                        {tpl.name}
                      </h5>
                      {isSelected && (
                        <span className="h-4.5 w-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Kích thước: {tpl.width}x{tpl.height}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border/30 pt-2 shrink-0">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[8px] font-semibold text-muted-foreground">
                      {tpl.zones?.length ?? 0} Vùng
                    </span>
                    <span className="capitalize">{tpl.orientation}</span>
                  </div>
                </div>
              );
            })}
            {templates.length === 0 && (
              <div className="col-span-full py-16 border border-dashed border-border/60 rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-2">
                <Layout className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground italic">
                  Chưa có Bố cục hiển thị nào.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
