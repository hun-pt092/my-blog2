## Họ tên:Nguyễn Duy Hưng  
Lê Ngọc Diệp

Xây dựng hệ thống blog phân tán với tính năng bình luận thời gian thực, sử dụng CockroachDB và SvelteKit.

Hướng dẫn khởi động và sử dụng hệ thống
Bây giờ chúng ta đã hoàn thành việc thiết lập hệ thống blog phân tán với tính năng bình luận thời gian thực sử dụng CockroachDB và SvelteKit. Hệ thống của chúng ta có các tính năng sau:

Hạ tầng phân tán:

3 node CockroachDB để lưu trữ dữ liệu phân tán
2 node SvelteKit backend cho việc xử lý request
Nginx load balancer để cân bằng tải giữa các node
Tính năng chính:

Blog đa nền tảng với bài viết markdown
Tính năng bình luận thời gian thực
Đồng bộ dữ liệu giữa các node CockroachDB
Dữ liệu được lưu trữ phân tán và có khả năng chịu lỗi
Các bước để khởi động h
Khởi tạo môi trường:

Đảm bảo bạn đã cài đặt Docker và Docker Compose
Đặc biệt phải đảm bảo các cổng 80, 3000, 3001, 26257-26259 và 8085-8087 không được sử dụng bởi ứng dụng khác
Khởi động hệ thống:

Mở Command Prompt/PowerShell và di chuyển đến thư mục project
Chạy lệnh: start.bat hoặc start.bat
start.bat
Hệ thống sẽ tự động khởi tạo các container, database, và dữ liệu mẫu
Truy cập ứng dụng:

Blog web: http://localhost
Giao diện quản lý CockroachDB: http://localhost:8085
Theo dõi log:

Để theo dõi log của các container: docker-compose logs -f
Để theo dõi log của một container cụ thể, ví dụ: docker-compose logs -f blog-backend1
                    ┌─────────────┐
                    │    Nginx    │
                    │ Load Balancer│
                    └───────┬─────┘
                           /│\
                          / │ \
               ┌─────────┘  │  └─────────┐
               │            │            │
    ┌──────────▼──┐  ┌──────▼──┐  ┌──────▼──────┐
    │ SvelteKit   │  │ SvelteKit│  │  WebSocket  │
    │ Backend 1   │  │ Backend 2│  │   Server    │
    └──────────┬──┘  └────┬─────┘  └─────────────┘
               │           │                
    ┌──────────▼───────────▼─────────────┐
    │            CockroachDB             │
    │   (Node1)    (Node2)    (Node3)    │
    └────────────────────────────────────┘
Với kiến trúc này, hệ thống có thể mở rộng theo chiều ngang bằng cách thêm nhiều node SvelteKit và/atau CockroachDB để đáp ứng nhu cầu truy cập cao hơn.
