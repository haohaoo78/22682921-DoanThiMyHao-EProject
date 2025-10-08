# EProject – Microservices System
## Giới thiệu

Dự án EProject bao gồm các service chính:

Auth Service – Xác thực và đăng ký người dùng

Product Service – Quản lý sản phẩm

Order Service – Xử lý đơn hàng

API Gateway – Cổng giao tiếp tập trung giữa client và các service

RabbitMQ – Message broker để giao tiếp giữa các service

MongoDB – Cơ sở dữ liệu NoSQL lưu thông tin người dùng, sản phẩm và đơn hàng

## Cài đặt
### Download source code
git clone <https://github.com/haohaoo78/22682921-DoanThiMyHao-EProject.git>
cd EProject

### Cài đặt dependencies
Trong từng service (cd <servide>), chạy:

npm install

### Thiết lập microservices

File docker-compose.yml đã cấu hình sẵn các service:

mongo (database)

rabbitmq (message broker)

auth (authentication)

product (product management)

order (order handling)

gateway (API gateway)

### Tạo file .env cho từng service
auth/.env

MONGODB_AUTH_URI=mongodb://<mongo_host>:27017/authdb
JWT_SECRET=<your_jwt_secret_key>
RABBITMQ_URL=amqp://<your_rabbitmq_user>:<your_rabbitmq_password>@rabbitmq:5672

product/.env
MONGODB_PRODUCT_URI=mongodb://<mongo_host>:27017/productdb
RABBITMQ_URL=amqp://<your_rabbitmq_user>:<your_rabbitmq_password>@rabbitmq:5672

order/.env
MONGODB_ORDER_URI=mongodb://<mongo_host>:27017/orderdb
RABBITMQ_URL=amqp://<your_rabbitmq_user>:<your_rabbitmq_password>@rabbitmq:5672

### Chạy toàn bộ hệ thống bằng Docker

docker-compose up --build

### Sau khi chạy, hệ thống hoạt động ở:

Auth Service: http://localhost:3000

Product Service: http://localhost:3001

Order Service: http://localhost:3002

API Gateway: http://localhost:3003

RabbitMQ Dashboard: http://localhost:15672
 (user: haohaao78, pass: Shatou5114)

## Kiểm thử bằng Postman

Các API chính có thể test qua Postman:

### Auth Service

POST /auth/register → Đăng ký tài khoản

POST /auth/login → Đăng nhập, nhận JWT token

GET /auth/dashboard → Kiểm tra token (yêu cầu header x-auth-token)

### Product Service

POST /products → Tạo sản phẩm (cần JWT token)

GET /products → Lấy danh sách sản phẩm

POST /products/buy → Đặt hàng sản phẩm

### Order Service

Tự động nhận dữ liệu qua RabbitMQ và lưu vào MongoDB
