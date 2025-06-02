# Script triển khai cho hệ thống blog phân tán
# Chạy script này từ máy local để triển khai lên các server

# Cấu hình các server
$servers = @(
    "server1_ip",
    "server2_ip",
    "server3_ip"
)

# Upload các file cấu hình và mã nguồn
foreach ($server in $servers) {
    Write-Host "Uploading files to $server..."
    
    # Tạo thư mục project trên server
    ssh root@$server "mkdir -p /opt/blog-system"
    
    # Upload docker-compose.yml
    scp ./docker-compose.yml root@$server:/opt/blog-system/
    
    # Upload Dockerfile
    scp ./Dockerfile root@$server:/opt/blog-system/
    
    # Upload thư mục build
    scp -r ./build root@$server:/opt/blog-system/
    
    # Upload nginx config
    scp -r ./nginx root@$server:/opt/blog-system/
    
    # Upload .env.production
    scp ./.env.production root@$server:/opt/blog-system/.env
    
    # Upload serverless functions
    scp -r ./netlify/functions root@$server:/opt/blog-system/functions
    
    Write-Host "Files uploaded to $server successfully"
}

# Khởi động docker container trên các server
foreach ($server in $servers) {
    Write-Host "Starting containers on $server..."
    ssh root@$server "cd /opt/blog-system && docker-compose up -d"
}

Write-Host "Deployment completed successfully!"
