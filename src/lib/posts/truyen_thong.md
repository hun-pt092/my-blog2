---
title: "Truyền thông"
date: "2025-05-05"
slug: "truyen_thong"
excerpt: "các bài tập."
coverImage: "/images/truyen-thong.png"
categories: ["công nghệ", "hệ thống phân tán"]
---
# BÀI 1: RabbitMQ: Tổng Quan, Cơ Chế, Chức Năng và Cài Đặt

---

## 1. Tổng Quan RabbitMQ

RabbitMQ là một **message broker** mã nguồn mở, được viết bằng Erlang, hoạt động dựa trên giao thức AMQP (**Advanced Message Queuing Protocol**). Nó cho phép các hệ thống phần mềm trao đổi thông tin một cách bất đồng bộ thông qua hàng đợi (queues).

---

## 2. Cơ Chế Hoạt Động

RabbitMQ hoạt động dựa trên mô hình **Producer - Queue - Consumer**, kết hợp với **Exchange** để định tuyến thông điệp:

### Thành phần chính:

- **Producer:** Gửi thông điệp đến RabbitMQ.
- **Exchange:** Nhận thông điệp từ producer và định tuyến đến một hoặc nhiều hàng đợi.
- **Queue:** Lưu trữ thông điệp tạm thời cho đến khi một consumer xử lý nó.
- **Consumer:** Nhận và xử lý thông điệp từ queue.

### Loại Exchange:

- **Direct Exchange:** định tuyến dựa trên key chính xác.
- **Fanout Exchange:** broadcast đến tất cả các queue.
- **Topic Exchange:** định tuyến dựa trên mẫu key (pattern).
- **Headers Exchange:** định tuyến dựa trên các header.

---

## 3. Chức Năng Chính

- **Tách rời producer và consumer** → tăng khả năng mở rộng.
- **Giao tiếp bất đồng bộ** → phù hợp với hệ thống phân tán.
- **Bảo đảm thứ tự và độ tin cậy của thông điệp**.
- **Hỗ trợ xác thực, phân quyền, SSL**.
- **Cơ chế xác nhận (ack) và retry khi thất bại.**

---

## 4. Cài Đặt RabbitMQ

### Cài đặt trên Ubuntu (hoặc WSL nếu dùng Windows)

```bash
# Cài đặt Erlang (bắt buộc)
sudo apt update
sudo apt install erlang

# Thêm repository và cài đặt RabbitMQ
sudo apt install rabbitmq-server -y

# Khởi động RabbitMQ
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
```

# BÀI 2: Hệ Thống Chat Đơn Giản Sử Dụng RabbitMQ

---

## 🧩 Mô Tả

Hệ thống gồm hai người dùng (User1 và User2), có thể gửi và nhận tin nhắn qua lại **theo thời gian thực** sử dụng **RabbitMQ**. Mỗi người dùng là một **producer** (gửi) và **consumer** (nhận).

---

## 🛠️ Công Nghệ Sử Dụng

- 🐍 Python 3
- 🐰 RabbitMQ (AMQP)
- 📦 Thư viện Python: `pika`

---

## 📦 Cài Đặt

### Cài RabbitMQ (nếu chưa có)

Ubuntu:

```bash
sudo apt update
sudo apt install rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
```

## 📦 Cài thư viện pika
```
pip install pika
```
## Mã Nguồn:user1.py
```
import pika
import threading

def receive():
    def callback(ch, method, properties, body):
        print(f"\n👤 User2: {body.decode()}")

    conn = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = conn.channel()
    channel.queue_declare(queue='user1_queue')
    channel.basic_consume(queue='user1_queue', on_message_callback=callback, auto_ack=True)

    print("📡 Đang chờ tin nhắn từ User2...")
    channel.start_consuming()

def send():
    conn = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = conn.channel()
    channel.queue_declare(queue='user2_queue')

    while True:
        msg = input("💬 You: ")
        channel.basic_publish(exchange='', routing_key='user2_queue', body=msg)

threading.Thread(target=receive, daemon=True).start()
send()
```
## Mã Nguồn:user2.py
```
import pika
import threading

def receive():
    def callback(ch, method, properties, body):
        print(f"\n👤 User1: {body.decode()}")

    conn = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = conn.channel()
    channel.queue_declare(queue='user2_queue')
    channel.basic_consume(queue='user2_queue', on_message_callback=callback, auto_ack=True)

    print("📡 Đang chờ tin nhắn từ User1...")
    channel.start_consuming()

def send():
    conn = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = conn.channel()
    channel.queue_declare(queue='user1_queue')

    while True:
        msg = input("💬 You: ")
        channel.basic_publish(exchange='', routing_key='user1_queue', body=msg)

threading.Thread(target=receive, daemon=True).start()
send()
```

