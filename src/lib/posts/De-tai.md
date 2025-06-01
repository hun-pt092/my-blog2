---
title: "Deliverable 1: Đề xuất đề tài và mô tả vấn đề"
slug: "mo-ta-van-de"
date: "2025-05-10"
categories: ["web blog"]
---

## 📄 Deliverable 1: Đề xuất đề tài và mô tả vấn đề

---

##  1. Đề tài đề xuất

**Xây dựng hệ thống blog phân tán với tính năng bình luận thời gian thực, sử dụng CockroachDB và SvelteKit.**

---

##  2. Mô tả vấn đề cần giải quyết

Các hệ thống blog hiện nay thường được xây dựng theo mô hình tập trung, dễ gặp phải các vấn đề như:

- Quá tải khi có nhiều người dùng đồng thời.
- Gián đoạn dịch vụ khi server chính gặp sự cố.
- Khó mở rộng sang các khu vực địa lý khác.

Đề tài này hướng tới xây dựng một **nền tảng blog phân tán** với khả năng:

- Cho phép nhiều người dùng đăng bài, bình luận thời gian thực mà vẫn đảm bảo hiệu năng.
- Duy trì hoạt động ổn định ngay cả khi một hoặc vài node gặp lỗi.
- Lưu trữ và truy xuất dữ liệu một cách hiệu quả, nhất quán giữa các node nhờ CockroachDB.

---

##  3. Thư viện / Framework được giao: CockroachDB

###  Mục đích sử dụng

CockroachDB là hệ quản trị cơ sở dữ liệu phân tán mã nguồn mở, hỗ trợ SQL (PostgreSQL-compatible). Nó giúp xây dựng các hệ thống:

- Có khả năng **mở rộng theo chiều ngang**.
- **Tự động phục hồi** khi có lỗi phần cứng.
- **Đảm bảo nhất quán dữ liệu mạnh** trong môi trường phân tán.

###  CockroachDB giải quyết được gì?
| Vấn đề thường gặp trong ứng dụng phân tán      | Giải pháp từ CockroachDB                               |
|------------------------------------------------|--------------------------------------------------------|
| Dữ liệu không nhất quán giữa các node          |  Giao thức đồng thuận Raft giúp đảm bảo consistency |
| Khó mở rộng quy mô hệ thống                    |  Hỗ trợ horizontal scaling không downtime            |
| Khó quản lý lỗi phần cứng hoặc mất node         |  Tự động phục hồi và phân phối lại dữ liệu           |
| Mất dữ liệu khi node gặp lỗi                   |  Replication tự động (3 bản sao mặc định)            |
| Khó triển khai nhiều cụm DB cho vùng địa lý    |  Hỗ trợ multi-region database                        |

###  So sánh CockroachDB với các CSDL/Framework khác

| Tiêu chí              | CockroachDB             | PostgreSQL           | MongoDB              | Redis              |
|-----------------------|--------------------------|-----------------------|-----------------------|--------------------|
| Phân tán dữ liệu      |  Có                    |  Không              |  Có                 |  Có              |
| Hỗ trợ SQL            |  PostgreSQL-compatible |  Chuẩn SQL          |  NoSQL             |  (Key-Value)     |
| Nhất quán mạnh        |  Có                    |  Có                 |  (eventual)        |  Tùy cấu hình    |
| Khả năng mở rộng      |  Tốt                   |  Hạn chế            |  Tốt                |  Tốt             |
| Độ thân thiện         |  Vừa phải              | Dễ                 |  Dễ                |  Dễ              |

### ➕ Ưu điểm
- **Phân tán thực sự**: Không có "master" node – mọi node đều có thể xử lý request, giúp cân bằng tải tự nhiên.
- **Khả năng tự phục hồi**: Khi một node chết, các node còn lại vẫn hoạt động và giữ nguyên dữ liệu.
- **Tính nhất quán mạnh**: Nhờ giao thức Raft, tất cả các thao tác ghi đều được xác nhận qua majority quorum.
- **Tích hợp dễ dàng**: Do tương thích PostgreSQL, các ORM như Prisma, Sequelize... có thể dùng trực tiếp.
- **Triển khai linh hoạt**: Có thể dùng Docker, Kubernetes, hoặc dịch vụ CockroachDB Cloud.

### ➖ Nhược điểm

- Triển khai cụm nhiều node thủ công khá phức tạp.
- Tốn tài nguyên (RAM, CPU) hơn DB truyền thống.
- Không phù hợp cho bài toán nhỏ hoặc hệ thống ít người dùng.

###  Ứng dụng thực tế
- **Tài chính – ngân hàng**: Giao dịch phải được lưu đúng, đầy đủ, không mất dữ liệu ngay cả khi lỗi hệ thống.
- **Mạng xã hội**: Cần xử lý hàng triệu người dùng, lượt like/bình luận theo thời gian thực trên toàn cầu.
- **Thương mại điện tử**: Xử lý tồn kho, đơn hàng và giao dịch từ nhiều vùng địa lý khác nhau.
- **Hệ thống nội dung đa người dùng (CMS/Blog)**: Cho phép đăng tải bài viết, phản hồi/bình luận ngay lập tức và tin cậy.

---

##  4. Ứng dụng CockroachDB trong đề tài blog

###  Vai trò của CockroachDB trong hệ thống

- **Dữ liệu người dùng, bài viết và bình luận** sẽ được lưu dưới dạng các bảng quan hệ tiêu chuẩn.
- CockroachDB **phân tán dữ liệu tự động** trên nhiều node, tránh quá tải tại một điểm.
- Trong trường hợp một node gặp lỗi, dữ liệu vẫn còn ở các node khác (replication 3 bản sao).
- Hỗ trợ tính năng **multi-region** → triển khai blog hoạt động tốt ở nhiều địa điểm (nếu cần).

###  Tích hợp với hệ thống bình luận thời gian thực

- Frontend (SvelteKit) sử dụng WebSocket để lắng nghe bình luận mới.
- Backend nhận bình luận mới, ghi xuống CockroachDB.
- Nhờ tính nhất quán mạnh, các client khác sẽ luôn nhận được dữ liệu cập nhật đúng.

###  Lợi ích mang lại

- Tăng tính **tin cậy và ổn định** của hệ thống blog.
- Cấu trúc **dễ mở rộng** khi có nhiều người dùng hoặc nhu cầu xử lý nhiều bình luận cùng lúc.
- **Hỗ trợ phát triển lâu dài**, vì CockroachDB đã sẵn sàng cho các hệ thống ở quy mô lớn hơn.

---

##  5. Kế hoạch dự kiến giữa kỳ

| Tuần | Công việc                                                                 |
|------|---------------------------------------------------------------------------|
| 1    | Cài đặt và cấu hình cụm CockroachDB nhiều node bằng Docker               |
| 2    | Thiết kế CSDL: bảng User, Post, Comment                                  |
| 3    | Xây dựng giao diện frontend với SvelteKit                                |
| 4    | Kết nối frontend ↔ backend ↔ CockroachDB, viết API cơ bản                |
| 5    | Triển khai WebSocket cho bình luận thời gian thực                        |
| 6    | Mô phỏng lỗi node, kiểm thử tính nhất quán và khả năng phục hồi          |
| 7    | Viết báo cáo giữa kỳ, hoàn thiện phần chức năng cần demo                 |

###  Chức năng hoàn thành trong giữa kỳ:

- CRUD bài viết.
- Giao diện viết và xem bài.
- Kết nối hệ thống với CockroachDB phân tán.
- Xử lý thêm/lấy bình luận (có thể kết nối sẵn WebSocket nếu kịp).
