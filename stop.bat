@echo off
echo === Dừng hệ thống blog phân tán ===

:: Dừng tất cả container
echo === Dừng các container Docker ===
docker-compose down

:: Xóa các volume (nếu muốn reset hoàn toàn)
set /p reset="Bạn có muốn xóa tất cả dữ liệu (y/N)? "
if /i "%reset%"=="y" (
    echo === Xóa các volume ===
    docker-compose down -v
    docker system prune -f
    echo === Đã xóa tất cả dữ liệu ===
)

echo === Hệ thống đã dừng ===
pause
