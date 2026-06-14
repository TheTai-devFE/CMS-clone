export const dynamic = "force-dynamic";

import { Metadata } from "next";
import ContentManageClient from "./ContentManageClient";

export const metadata: Metadata = {
  title: "Quản lý nội dung | CDM Signage CMS",
  description:
    "Quản lý danh sách phát và cấu hình trình chiếu quảng cáo dạng bảng.",
};

export default function ContentManagePage() {
  return <ContentManageClient />;
}
