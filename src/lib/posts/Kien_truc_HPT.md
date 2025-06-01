---
title: "Tìm hiểu về Kiến trúc HPT"
slug: "kien-truc-hpt"
date: "2025-05-18"
coverImage: "/images/kien_trucHPT.png"
categories: ["công nghệ", "hệ thống phân tán"]
---
**Tác giả:** Nguyễn Duy Hưng

## 1. Tìm hiểu sự tương quan và khác biệt giữa các giao thức HTTP, TCP/IP, UDP, REST, GraphQL, SOAP, AJAX, RPC, gRPC

### **HTTP**:
- **Mục đích**: HTTP là giao thức phổ biến nhất cho việc truyền tải dữ liệu trên World Wide Web (WWW). Nó giúp gửi yêu cầu từ trình duyệt tới máy chủ và nhận về các tài nguyên như HTML, hình ảnh, JSON, v.v.
- **Ứng dụng**: Dùng cho các dịch vụ web, các API RESTful, và ứng dụng web.

### **TCP/IP**:
- **Mục đích**: Bộ giao thức truyền thông mạng chuẩn, TCP/IP là nền tảng của Internet, quản lý cách thức dữ liệu được truyền từ một máy này đến một máy khác qua mạng.
- **Ứng dụng**: Tất cả các ứng dụng mạng, từ việc duy trì kết nối (TCP) đến định tuyến dữ liệu (IP).

### **UDP**:
- **Mục đích**: UDP là giao thức truyền tải không kết nối, không có cơ chế đảm bảo rằng dữ liệu đã gửi sẽ tới đích hoặc tới đúng thứ tự.
- **Ứng dụng**: Phù hợp cho các ứng dụng yêu cầu tốc độ truyền cao và có thể chấp nhận mất mát dữ liệu, ví dụ như phát video trực tuyến, voice over IP (VoIP).

### **REST**:
- **Mục đích**: REST là một kiểu kiến trúc phát triển API cho phép giao tiếp giữa client và server dựa trên HTTP. RESTful APIs sử dụng các phương thức HTTP để tương tác với các tài nguyên (GET, POST, PUT, DELETE).
- **Ưu điểm**: Dễ sử dụng, nhẹ, và hỗ trợ caching hiệu quả.
- **Nhược điểm**: Không hỗ trợ các tính năng phức tạp như GraphQL trong việc truy vấn dữ liệu.

### **GraphQL**:
- **Mục đích**: GraphQL là một ngôn ngữ truy vấn cho API, giúp client yêu cầu chính xác những gì họ cần từ server thay vì nhận toàn bộ bộ dữ liệu.
- **Ưu điểm**: Linh hoạt hơn REST, giúp giảm thiểu việc tải thừa thông tin và hỗ trợ cập nhật dữ liệu dễ dàng hơn.
- **Nhược điểm**: Có thể gây phức tạp trong việc triển khai và bảo mật nếu không kiểm soát tốt.

### **SOAP**:
- **Mục đích**: SOAP là một giao thức dựa trên XML để thực hiện các cuộc gọi từ xa giữa các máy tính. SOAP hỗ trợ giao tiếp thông qua HTTP và các giao thức khác như SMTP.
- **Ưu điểm**: Bảo mật cao, hỗ trợ tính toàn vẹn dữ liệu, dễ dàng mở rộng trong các hệ thống phức tạp.
- **Nhược điểm**: Thường có chi phí tính toán và băng thông cao hơn so với REST.

### **AJAX**:
- **Mục đích**: AJAX cho phép tải dữ liệu từ server mà không phải tải lại toàn bộ trang. Đây là công nghệ quan trọng trong phát triển web hiện đại, cho phép tạo ra các ứng dụng web tương tác.
- **Ứng dụng**: Tải dữ liệu theo thời gian thực mà không làm gián đoạn giao diện người dùng, ví dụ trong việc lấy dữ liệu từ API mà không làm mới trang.

### **RPC**:
- **Mục đích**: RPC cho phép một chương trình yêu cầu dịch vụ hoặc hàm từ một máy tính khác mà không cần phải biết chi tiết về giao thức hoặc cách thức thực hiện.
- **Ứng dụng**: Thường được sử dụng trong các ứng dụng phân tán và microservices.

### **gRPC**:
- **Mục đích**: gRPC là một giao thức RPC hiện đại, hỗ trợ nhiều ngôn ngữ lập trình và sử dụng HTTP/2 để cải thiện hiệu suất. Nó cung cấp một cách tiếp cận nhanh chóng, hiệu quả trong các hệ thống phân tán và microservices.
- **Ứng dụng**: Sử dụng gRPC trong các dịch vụ microservices giúp tối ưu hóa việc truyền tải dữ liệu giữa các dịch vụ, đặc biệt là khi cần truyền tải lượng dữ liệu lớn hoặc sử dụng các dịch vụ streaming.

