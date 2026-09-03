import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 落地雷达",
  description: "每天追踪 AI 从论文、产品到企业生产部署与业务结果的证据。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body><main>{children}</main></body>
    </html>
  );
}
