# 🤖 AGENT HANDOVER & TECHNICAL SPECIFICATION

> **Dành cho Agent tiếp quản trên thiết bị mới**: Tài liệu này tóm tắt toàn bộ bối cảnh, kiến trúc hiện tại, các quyết định thiết kế và lộ trình phát triển tiếp theo để bạn có thể git clone về và tiếp tục làm việc ngay mà không phải mò mẫm từ đầu.

---

## 1. Bối Cảnh & Mục Tiêu Dự Án (Context & Goal)

* **Vấn đề của người dùng (Anh Tuấn - @handsomecat101)**:
  * Anh Tuấn sử dụng nhiều AI Coding Agent khác nhau (`cursor`, `opencode`, `claude`, `codex`, `antigravity`...).
  * Anh thường xuyên phải làm "router chạy bằng cơm" giữa các công cụ (đọc code từ IDE này, copy-paste sang IDE kia, canh chừng lệnh...).
  * Máy tính anh có cài đặt **Herdr v0.9.3** (`herdr.exe`), một Terminal Multiplexer chuyên dụng để điều phối AI Coding Agent. Tuy nhiên giao diện gốc của Herdr là TUI dòng lệnh đen sì, khó chọn dự án và khó dùng trên điện thoại di động khi anh ra ngoài.
* **Mục tiêu của dự án này (`herdr-web-controller`)**:
  * Xây dựng một **Web Controller / Mobile-Friendly Dashboard** kết nối trực tiếp với Herdr Daemon (`herdr.sock`).
  * Cho phép chọn dự án bằng 1 chạm từ danh sách các folder trên máy.
  * Hiển thị giao diện chia ô Terminal (Panes) chuẩn như TUI của Herdr nhưng tối ưu hóa cho màn hình điện thoại (Mobile First).
  * Hỗ trợ chuyển đổi qua lại giữa các cửa sổ CMD/Shell đang chạy, tách cửa sổ mới (`herdr pane split`), và gửi lệnh trực tiếp vào các Agent.

---

## 2. Kiến Trúc Kỹ Thuật Hiện Tại (Current Architecture)

```
[Mobile Phone / Desktop Browser]
             ▲
             │  (HTTP REST + Realtime Polling)
             ▼
[Herdr Web Controller Backend (Node.js - server.js)]
   - Port mặc định: 3840
   - Không phụ thuộc framework nặng (chạy thuần native http/child_process)
             ▲
             │  (CLI IPC / Socket API)
             ▼
[Herdr Engine Core (herdr.exe / herdr server)]
   - Socket: C:\Users\...\AppData\Roaming\herdr\herdr.sock
   - Quản lý: Workspaces (Dự án) -> Tabs -> Panes (Terminals)
             ▲
             │  (Chạy tương tác)
             ▼
[Các Coding Agents: cursor, opencode, claude, codex...]
```

---

## 3. Cấu Trúc Mã Nguồn (Codebase Structure)

* `server.js`:
  * Backend API viết bằng Node.js tiêu chuẩn.
  * Tự động quét các folder dự án trong thư mục gốc.
  * Giao tiếp với `herdr.exe` qua child process:
    * `GET /api/projects`: Liệt kê các thư mục dự án và danh sách workspace hiện có.
    * `POST /api/workspaces/open`: Mở hoặc chuyển đổi workspace sang folder dự án mới (`herdr workspace create --cwd ...`).
    * `GET /api/panes`: Lấy danh sách các Pane trong workspace đang chọn.
    * `GET /api/pane/:id/read`: Đọc buffer nội dung terminal thật của pane đó (`herdr pane read <pane_id> --lines 60`).
    * `POST /api/pane/:id/run`: Gửi lệnh thực thi vào pane (`herdr pane run <pane_id> "<cmd>"`).
    * `POST /api/pane/split`: Tách ô terminal mới (`herdr pane split <target_pane> --direction right --focus`).
* `public/index.html`:
  * Giao diện Responsive dùng Tailwind CSS (Dark theme chuẩn Herdr `#090d16` / `#0d1117`).
  * **Sidebar Drawer (Ngăn kéo dự án)**: Ẩn/hiện mượt mà trên mobile, có nút `☰ DỰ ÁN`, nút `✕ ĐÓNG`, có ô tìm kiếm nhanh tên dự án.
  * **Window Switcher Bar (Thanh chọn cửa sổ)**: Hiển thị danh sách các Pane đang mở: `[Cửa sổ 1: w2:p1]`, `[Cửa sổ 2: w2:p2]` kèm nút nổi bật **`[➕ Thêm Cửa Sổ]`**.
  * **Màn hình Terminal**: Chiếm 100% chiều rộng trên mobile, có viền cam nổi bật cho active pane, tính năng chạm bất kỳ đâu để bật bàn phím (`focusInput()`).
  * **Thanh nhập lệnh**: Cố định ở đáy (`100dvh`), có con trỏ nhấp nháy, không bị thanh điều hướng che.
* `public/app.js`:
  * Logic điều khiển UI, quản lý state `activePaneId`, `activeWsId`, `currentCwd`.
  * Tự động poll làm mới terminal mỗi 2 giây.
  * Xử lý chuyển đổi workspace, tách pane và gửi lệnh.
* `start_web.bat`:
  * File khởi chạy 1-click cho người dùng trên Windows.

---

## 4. Cách Thiết Lập & Chạy Trên Máy Tính Mới (Setup on New Machine)

1. **Yêu cầu môi trường**:
   * Node.js v18+ cài sẵn.
   * Herdr CLI (`herdr` hoặc `herdr.exe`) cài đặt và chạy server:
     ```bash
     herdr server
     ```
     *(Để socket Herdr sẵn sàng nhận lệnh).*
2. **Khởi động Web Controller**:
   ```bash
   cd herdr-web-controller
   node server.js
   ```
   Server sẽ lắng nghe tại `http://localhost:3840`.
3. **Mở ra Internet để điều khiển từ điện thoại (Tùy chọn)**:
   ```bash
   cloudflared tunnel --url http://localhost:3840
   ```
   Cloudflare sẽ cấp một link HTTPS (hoặc dùng custom domain `herdr.<domain>`) để truy cập từ bất cứ đâu.

---

## 5. Nhiệm Vụ Tiếp Theo Cần Làm (Roadmap & Action Items Cho Agent Mới)

Dưới đây là các tính năng được định hướng để bạn phát triển tiếp:

1. **Tích hợp WebTTY / xterm.js hai chiều thực thụ**:
   * Hiện tại frontend đang dùng cơ chế poll `herdr pane read` + `herdr pane run`.
   * **Cải tiến**: Tích hợp `xterm.js` qua WebSocket để có trải nghiệm terminal PTY thực sự mượt mà (hỗ trợ phím mũi tên, Ctrl+C, live character streaming).
2. **Quy trình Chaining tự động (Agent A -> Agent B)**:
   * Xây dựng giao diện kéo-thả hoặc nút chọn chuỗi: Ví dụ chọn `Coder (Opencode/Claude) -> Reviewer (Codex)`.
   * Sử dụng lệnh `herdr agent prompt <name> "<prompt>" --wait` để tự động hóa việc chuyền kết quả giữa các pane.
3. **Quản lý đa máy tính (Multi-Machine / Remote Profiles)**:
   * Tận dụng cờ `herdr --machine <machine_id>` để kết nối và điều phối các agent đặt trên các máy tính khác nhau.