### **Sự tương quan và khác biệt**:
- **HTTP** và **TCP/IP** đều là giao thức truyền tải dữ liệu, nhưng HTTP là ứng dụng của TCP/IP trong việc truyền tải tài nguyên web.
- **UDP** và **TCP/IP** đều là giao thức truyền tải dữ liệu nhưng UDP nhanh hơn nhưng không đảm bảo độ tin cậy.
- **REST** và **SOAP** đều được sử dụng để xây dựng các API, nhưng REST dễ sử dụng hơn và linh hoạt hơn, trong khi SOAP có tính bảo mật và khả năng mở rộng cao hơn.
- **GraphQL** và **REST** đều là phương pháp truy vấn dữ liệu từ server, nhưng GraphQL linh hoạt hơn trong việc chỉ yêu cầu các trường dữ liệu cụ thể.
- **AJAX** là kỹ thuật giao tiếp bất đồng bộ trong ứng dụng web, còn **RPC** và **gRPC** là các giao thức giúp gọi hàm từ xa.

---

## 2. Nghiên cứu về thư viện OpenMPI và giải pháp phân tán trong bài toán

### **OpenMPI**:
OpenMPI (Open Message Passing Interface) là một thư viện phần mềm mã nguồn mở cho phép thực hiện tính toán phân tán qua nhiều máy tính trong một hệ thống phân tán hoặc một mạng. Nó hỗ trợ giao tiếp giữa các tiến trình trong môi trường máy tính song song hoặc phân tán.

### **Tính năng của OpenMPI**:
- **Giao tiếp điểm-điểm**: Hỗ trợ truyền tải dữ liệu giữa các tiến trình.
- **Giao tiếp nhóm**: Hỗ trợ truyền tải dữ liệu đến nhiều tiến trình một cách hiệu quả.
- **Đồng bộ và bất đồng bộ**: Hỗ trợ cả giao tiếp đồng bộ và bất đồng bộ, giúp tối ưu hiệu suất.
- **Quản lý bộ nhớ phân tán**: Cung cấp các công cụ để quản lý bộ nhớ phân tán giữa các tiến trình.

### **Các hàm của OpenMPI**:
- `MPI_Init`: Khởi tạo môi trường MPI.
- `MPI_Comm_size`: Lấy số lượng tiến trình trong một communicator.
- `MPI_Comm_rank`: Lấy ID của tiến trình trong communicator.
- `MPI_Send`, `MPI_Recv`: Gửi và nhận dữ liệu giữa các tiến trình.
- `MPI_Finalize`: Kết thúc môi trường MPI.

### **Bài toán tính số nguyên tố đầu tiên**:
**Mô tả**:
- **Mục tiêu**: Tính toán 10,000,000 số nguyên tố đầu tiên, với hệ thống 16 máy, mỗi máy có 2 core (tổng cộng 32 core).
- **Thuật toán**: Sử dụng thuật toán **Sieve of Eratosthenes** cho phép loại bỏ các bội số của một số nguyên tố để tìm ra các số nguyên tố.

### **Giải pháp**:
1. **Chia công việc**: Bài toán có thể chia thành nhiều phần. Mỗi core xử lý một phần của dải số, tìm ra số nguyên tố trong phạm vi của nó.
   
2. **Thuật toán Sieve of Eratosthenes**:
   - Bắt đầu với một mảng số từ 2 đến N (số cần tính toán số nguyên tố).
   - Dùng thuật toán Sieve để loại bỏ các bội số của các số nguyên tố từ 2 trở đi.
   - Sau khi loại bỏ, các chỉ số còn lại trong mảng là các số nguyên tố.

3. **Sử dụng OpenMPI**:
   - **Phân chia dải số**: Dải số 10,000,000 được chia đều cho các core. Mỗi core sẽ xử lý một phần dải số.
   - **Giao tiếp giữa các core**: Các tiến trình MPI có thể sử dụng các hàm như `MPI_Send`, `MPI_Recv` để truyền tải kết quả giữa các máy tính và các core.
   - **Kết hợp kết quả**: Sau khi mỗi core tính toán xong các số nguyên tố trong phần của mình, chúng sẽ kết hợp kết quả và xác nhận tính chính xác của các số nguyên tố.

4. **Linh hoạt số core**:
   - **Điều chỉnh số lượng core**: Bằng cách thay đổi số lượng tiến trình MPI khi khởi tạo (ví dụ từ 8 core đến 32 core), OpenMPI sẽ tự động phân phối công việc giữa các core.
   - **Chia nhỏ công việc**: Khi số lượng core thay đổi, OpenMPI sẽ tự động chia nhỏ công việc sao cho tổng thể hiệu suất vẫn được tối ưu.

### **Ưu điểm**:
- **Hiệu quả cao**: Các tiến trình làm việc song song, giúp giảm thời gian tính toán.
- **Khả năng mở rộng**: Có thể dễ dàng điều chỉnh số lượng tiến trình và core mà không ảnh hưởng đến kết quả.
  
### **Kết luận**:
- **OpenMPI** là một giải pháp mạnh mẽ cho việc phân tán tính toán, giúp tối ưu hóa bài toán tính số nguyên tố khi làm việc với nhiều máy và core. OpenMPI cho phép chia sẻ và đồng bộ dữ liệu hiệu quả giữa các tiến trình, từ đó giúp giảm thời gian tính toán và tối ưu hiệu suất.
