---
title: "Tiến trình & Luồng"
slug: "tien-trinh-luong"
date: "2025-05-04"
excerpt: "Nói về hiệu năng máy tính của tôi, các bài toán sử dụng đa luồng đa tiến trình."
coverImage: "/images/tien_trinh.png"
coverWidth: 1200
coverHeight: 1300
categories: ["công nghệ","hệ thống phân tán"]
---
# Tiến Trình & Luồng

## 1. Hiệu năng máy tính hiện tại

![Ảnh phân tán](/images/cpux.png)

## 🖥️ 1. CPU – Intel Core i3-7020U @ 2.30GHz

- **Số nhân / luồng**: 2 cores / 4 threads  
- **Tốc độ thực tế**: ~1.5 GHz  
- **Ảo hóa**: Enabled  

### ➤ Đánh giá:
- Không phù hợp xử lý song song mạnh.
- Có thể dùng làm **worker node nhẹ** trong hệ phân tán.
- Phù hợp chạy các service nhẹ, log, monitor hoặc client node.

---

![Ảnh phân tán](/images/memory.png)

## 🧠 2. RAM – 20.0 GB DDR4 (2400 MHz)

- **Đang dùng**: ~11.8 GB (60%)
- **RAM nén**: 770 MB  
- **Cấu hình**: 2 thanh 4GB + 1 thanh 16GB (không đồng đều)

### ➤ Đánh giá:
- Dung lượng RAM **tốt** để mô phỏng hệ thống phân tán nhiều container.
- Phù hợp chạy Docker, Kubernetes (minikube), hoặc thử nghiệm Redis, Kafka.
- Có thể xử lý **đa nhiệm** tốt trong môi trường phát triển.

---
![Ảnh phân tán](/images/gpux.png)

## 🎮 3. GPU – Intel HD Graphics 620 (iGPU)

- **Shared memory**: 0.3 / 9.9 GB  
- **Không hỗ trợ tính toán GPU (CUDA, OpenCL)**

### ➤ Đánh giá:
- Không phù hợp cho hệ thống phân tán cần **GPU compute** như AI/ML.
- Chỉ hỗ trợ hiển thị cơ bản, phù hợp dashboard, UI nhẹ.

---

## 📊 Tổng kết

| Thành phần | Đánh giá | Vai trò khuyên dùng |
|------------|----------|----------------------|
| **CPU** | ⭐⭐☆☆☆ | Node phụ, xử lý nhẹ |
| **RAM** | ⭐⭐⭐⭐☆ | Tốt cho mô phỏng nhiều service |
| **GPU** | ⭐☆☆☆☆ | Không phù hợp AI/ML |

---

##  Phù hợp với:
- Học tập, mô phỏng hệ thống phân tán nhẹ.
- Phát triển microservices, Docker, Kubernetes (minikube).

##  Không phù hợp với:
- Xử lý Big Data, AI, hệ thống GPU cluster.


## 2. 12 Bài toán phổ biến trong CNTT có sử dụng đa luồng/đa tiến trình

| STT | Bài toán                  | Dùng Thread hay Process | Giải thích                              |
|-----|---------------------------|--------------------------|------------------------------------------|
| 1   | Web server                | Thread-per-request       | Mỗi request sinh ra luồng                |
| 2   | App chat                  | Thread-per-connection    | Mỗi user sinh ra luồng                   |
| 3   | Game Engine               | Đa luồng                 | Luồng AI, luồng physics                  |
| 4   | Video Rendering           | Process                  | Mỗi tình huống render độc lập            |
| 5   | Download Manager          | Đa tiến trình            | Mỗi file tải về là 1 process             |
| 6   | Compiler                  | Đa tiến trình            | Biên dịch song song các file             |
| 7   | Web scraping              | Đa luồng                 | Nhiều thread crawling song song          |
| 8   | Machine learning training | Multiprocess             | Phân chia data cho các process           |
| 9   | Video streaming server    | Đa luồng                 | Stream, handle comment, cache...         |
| 10  | IDE (VS Code, IntelliJ)   | Đa luồng                 | UI, biên dịch, syntax check              |
| 11  | OS Scheduler              | Kernel threads           | Quản lý tiến trình, task                 |
| 12  | CI/CD Pipeline            | Multiprocess             | Mỗi bước build/test là process           |

---

## 3. Khi nào dùng Thread, khi nào dùng Process?

![](/images/vdthread-process.jpg)
![](/images/vdthread-process2.jpg)
![](/images/vdthread-process3.jpg)


| Trường hợp                 | Thread                        | Process                         | Cả hai                                      |
|---------------------------|-------------------------------|----------------------------------|----------------------------------------------|
| Chia sẻ bộ nhớ chung      | ✔️                             | ❌                               | -                                            |
| Tác vụ song song nhẹ      | ✔️                             | ❌                               | -                                            |
| Tách biệt, an toàn        | ❌                             | ✔️                               | -                                            |
| Tính toán nặng (CPU bound)| ❌ (Python GIL giới hạn)       | ✔️                               | -                                            |
| Web server                | ✔️ (Thread-per-request)        | -                                | ✔️ Thread pool + Process nếu cần mở rộng     |
| AI Training (PyTorch)     | -                             | ✔️ (Data/Model Parallelism)      | ✔️ (Hybrid strategy dùng cả hai)             |

---

## 4. ChatGPT được đào tạo bằng Distributed System như thế nào?

- **Mô hình GPT (như ChatGPT)** được huấn luyện bằng hàng ngàn GPU kết nối qua mạng tốc độ cao.
- Áp dụng kỹ thuật **Model Parallelism** và **Data Parallelism**.
- Sử dụng các framework và công cụ như:
  - `DeepSpeed`, `Megatron-LM`
  - `PyTorch Distributed`, `NCCL`, `RDMA`
  - `Tensor/Model/Optimizer Parallelism`

### Tài liệu tham khảo:

- [HuggingFace Blog - LLM Training](https://huggingface.co/blog/llm-training)  
- [NVIDIA Developer - Scaling GPT-3](https://developer.nvidia.com/blog/scaling-gpt-3-training-on-ams/)  
- [Megatron-LM Paper (PDF)](https://arxiv.org/pdf/2104.04473.pdf)

---
