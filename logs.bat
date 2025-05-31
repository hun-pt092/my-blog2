@echo off
echo === Xem logs của các container ===
echo.
echo Chọn container để xem logs:
echo 1. blog-backend1
echo 2. blog-backend2  
echo 3. nginx-lb
echo 4. cockroach1
echo 5. redis
echo 6. Tất cả containers
echo.
set /p choice="Nhập lựa chọn (1-6): "

if "%choice%"=="1" (
    docker-compose logs -f blog-backend1
) else if "%choice%"=="2" (
    docker-compose logs -f blog-backend2
) else if "%choice%"=="3" (
    docker-compose logs -f nginx-lb
) else if "%choice%"=="4" (
    docker-compose logs -f cockroach1
) else if "%choice%"=="5" (
    docker-compose logs -f redis
) else if "%choice%"=="6" (
    docker-compose logs -f
) else (
    echo Lựa chọn không hợp lệ!
    pause
)