# BÀI 3 :Tìm Hiểu RPC và Demo Thư Viện RPC Sử Dụng JSON (`jsonrpclib`)

---

## 1. Giới thiệu về RPC

**Remote Procedure Call (RPC)** là một kỹ thuật cho phép một chương trình gọi thực thi hàm/thủ tục nằm trên một máy chủ từ xa, như thể đang gọi cục bộ. RPC thường dùng trong hệ thống phân tán, microservices, hoặc khi cần giao tiếp giữa các tiến trình.

---

## 2. Các Thư Viện RPC Phổ Biến Trong Python

| Thư viện         | Định dạng     | Giao thức hỗ trợ | Ghi chú                                    |
|------------------|---------------|------------------|---------------------------------------------|
| `xmlrpc`         | XML           | HTTP             | Tích hợp sẵn trong Python, dễ dùng          |
| `jsonrpclib`     | JSON          | HTTP             | Nhẹ, đơn giản, chuẩn JSON-RPC 2.0           |
| `jsonrpcserver`  | JSON          | HTTP, WSGI       | Hỗ trợ middleware và validation             |
| `tinyrpc`        | JSON          | AMQP, ZMQ, HTTP  | Dùng cho microservices linh hoạt            |
| `aiojsonrpc`     | JSON          | WebSocket, Async | Phù hợp với async app và WebSocket          |

---

## 3. Giới thiệu `jsonrpclib`

- `jsonrpclib` là thư viện Python cho phép triển khai nhanh RPC client/server sử dụng chuẩn **JSON-RPC 2.0**.
- Giao tiếp qua HTTP.
- Mỗi request gửi một JSON object dạng:
  ```json
  {
    "jsonrpc": "2.0",
    "method": "add",
    "params": [1, 2],
    "id": 1
  }


Demo một client/server RPC đơn giản sử dụng `jsonrpclib` qua HTTP.

### 📦 Cài đặt:

```bash
pip install jsonrpclib
```

## 📝 Mã nguồn: `rpc_client.py`

```
python
import xmlrpc.client

# Kết nối đến máy chủ RPC
server = xmlrpc.client.ServerProxy("http://localhost:8000")

# Gọi các hàm từ xa và hiển thị kết quả
try:
    print("5 + 3 =", server.add(5, 3))
    print("10 - 7 =", server.subtract(10, 7))
    print("6 * 4 =", server.multiply(6, 4))
    print("8 / 2 =", server.divide(8, 2))
    print("Căn bậc hai của 16 là:", server.square_root(16))
    print("Căn bậc hai của -4 là:", server.square_root(-4))
except Exception as e:
    print("Lỗi khi gọi RPC:", e)
```

## 📝 Mã nguồn: `pc_server.py`

```
from xmlrpc.server import SimpleXMLRPCServer
import math

# Khởi tạo máy chủ RPC tại địa chỉ và cổng cụ thể
server = SimpleXMLRPCServer(("localhost", 8000))
print("Máy chủ RPC đang chạy tại localhost:8000...")

# Định nghĩa các hàm có thể gọi từ xa
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        return "Lỗi: Không thể chia cho 0"
    return a / b

def square_root(x):
    if x < 0:
        return "Lỗi: Không thể tính căn bậc hai của số âm"
    return math.sqrt(x)

# Đăng ký các hàm với máy chủ
server.register_function(add, "add")
server.register_function(subtract, "subtract")
server.register_function(multiply, "multiply")
server.register_function(divide, "divide")
server.register_function(square_root, "square_root")

# Chạy máy chủ
server.serve_forever()