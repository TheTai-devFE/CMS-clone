import { Metadata } from "next";
import ContentManageClient from "../content/manage/ContentManageClient";

export const metadata: Metadata = {
  title: "Danh sách phát | CDM Signage CMS",
  description:
    "Quản lý danh sách phát, tạo và chỉnh sửa playlist cho các thiết bị hiển thị.",
};

export default function PlaylistPage() {
  return <ContentManageClient />;
}
