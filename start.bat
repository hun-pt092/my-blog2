@echo off
echo === Khởi động hệ thống blog phân tán ===

:: Tạo thư mục Nginx nếu chưa có
mkdir nginx\conf.d 2>nul

:: Khởi động Docker Compose
echo === Khởi động các container Docker ===
docker-compose up -d

:: Khởi tạo database
echo === Khởi tạo database CockroachDB ===
timeout /t 15 /nobreak

:: Thực thi các lệnh khởi tạo database
docker-compose exec blog-backend1 npm run db:init
docker-compose exec blog-backend1 npm run db:seed

echo === Hệ thống đã khởi động thành công ===
echo - Trang web có thể truy cập tại: http://localhost
echo - Giao diện quản lý CockroachDB có thể truy cập tại: http://localhost:8085
echo === Nhấn phím bất kỳ để tiếp tục ===
pause
