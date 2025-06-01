# Hướng dẫn chạy hệ thống phân tán

## 1. Chạy toàn bộ hệ thống phân tán (Production)
```powershell
# Khởi động tất cả services
docker-compose up -d

# Kiểm tra status
docker-compose ps

# Xem logs
docker-compose logs -f blog-backend1
docker-compose logs -f blog-backend2
```

## 2. Chạy development mode (chỉ database)
```powershell
# Chỉ khởi động CockroachDB cluster
docker-compose up -d cockroach1 cockroach2 cockroach3 init redis

# Chạy ứng dụng local
npm run dev
```

## 3. Truy cập hệ thống

### Production (phân tán):
- Website: http://localhost (qua nginx load balancer)
- Backend 1: http://localhost:3000
- Backend 2: http://localhost:3002
- WebSocket 1: ws://localhost:3001
- WebSocket 2: ws://localhost:3003

### Development:
- Website: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3000

### Database Admin:
- CockroachDB 1: http://localhost:8085
- CockroachDB 2: http://localhost:8086  
- CockroachDB 3: http://localhost:8087

### Monitoring:
- Prometheus: http://localhost:9090
- Redis: localhost:6379

## 4. Environment Variables

### Production (.env)
```
DATABASE_URL=postgresql://root@cockroach1:26257/blog?sslmode=disable
NODE_ID=1
PORT=3000
WS_PORT=3001
```

### Development (.env.development)
```
DATABASE_URL=postgresql://root@localhost:26257/blog?sslmode=disable
NODE_ID=1
PORT=3000
WS_PORT=3001
```

## 5. Load Balancing

Nginx phân tải request giữa:
- blog-backend1:3000
- blog-backend2:3000

Round-robin algorithm với health checks.

## 6. Database Cluster

CockroachDB tự động:
- Replica data giữa 3 nodes
- Auto-failover nếu 1 node down
- Consistency đảm bảo ACID

## 7. Scaling

Có thể thêm nodes:
```yaml
blog-backend3:
  # Tương tự backend1, backend2
  environment:
    - DATABASE_URL=postgresql://root@cockroach3:26257/blog?sslmode=disable
    - NODE_ID=3
```
