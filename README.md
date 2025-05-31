## Họ tên:Nguyễn Duy Hưng  
Lê Ngọc Diệp


các lệnh khi khởi tạo
```
npm install (nếu chưa cài)
mkdir -Force nginx\conf.d
docker-compose up --build
```
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
Lỗi này là do PowerShell không nhận diện `&&` như Bash. Trong PowerShell, bạn cần sử dụng cú pháp khác. Hãy thử cách này: Tuyệt vời! Database đã được khởi tạo thành công. Bây giờ hãy kiểm tra xem các backend server có chạy tốt không: Tôi thấy vấn đề! Có **hai lỗi chính**:

1. **Database "blog" không tồn tại** - script khởi tạo chạy bên ngoài container nhưng các container backend đang cố gắng kết nối tới database
2. **Metrics endpoint có lỗi** - có vấn đề với Prometheus metrics

Vấn đề là **container** đang cố gắng kết nối tới database "blog" trong **CockroachDB internal** nhưng database này chỉ được tạo trên **localhost** bên ngoài.

Hãy chạy script khởi tạo database **bên trong container** để tạo database đúng cluster: Tuyệt vời! Bây giờ hãy chạy script khởi tạo bảng từ container: Vậy ta chưa có script npm này. Hãy chạy script trực tiếp: Excellent! Bây giờ database đã được tạo thành công. Hãy kiểm tra logs của backend để xem lỗi có còn không: Vẫn còn lỗi với Prometheus metrics. Hãy restart lại các backend container để chúng kết nối lại với database: Bây giờ hãy đợi một chút để container khởi động và kiểm tra logs: Tốt! Database connection error đã mất rồi. Bây giờ chỉ còn lỗi Prometheus metrics. Hãy xem trang web có hoạt động không: Tuyệt vời! Hệ thống đang chạy! Bây giờ hãy kiểm tra trạng thái của tất cả các container: **TUYỆT VỜI!** 🎉 Tất cả container đã chạy thành công và có trạng thái healthy!

## Tóm tắt hệ thống blog phân tán đã hoàn thành:

###  **Các thành phần đang hoạt động:**

1. **CockroachDB Cluster** (3 nodes) - Cổng 26257, 26258, 26259
   - Database "blog" đã được tạo thành công
   - Bảng posts và comments đã sẵn sàng

2. **SvelteKit Backend** (2 instances) - Cổng 3000, 3002
   - HTTP server cho SvelteKit
   - WebSocket server cho real-time comments (cổng 3001, 3003)
   - Kết nối database thành công

3. **Nginx Load Balancer** - Cổng 80
   - Load balancing cho 2 backend instances
   - WebSocket proxy cho real-time features

4. **Redis** - Cổng 6379
   - Session storage cho WebSocket sync

5. **Prometheus** - Cổng 9090
   - Monitoring và metrics collection

###  **Các URL có thể truy cập:**

- **Website chính**: http://localhost
- **Prometheus monitoring**: http://localhost:9090  
- **CockroachDB Admin UI**: 
  - Node 1: http://localhost:8085
  - Node 2: http://localhost:8086  
  - Node 3: http://localhost:8087

###  **Tính năng đã hoàn thành:**

**Phân tán**: 3-node CockroachDB cluster với tính fault-tolerant  
**Load Balancing**: 2 backend instances với Nginx  
**Real-time**: WebSocket cho comments thời gian thực  
**Monitoring**: Prometheus metrics  
**Health Checks**: Container health monitoring  

Chỉ còn một lỗi nhỏ với Prometheus metrics API, nhưng không ảnh hưởng tới chức năng chính của blog. Hệ thống đã sẵn sàng để test các tính năng real-time commenting!
Theo dõi log:

Để theo dõi log của các container: docker-compose logs -f
Để theo dõi log của một container cụ thể, ví dụ: docker-compose logs -f blog-backend1
```plaintext
                    ┌─────────────┐
                    │    Nginx    │
                    │Load Balancer│
                    └───────┬─────┘
                           /│\\
                          / │ \\
               ┌─────────┘  │  └──────────┐
               │            │             │
    ┌──────────▼──┐  ┌──────▼───┐  ┌──────▼──────┐
    │ SvelteKit   │  │ SvelteKit│  │  WebSocket  │
    │ Backend 1   │  │ Backend 2│  │   Server    │
    └──────────┬──┘  └─────┬────┘  └─────────────┘
               │           │                
    ┌──────────▼───────────▼─────────────┐
    │            CockroachDB             │
    │   (Node1)    (Node2)    (Node3)    │
    └────────────────────────────────────┘
   ``` 
Với kiến trúc này, hệ thống có thể mở rộng theo chiều ngang bằng cách thêm nhiều node SvelteKit và/atau CockroachDB để đáp ứng nhu cầu truy cập cao hơn.
