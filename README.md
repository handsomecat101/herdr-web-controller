# ⚡ Herdr Web Controller

> **Trình Điều Khiển Web & Mobile Trực Quan Dành Cho Herdr Terminal Multiplexer**

Dự án này là lớp giao diện Web (Web UI & Mobile Dashboard) được xây dựng cho **[Herdr](https://herdr.dev)** — Terminal Multiplexer chuyên dụng để quản lý và điều phối các AI Coding Agent (Cursor, OpenCode, Claude Code, Codex, Antigravity...).

---

## 🌟 Tính Năng Nổi Bật (Key Features)

* 📱 **Mobile-First Responsive**: Thiết kế tối ưu cho điện thoại di động với màn hình full-width, thanh trượt Drawer chọn dự án, và phím bấm ngón tay tiện lợi.
* 📁 **1-Click Project Switcher**: Liệt kê toàn bộ các thư mục dự án trên máy. Bấm vào bất kỳ dự án nào là Herdr tự động tạo Workspace và chuyển terminal tới đó.
* 🪟 **Quản Lý Đa Cửa Sổ (Multi-Pane / Tabs)**:
  * Hiển thị danh sách các cửa sổ terminal đang mở (`Cửa sổ 1`, `Cửa sổ 2`...).
  * Nút `[➕ Thêm Cửa Sổ]` để tách ô terminal mới (`herdr pane split`) và tự động chuyển ngay sang cửa sổ đó.
* ⌨️ **Tương Tác Trực Tiếp (Tap to Type)**:
  * Chạm bất kỳ đâu trên màn hình terminal để kích hoạt bàn phím ảo trên điện thoại.
  * Hỗ trợ thanh lệnh nhanh: `dir`, `git status`, `agents`, `tách pane`.
* 🌐 **Zero-Build, Siêu Nhẹ**: Chạy thuần Node.js tiêu chuẩn + Tailwind CSS qua CDN. Không cần cài đặt dependencies cồng kềnh.

---

## 🚀 Cài Đặt & Sử Dụng (Quick Start)

### 1. Yêu cầu
* Node.js v18 trở lên.
* Herdr CLI (`herdr` hoặc `herdr.exe`) đang chạy chế độ server:
  ```bash
  herdr server
  ```

### 2. Khởi động Web Controller
```bash
git clone https://github.com/handsomecat101/herdr-web-controller.git
cd herdr-web-controller
node server.js
```
Truy cập giao diện tại: **`http://localhost:3840`**

### 3. Điều khiển từ xa qua Điện thoại (Cloudflare Tunnel)
Để mở link truy cập từ điện thoại ngoài mạng nội bộ:
```bash
cloudflared tunnel --url http://localhost:3840
```

---

## 📖 Dành Cho AI Agent Tiếp Quản
Nếu bạn là một AI Agent đang tiếp tục phát triển dự án này trên thiết bị mới, vui lòng đọc tài liệu bàn giao chi tiết tại:  
👉 **[`AGENT_HANDOVER.md`](./AGENT_HANDOVER.md)**
