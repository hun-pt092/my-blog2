@echo off
echo === Khởi động hệ thống blog phân tán ===

:: Tạo thư mục Nginx nếu chưa có
mkdir nginx\conf.d 2>nul

:: Dừng và xóa các container cũ (nếu có)
echo === Dọn dẹp các container cũ ===
docker-compose down

:: Khởi động Docker Compose
echo === Khởi động các container Docker ===
docker-compose up -d

:: Đợi các container khởi động (30 giây)
echo === Đợi các container khởi động ===
timeout /t 30 /nobreak

:: Kiểm tra trạng thái container
echo === Kiểm tra trạng thái container ===
docker ps

:: Khởi tạo database
echo === Khởi tạo database CockroachDB ===
docker-compose exec blog-backend1 npm run db:init

:: Đợi một chút trước khi seed data
timeout /t 5 /nobreak

:: Thêm dữ liệu mẫu
echo === Thêm dữ liệu mẫu ===
docker-compose exec blog-backend1 npm run db:seed

echo === Hệ thống đã khởi động thành công ===
echo - Trang web có thể truy cập tại: http://localhost
echo - Giao diện quản lý CockroachDB có thể truy cập tại: http://localhost:8085
echo === Nhấn phím bất kỳ để tiếp tục ===
pause
