# DT Hotel - Các lỗi đã được sửa

## 1. Lỗi Live Server không load được trang (Cannot GET /pages/...)
**Nguyên nhân**: Live Server chạy từ thư mục gốc project, không phải từ `front-end/`
**Sửa**: Thêm `"liveServer.settings.root": "/front-end"` vào `.vscode/settings.json`

## 2. Logo/hình ảnh không hiện
**Nguyên nhân 1**: File SVG có dấu cách trong tên (`logo 2.svg`, `TaiKhoan 2.svg`, `history 2.svg`, `rent 2.svg`) → browser không load được
**Sửa**: Đổi tên file (bỏ dấu cách): `logo2.svg`, `TaiKhoan2.svg`, `history2.svg`, `rent2.svg` và cập nhật tất cả HTML

## 3. Giao diện Admin bị vỡ layout
**Nguyên nhân**: Thiếu CSS `display: flex; flex-direction: column` cho `body` và `height: 10000px` cứng trên body
**Sửa**: Thêm CSS layout vào `style.css` và xóa hardcoded height

## 4. CORS bị chặn
**Nguyên nhân**: Backend chỉ cho phép `localhost:5000`, không cho `localhost:5502` (Live Server)
**Sửa**: Thêm `localhost:5502` và `127.0.0.1:5502` vào whitelist CORS trong `backend/src/app.js`

## 5. Backend route không tìm thấy trang
**Sửa**: Thêm fallback route `app.get('*', ...)` để serve `index.html` cho mọi route không phải API

## Cách chạy project:
1. **Backend**: Vào thư mục `backend/` → `npm install` → `npm run dev` (chạy port 5000)
2. **Frontend**: Mở VSCode ở thư mục gốc → chuột phải `front-end/index.html` → Open with Live Server (port 5502)
   - HOẶC: Mở trình duyệt vào `http://localhost:5000` (backend tự serve frontend)
