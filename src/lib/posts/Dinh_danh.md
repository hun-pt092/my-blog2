---
title: "Tìm hiểu về Định danh"
slug: "Tim-hieu-dinh-danh"
date: "2025-05-15"
coverImage: "/images/dinhdanh.png"
categories: ["công nghệ", "hệ thống phân tán"]
---
**Tác giả:** Nguyễn Duy Hưng

## Câu1:
![Ảnh phân tán](/images/cpux.png)
![](/images/vdthread-process.jpg)

## Câu2:Nhà mạng tại Việt Nam và Cơ chế chặn truy cập một số website

## 1. Các nhà mạng (ISP) tại Việt Nam

| Tên nhà mạng | Tên công ty đầy đủ | Ghi chú |
|--------------|---------------------|--------|
| **VNPT**     | Tập đoàn Bưu chính Viễn thông Việt Nam | Nhà nước quản lý, thị phần lớn |
| **Viettel**  | Tập đoàn Công nghiệp – Viễn thông Quân đội | Quân đội quản lý, phát triển mạnh |
| **FPT Telecom** | Công ty Cổ phần Viễn thông FPT | Tư nhân, phổ biến tại thành thị |
| **CMC Telecom** | Công ty Cổ phần Hạ tầng Viễn thông CMC | Nhắm đến khách hàng doanh nghiệp |
| **SCTV**     | Công ty Truyền hình Cáp Saigontourist | Kết hợp truyền hình & internet |
| **Mobifone** | Tổng công ty Viễn thông MobiFone | Trước đây chỉ di động, nay mở rộng |
| **NetNam**   | Công ty Cổ phần NetNam | Nhỏ hơn, phục vụ khối chính phủ |

---

## 2. Vì sao bị chặn truy cập một số website ở Việt Nam?

### Lý do phổ biến:

- Vi phạm pháp luật Việt Nam
- Nội dung phản động, chính trị nhạy cảm
- Khiêu dâm, cờ bạc trực tuyến
- Tin giả, xuyên tạc

### Phương thức chặn:

1. **Chặn DNS**: Tên miền không phân giải được IP
2. **Chặn IP**: Drop traffic đến/đi từ IP
3. **Chặn SNI (Server Name Indication)** trong TLS handshake
4. **DPI (Deep Packet Inspection)**: Phân tích sâu nội dung

---

## 3. Vì sao đổi DNS giúp truy cập được?

- DNS mặc định của nhà mạng có thể chặn truy cập (trả sai IP hoặc không phản hồi)
- Khi đổi DNS sang các DNS công cộng (Google, Cloudflare, Quad9), bạn **tránh được kiểm soát của nhà mạng**

### DNS công cộng phổ biến:

| Nhà cung cấp | Địa chỉ |
|--------------|---------|
| Google DNS | `8.8.8.8`, `8.8.4.4` |
| Cloudflare | `1.1.1.1`, `1.0.0.1` |
| Quad9      | `9.9.9.9` |

>  Nếu website bị chặn bằng IP, SNI hoặc DPI thì đổi DNS **không đủ** → cần VPN, proxy.

---
## 4. Ứng dụng phân tán – Cơ hội và giải pháp

### a. Cơ chế vượt kiểm duyệt phân tán:

- DNS-over-HTTPS (DoH), DNS-over-TLS (DoT)
- Peer-to-peer DNS resolution giữa các node

### b. Proxy/VPN phân tán:

- Tạo mạng relay như Tor hoặc hệ thống proxy mesh
- Ẩn danh hóa và phân phối traffic

### c. Truy cập Web phi tập trung:

- Kết hợp IPFS, libp2p
- Truy cập nội dung không phụ thuộc vào server trung tâm

---

## 5. Ví dụ kỹ thuật

### 🔍 Tra DNS bằng Python (sử dụng Google DNS):

```python
import dns.resolver

resolver = dns.resolver.Resolver()
resolver.nameservers = ['8.8.8.8']  # Dùng DNS của Google

domain = 'example.com'
answers = resolver.resolve(domain, 'A')  # Truy vấn bản ghi A

for rdata in answers:
    print(f"{domain} resolves to {rdata.address}")
```

## 6. Tóm tắt

| Mục | Nội dung |
|-----|----------|
| Nhà mạng chính | VNPT, Viettel, FPT, CMC, SCTV, MobiFone, NetNam |
| Lý do bị chặn | Chính trị, pháp lý, nội dung không phù hợp |
| Đổi DNS có ích khi | Web bị chặn bằng DNS |
| Khi nào DNS không đủ | Bị chặn IP/SNI/DPI |
| Gợi ý ứng dụng phân tán | Relay, DoH/DoT, IPFS, peer-to-peer DNS |

## 7. Tài liệu tham khảo
https://1.1.1.1 - Cloudflare DNS

https://developers.google.com/speed/public-dns - Google DNS

https://www.torproject.org/ - Mạng ẩn danh Tor

https://ipfs.io/ - Hệ thống phân phối nội dung IPFS