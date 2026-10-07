# BẢN PHÁC THẢO MENU GIAO DIỆN (UI) VÀ ÁNH XẠ API BACKEND

> **Phiên bản:** 1.0  
> **Hệ thống:** AWS Social Network (Frontend Next.js App Router & Backend NestJS Micro-services / Serverless)  
> **Tài liệu tham chiếu Backend API:** `social-api/src/modules/*`

---

## 1. TỔNG QUAN KIẾN TRÚC GIAO DIỆN (UI ARCHITECTURE)

Hệ thống giao diện mạng xã hội được thiết kế theo mô hình **3 cột (Three-Column Layout)** hiện đại, responsive và tối ưu trải nghiệm thời gian thực (real-time).

```
+----------------------------------------------------------------------------------------------------+
|                                         TOP NAVBAR / HEADER                                        |
| [Logo Social]  [Search Box]       [Create Post +]  [Notif Icon (Badge)]  [Chat Icon]  [User Avatar]|
+-----------------------+--------------------------------------------+-------------------------------+
|     LEFT SIDEBAR      |             MAIN CONTENT AREA              |         RIGHT SIDEBAR         |
|                       |                                            |                               |
| 🏠 Bảng tin (Feed)    |  [ Khung tạo bài viết nhanh (Status Box) ] | 🟢 Bạn bè đang online         |
| 👥 Bạn bè (Friends)   |                                            |                               |
| 💬 Tin nhắn (Chat)    |  [ Danh sách bài viết - Feed Post List ]   | ⏰ Lịch nhắc nhở sắp tới      |
| ⏰ Lịch thông báo     |    - Post Item 1 (Image/Video, Like, Cmt)  |                               |
| 🛡️ Nhật ký an ninh    |    - Post Item 2 ...                       | 📌 Lối tắt / Liên kết nhanh   |
| ⚙️ Cài đặt cá nhân    |    (Infinite Scroll / Cursor pagination)   |                               |
| 👑 Quản trị (Admin)   |                                            |                               |
+-----------------------+--------------------------------------------+-------------------------------+
|                   FLOATING CHAT DOCK / MESSENGER POPUP (BOTTOM RIGHT)                              |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. SƠ ĐỒ PHÂN BỔ ROUTE VÀ CẤU TRÚC MENU UI

```
UI Application (/ui/src/app/[locale])
│
├── (auth)
│   ├── /login                          --> Trang Đăng nhập
│   └── /register                       --> Trang Đăng ký
│
├── (social) [Main Layout with Left Sidebar + Topbar + Right Widgets]
│   ├── /feed                           --> [Menu 1] Bảng tin chính (News Feed)
│   │   └── /posts/[id]                 --> Chi tiết bài viết & Bình luận
│   │
│   ├── /profile/[userId]               --> [Menu 2] Trang cá nhân người dùng
│   │   ├── (timeline)                  --> Dòng thời gian bài viết của User
│   │   └── (friends)                   --> Danh sách bạn bè của User
│   │
│   ├── /friends                        --> [Menu 3] Trung tâm bạn bè
│   │   ├── /list                       --> Danh sách bạn bè hiện tại & Tìm kiếm
│   │   ├── /requests                   --> Lời mời kết bạn (Tabs: Nhận được / Đã gửi)
│   │   └── /blocked                    --> Danh sách người dùng bị chặn
│   │
│   ├── /messages                       --> [Menu 4] Trò chuyện & Nhắn tin (Full Page)
│   │   └── /[conversationId]           --> Hộp thoại chi tiết (1-1 hoặc Nhóm)
│   │
│   ├── /notifications                  --> [Menu 5] Trung tâm thông báo & Lập lịch
│   │   ├── /                           --> Tất cả thông báo cá nhân
│   │   └── /schedules                  --> Quản lý lịch hẹn thông báo tự động cho bạn bè
│   │
│   └── /settings                       --> [Menu 6] Cài đặt & An toàn tài khoản
│       ├── /profile                    --> Cập nhật thông tin cá nhân
│       └── /audit-logs                 --> Lịch sử hoạt động & Nhật ký bảo mật cá nhân
│
└── (admin) [Admin Layout - Quyền ADMIN]
    └── /admin/audit-logs               --> [Menu 7] Tra cứu nhật ký kiểm toán hệ thống (DynamoDB)
```

---

## 3. CHI TIẾT TỪNG MENU & ÁNH XẠ API BACKEND

---

### MENU 1: BẢNG TIN TRANG CHỦ (NEWS FEED) & BÀI VIẾT

* **Đường dẫn UI:** `/feed` và `/posts/:id`
* **Vị trí hiển thị:** Menu đầu tiên trên Left Sidebar, Logo click.

#### Các thành phần giao diện (UI Components):
1. **Khung đăng bài viết (Create Post Widget):**
   * Ô nhập nội dung văn bản (Text area với emoji picker).
   * Nút đính kèm tệp đa phương tiện (Ảnh / Video).
   * Bộ chọn quyền riêng tư: `PUBLIC` (Công khai), `FRIENDS` (Chỉ bạn bè), `PRIVATE` (Chỉ mình tôi).
   * Nút bấm "Đăng bài" (Hiển thị tiến trình upload S3).
2. **Dòng thời gian (Feed Timeline):**
   * Danh sách thẻ bài viết (`PostCard`).
   * Phân trang vô hạn (Infinite Scroll sử dụng Cursor Pagination `beforeTimestamp`).
   * Nút Like/Tim tương tác động, hiển thị số lượt thích.
   * Menu tùy chọn bài viết (Dropdown 3 chấm): "Chỉnh sửa bài viết" (nếu là chủ sở hữu), "Xóa bài viết", "Chia sẻ".
3. **Màn hình chi tiết bài viết (`/posts/[id]`):**
   * Hiển thị nội dung chi tiết bài viết ở độ phân giải gốc.
   * Danh sách bình luận dạng cây (Comments & Nested Replies).

#### Ánh xạ API Backend (`/posts`):

| Thao tác UI | HTTP Method & Endpoint | Payload / Params | Phản hồi / Kết quả UI |
| :--- | :--- | :--- | :--- |
| Tải trang Feed (Infinite Scroll) | `GET /posts/feed` | Query: `limit`, `beforeTimestamp` | Danh sách bài viết kèm thông tin tác giả, media, trạng thái `hasLiked` |
| Chọn ảnh/video để đăng | `POST /posts/media/upload-url` | Body: `{ fileName, fileType, fileSize, mediaType }` | Nhận S3 Presigned URL (`uploadUrl`, `mediaKey`) để UI upload trực tiếp lên AWS S3 |
| Nhấn "Đăng bài" | `POST /posts` | Body: `{ content, privacy, mediaKeys: [...] }` | Bài viết mới được prepend vào đầu News Feed ngay lập tức |
| Bấm icon Tim (Like/Unlike) | `POST /posts/:id/like` | Param: `id` (Post UUID) | Cập nhật số like và đổi màu icon (`liked: true/false`) không cần reload |
| Xem chi tiết 1 bài viết | `GET /posts/:id` | Param: `id` | Hiển thị modal/trang bài viết chi tiết |
| Chỉnh sửa bài viết | `PATCH /posts/:id` | Param: `id`<br>Body: `{ content, privacy }` | Cập nhật nội dung hiển thị của bài viết |
| Xóa bài viết | `DELETE /posts/:id` | Param: `id` | Xóa thẻ bài viết khỏi feed (Soft Delete) |

---

### MENU 2: TRANG CÁ NHÂN (USER PROFILE)

* **Đường dẫn UI:** `/profile/:userId`
* **Vị trí hiển thị:** Click vào Avatar/Tên người dùng trên bài viết, thanh tìm kiếm hoặc Header.

#### Các thành phần giao diện (UI Components):
1. **Profile Header:**
   * Ảnh đại diện (Avatar), Ảnh bìa (Cover Image), Tên hiển thị, Bio.
   * Nút trạng thái quan hệ bạn bè biến đổi theo ngữ cảnh:
     * Chưa kết bạn: Nút `+ Thêm bạn bè`.
     * Đã gửi lời mời: Nút `Đã gửi yêu cầu` (Click để Hủy yêu cầu).
     * Nhận được lời mời: Nút `Chấp nhận` / `Từ chối`.
     * Đã là bạn bè: Nút `Bạn bè` (Dropdown: Nhắn tin, Hủy kết bạn, Chặn).
2. **Profile Tabs:**
   * Tab **"Bài viết"**: Dòng thời gian các bài viết do chính người này đăng.
   * Tab **"Bạn bè"**: Danh sách bạn bè công khai của người này.
   * Tab **"Ảnh/Media"**: Bộ sưu tập hình ảnh đã đăng.

#### Ánh xạ API Backend:

| Thao tác UI | HTTP Method & Endpoint | Payload / Params | Phản hồi / Kết quả UI |
| :--- | :--- | :--- | :--- |
| Mở trang cá nhân | `GET /auth/me` (nếu là chính mình) | Header: `Bearer Token` | Tải thông tin tài khoản cá nhân |
| Tải Timeline của người đó | `GET /posts/user/:userId` | Param: `userId`<br>Query: `limit`, `beforeTimestamp` | Danh sách bài viết của user theo quyền riêng tư của người xem |
| Kiểm tra trạng thái quan hệ | `GET /api/v1/friends/status/:userId` | Param: `userId` | Trả về: `NONE`, `PENDING_SENT`, `PENDING_RECEIVED`, `FRIENDS`, `BLOCKED` |
| Bấm nút "Thêm bạn bè" | `POST /api/v1/friends/requests` | Body: `{ recipientId }` | Nút đổi sang "Đã gửi lời mời" |
| Bấm "Hủy kết bạn" | `DELETE /api/v1/friends/:friendUserId` | Param: `friendUserId` | Chuyển trạng thái về "Thêm bạn bè" |
| Bấm "Chặn người dùng" | `POST /api/v1/friends/block/:userId` | Param: `userId` | Chặn tương tác, ẩn toàn bộ bài viết |

---

### MENU 3: MẠNG LƯỚI BẠN BÈ (FRIENDS CENTER)

* **Đường dẫn UI:** `/friends`
* **Vị trí hiển thị:** Tab "Bạn bè" trên thanh Sidebar bên trái.

#### Các Sub-menu & Tab giao diện:
1. **Sub-menu 1: "Tất cả bạn bè" (`/friends/list`):**
   * Thanh tìm kiếm nhanh bạn bè theo tên hoặc nickname.
   * Danh sách thẻ bạn bè dạng lưới (Grid cards): Avatar, Tên, Số bạn chung, Nút "Nhắn tin", Menu 3 chấm ("Hủy bạn bè", "Chặn").
2. **Sub-menu 2: "Lời mời kết bạn" (`/friends/requests`):**
   * **Tab 1: Lời mời đã nhận (Received):** Danh sách người gửi lời mời kèm 2 nút hành động nhanh: `Chấp nhận (Accept)` và `Xóa/Từ chối (Decline)`.
   * **Tab 2: Lời mời đã gửi (Sent):** Danh sách người mình đã gửi kèm nút `Hủy lời mời (Cancel)`.
3. **Sub-menu 3: "Danh sách chặn" (`/friends/blocked`):**
   * Danh sách người dùng hiện đang bị chặn kèm nút `Bỏ chặn (Unblock)`.

#### Ánh xạ API Backend (`/api/v1/friends`):

| Thao tác UI | HTTP Method & Endpoint | Payload / Params | Phản hồi / Kết quả UI |
| :--- | :--- | :--- | :--- |
| Xem danh sách bạn bè & Tìm kiếm | `GET /api/v1/friends` | Query: `search`, `page`, `limit` | Danh sách bạn bè kèm phân trang |
| Xem danh sách lời mời nhận được | `GET /api/v1/friends/requests?type=received` | Query: `page`, `limit`, `type=received` | Hiển thị danh sách kèm nút Accept/Decline |
| Xem danh sách lời mời đã gửi | `GET /api/v1/friends/requests?type=sent` | Query: `page`, `limit`, `type=sent` | Hiển thị danh sách kèm nút Hủy yêu cầu |
| Bấm nút "Chấp nhận" | `PATCH /api/v1/friends/requests/:id/accept` | Param: `id` (Friendship UUID) | Trở thành bạn bè, cập nhật thẻ UI |
| Bấm nút "Từ chối" | `PATCH /api/v1/friends/requests/:id/decline` | Param: `id` | Xóa khỏi danh sách lời mời |
| Bấm "Hủy yêu cầu đã gửi" | `DELETE /api/v1/friends/requests/:id/cancel` | Param: `id` | Thu hồi lời mời kết bạn |
| Xem danh sách chặn | `GET /api/v1/friends/blocks` | Query: `page`, `limit` | Danh sách người bị chặn |
| Bấm "Bỏ chặn" | `DELETE /api/v1/friends/block/:userId` | Param: `userId` | Mở khóa chặn, cho phép tìm kiếm lại |

---

### MENU 4: TIN NHẮN & HỘI THOẠI (CHAT & MESSAGES)

* **Đường dẫn UI:** `/messages` (toàn màn hình) hoặc cửa sổ Chat Popup nổi góc dưới phải màn hình.
* **Vị trí hiển thị:** Icon Messenger trên Header và mục "Tin nhắn" trên Sidebar.

#### Các thành phần giao diện (UI Components):
1. **Cột danh sách hội thoại (Conversation Sidebar):**
   * Thanh tìm kiếm cuộc trò chuyện.
   * Nút tạo nhóm chat mới (+ Tạo nhóm: Chọn nhiều bạn bè, đặt tên nhóm).
   * Danh sách hội thoại sắp xếp theo tin nhắn mới nhất, badge số tin nhắn chưa đọc (`unreadCount`).
   * Hiển thị trạng thái tin nhắn cuối: Ai gửi, nội dung/ảnh tóm tắt, thời gian gửi.
2. **Khung nội dung tin nhắn (Chat Window):**
   * Header: Tên người chat / Tên nhóm, Avatar, Trạng thái online/offline.
   * Vùng tin nhắn cuộn ngược (Reverse Scroll với Cursor Pagination `beforeTimestamp`).
   * Bong bóng tin nhắn (Message Bubbles): Text, Media (Ảnh, Video, Tệp tin), trạng thái đã gửi/đã đọc.
   * Thao tác trên từng tin nhắn: Hover menu -> "Thu hồi tin nhắn" (Recall).
   * Footer nhập liệu: Khung soạn tin, nút gửi icon/sticker, nút đính kèm ảnh/file, phím tắt Enter để gửi.

#### Ánh xạ API Backend (`/chat` & WebSocket Realtime):

| Thao tác UI | HTTP Method & Endpoint | Payload / Params | Phản hồi / Kết quả UI |
| :--- | :--- | :--- | :--- |
| Mở danh sách hộp thư | `GET /chat/conversations` | Query: `limit`, `cursor` | Danh sách các cuộc trò chuyện gần nhất |
| Bấm vào 1 cuộc trò chuyện | `GET /chat/conversations/:id/messages` | Param: `id`<br>Query: `limit`, `beforeTimestamp` | Tải lịch sử tin nhắn của cuộc trò chuyện |
| Đánh dấu đã đọc khi xem tin | `PATCH /chat/conversations/:id/read` | Param: `id` | Reset badge chưa đọc về 0 |
| Chọn gửi ảnh/file trong chat | `POST /chat/media/upload-url` | Body: `{ fileName, fileType, fileSize, mediaType }` | Lấy Presigned URL để upload file lên S3 chat |
| Gửi tin nhắn mới | `POST /chat/conversations/:id/messages`<br>*(Hoặc qua WebSocket Event `sendMessage`)* | Param: `id`<br>Body: `{ content, mediaUrls, type }` | Render tin nhắn ngay lập tức với trạng thái đã gửi |
| Tạo nhóm chat mới | `POST /chat/conversations` | Body: `{ type: 'GROUP', name, memberIds }` | Mở ngay phòng chat nhóm mới tạo |
| Thu hồi tin nhắn đã gửi | `DELETE /chat/conversations/:id/messages/:messageId` | Param: `id`, `messageId`<br>Query: `createdAt` | Nội dung tin đổi thành *"Tin nhắn đã được thu hồi"* |

---

### MENU 5: TRUNG TÂM THÔNG BÁO & HẸN GIỜ (NOTIFICATIONS)

* **Đường dẫn UI:** Popover Dropdown trên Topbar và trang đầy đủ `/notifications`
* **Vị trí hiển thị:** Icon Chuông thông báo trên Header.

#### Các thành phần giao diện (UI Components):
1. **Dropdown thông báo nhanh (Header Notification Popover):**
   * Tab "Tất cả" và "Chưa đọc".
   * Nút "Đánh dấu tất cả là đã đọc".
   * Danh sách thông báo tương tác (Có ai đó like, comment, gửi lời mời kết bạn, tin nhắn mới...).
   * Click vào thông báo sẽ điều hướng trực tiếp đến bài viết/trang liên quan.
2. **Trang quản lý thông báo hẹn trước (`/notifications/schedules`):**
   * Nút **"Tạo lịch hẹn thông báo mới"** (Đặt lịch gửi lời chúc sinh nhật, nhắc nhở công việc cho bạn bè).
   * Form modal: Chọn bạn bè nhận, Ngày giờ kích hoạt (Datetime Picker), Tiêu đề, Nội dung thông báo.
   * Bảng danh sách các lịch thông báo đã lên lịch (Trạng thái: `PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`).
   * Nút thao tác: "Hủy lịch hẹn" trước khi sự kiện xảy ra.

#### Ánh xạ API Backend (`/notifications`):

| Thao tác UI | HTTP Method & Endpoint | Payload / Params | Phản hồi / Kết quả UI |
| :--- | :--- | :--- | :--- |
| Mở danh sách thông báo | `GET /notifications` | Query: `page`, `limit`, `isRead` | Danh sách thông báo theo thứ tự mới nhất |
| Click vào 1 thông báo | `PATCH /notifications/:id/read` | Param: `id` (Notification UUID) | Đánh dấu thông báo cụ thể là đã đọc |
| Bấm "Đánh dấu đã đọc tất cả" | `PATCH /notifications/read-all` | N/A | Xóa tất cả badge đỏ chưa đọc |
| Xem danh sách lịch hẹn thông báo | `GET /notifications/schedules` | Query: `page`, `limit` | Bảng quản lý các thông báo đã hẹn giờ |
| Bấm tạo lịch gửi thông báo | `POST /notifications/schedules` | Body: `{ recipientId, scheduledAt, title, content }` | Tạo lịch trình thành công (Lưu DB & AWS EventBridge/SQS) |
| Bấm "Hủy lịch hẹn" | `DELETE /notifications/schedules/:id` | Param: `id` (Schedule UUID) | Hủy gửi thông báo |

---

### MENU 6: CÀI ĐẶT & NHẬT KÝ BẢO MẬT CÁ NHÂN (USER SECURITY)

* **Đường dẫn UI:** `/settings/audit-logs`
* **Vị trí hiển thị:** Dropdown Menu của User Avatar trên Topbar -> "Nhật ký hoạt động".

#### Các thành phần giao diện (UI Components):
1. **Bảng lịch sử an ninh tài khoản (Personal Security Timeline):**
   * Theo dõi các sự kiện nhạy cảm: Đăng nhập (`USER_LOGIN`), Đăng xuất (`USER_LOGOUT`), Đổi mật khẩu (`PASSWORD_CHANGE`), Thay đổi quyền riêng tư.
   * Thông tin hiển thị: Thời gian, Hành động, Địa chỉ IP, Thiết bị / Trình duyệt (`User-Agent`), Trạng thái (`SUCCESS` / `FAILED`).
2. **Bộ lọc thời gian:** Lọc theo ngày bắt đầu, ngày kết thúc.

#### Ánh xạ API Backend (`/audit-logs`):

| Thao tác UI | HTTP Method & Endpoint | Payload / Params | Phản hồi / Kết quả UI |
| :--- | :--- | :--- | :--- |
| Tải lịch sử bảo mật cá nhân | `GET /audit-logs/me` | Query: `limit`, `startDate`, `endDate` | Danh sách nhật ký an toàn của chính tài khoản |
| Click xem chi tiết 1 bản ghi | `GET /audit-logs/:id` | Param: `id` | Xem chi tiết metadata, IP, vị trí địa lý của lần đăng nhập đó |

---

### MENU 7: QUẢN TRỊ KIỂM TOÁN HỆ THỐNG (ADMIN AUDIT LOGS)

* **Đường dẫn UI:** `/admin/audit-logs`
* **Đối tượng sử dụng:** Chỉ hiển thị khi người dùng có vai trò `role: "ADMIN"`.
* **Vị trí hiển thị:** Sidebar phân hệ Quản trị.

#### Các thành phần giao diện (UI Components):
1. **Thanh công cụ lọc nâng cao (Admin Audit Filters):**
   * Lọc theo Mã người dùng (`userId`).
   * Lọc theo Loại hành động (`action`: `USER_LOGIN`, `POST_DELETE`, `BLOCK_USER`, ...).
   * Lọc theo Tài nguyên (`resource`: `POST`, `USER`, `FRIENDSHIP`).
   * Khoảng thời gian (`startDate` -> `endDate`).
2. **Bảng dữ liệu kiểm toán hệ thống (DynamoDB Audit Table):**
   * Hỗ trợ tải dữ liệu lớn bằng Cursor Pagination (`lastEvaluatedKey`).
   * Cột hiển thị: Log ID, Thời gian, Tác tử thực hiện, Hành động, Tài nguyên, IP, Trạng thái.
   * Modal xem chi tiết JSON Payload & Metadata của từng sự kiện.

#### Ánh xạ API Backend (`/audit-logs`):

| Thao tác UI | HTTP Method & Endpoint | Payload / Params | Phản hồi / Kết quả UI |
| :--- | :--- | :--- | :--- |
| Tải danh sách kiểm toán toàn sàn | `GET /audit-logs` | Query: `userId`, `action`, `resource`, `status`, `startDate`, `endDate`, `limit`, `cursor` | Danh sách bản ghi bảo mật từ DynamoDB kèm Cursor tiếp theo |
| Xem bản ghi kiểm toán cụ thể | `GET /audit-logs/:id` | Param: `id` | Chi tiết bản ghi audit kèm metadata kỹ thuật |

---

### TIỆN ÍCH DÙNG CHUNG: DỊCH VỤ TẢI LÊN S3 (MEDIA SERVICE)

* **Phạm vi sử dụng:** Modal upload avatar, tải tài liệu, xem trước ảnh chất lượng cao.

| Thao tác UI | HTTP Method & Endpoint | Payload / Params | Phản hồi / Kết quả UI |
| :--- | :--- | :--- | :--- |
| Xin URL tải file trực tiếp lên S3 | `POST /media/upload-url` | Body: `{ fileName, fileType, fileSize, mediaType }` | Nhận Presigned URL PUT và Object Key |
| Xem trước file riêng tư có bảo vệ | `GET /media/download-url` | Query: `{ key, expiresIn }` | Nhận Presigned URL GET để hiển thị ảnh |
| Xóa file đính kèm trước khi post | `DELETE /media?key=:key` | Query: `key` | Xóa object thừa trên S3 |

---

## 4. MA TRẬN TỔNG HỢP MENU UI VÀ ENDPOINT API

| STT | Phân hệ UI | Route UI | Thao tác người dùng | Method & Endpoint Backend |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Xác thực** | `/login` | Đăng nhập hệ thống | `POST /auth/login` |
| **2** | | `/register` | Đăng ký tài khoản | `POST /auth/register` |
| **3** | | Topbar Avatar | Đăng xuất tài khoản | `POST /auth/logout` |
| **4** | | App Startup | Lấy thông tin user hiện tại | `GET /auth/me` |
| **5** | **Bảng tin** | `/feed` | Tải danh sách bài viết trang chủ | `GET /posts/feed` |
| **6** | | `/feed` (Status Box) | Xin link upload ảnh/video bài viết | `POST /posts/media/upload-url` |
| **7** | | `/feed` (Status Box) | Đăng bài viết mới | `POST /posts` |
| **8** | | `/posts/[id]` | Xem chi tiết bài viết | `GET /posts/:id` |
| **9** | | Post Card | Thích / Bỏ thích bài viết | `POST /posts/:id/like` |
| **10** | | Post Card Menu | Chỉnh sửa nội dung & quyền xem | `PATCH /posts/:id` |
| **11** | | Post Card Menu | Xóa bài viết | `DELETE /posts/:id` |
| **12** | **Trang cá nhân** | `/profile/[userId]` | Xem timeline của người dùng | `GET /posts/user/:userId` |
| **13** | | `/profile/[userId]` | Kiểm tra trạng thái quan hệ bạn bè | `GET /api/v1/friends/status/:userId` |
| **14** | **Bạn bè** | `/friends/list` | Tìm kiếm và xem danh sách bạn bè | `GET /api/v1/friends` |
| **15** | | `/friends/list` | Hủy kết bạn (Unfriend) | `DELETE /api/v1/friends/:friendUserId` |
| **16** | | `/friends/requests` | Xem lời mời kết bạn (Đến & Đi) | `GET /api/v1/friends/requests` |
| **17** | | `/friends/requests` | Gửi lời mời kết bạn mới | `POST /api/v1/friends/requests` |
| **18** | | `/friends/requests` | Chấp nhận lời mời kết bạn | `PATCH /api/v1/friends/requests/:id/accept` |
| **19** | | `/friends/requests` | Từ chối lời mời kết bạn | `PATCH /api/v1/friends/requests/:id/decline` |
| **20** | | `/friends/requests` | Hủy lời mời kết bạn đã gửi | `DELETE /api/v1/friends/requests/:id/cancel` |
| **21** | | `/friends/blocked` | Xem danh sách bị chặn | `GET /api/v1/friends/blocks` |
| **22** | | `/friends/blocked` | Bỏ chặn người dùng | `DELETE /api/v1/friends/block/:userId` |
| **23** | | User Options | Chặn người dùng | `POST /api/v1/friends/block/:userId` |
| **24** | **Tin nhắn** | `/messages` | Xem danh sách hội thoại gần nhất | `GET /chat/conversations` |
| **25** | | `/messages` | Tạo cuộc trò chuyện mới (1-1 / Nhóm) | `POST /chat/conversations` |
| **26** | | `/messages/[id]` | Tải lịch sử tin nhắn | `GET /chat/conversations/:id/messages` |
| **27** | | `/messages/[id]` | Upload media đính kèm tin nhắn | `POST /chat/media/upload-url` |
| **28** | | `/messages/[id]` | Gửi tin nhắn mới | `POST /chat/conversations/:id/messages` |
| **29** | | `/messages/[id]` | Đánh dấu đã đọc cuộc trò chuyện | `PATCH /chat/conversations/:id/read` |
| **30** | | `/messages/[id]` | Thu hồi tin nhắn đã gửi | `DELETE /chat/conversations/:id/messages/:messageId` |
| **31** | **Thông báo** | Topbar / `/notifications` | Xem danh sách thông báo | `GET /notifications` |
| **32** | | Notification Item | Đánh dấu 1 thông báo đã đọc | `PATCH /notifications/:id/read` |
| **33** | | Topbar Popover | Đánh dấu đọc tất cả thông báo | `PATCH /notifications/read-all` |
| **34** | | `/notifications/schedules` | Xem danh sách lịch hẹn thông báo | `GET /notifications/schedules` |
| **35** | | Modal Tạo Lịch | Đặt lịch gửi thông báo cho bạn bè | `POST /notifications/schedules` |
| **36** | | `/notifications/schedules` | Hủy lịch hẹn thông báo | `DELETE /notifications/schedules/:id` |
| **37** | **Bảo mật User** | `/settings/audit-logs` | Xem lịch sử đăng nhập, an ninh cá nhân | `GET /audit-logs/me` |
| **38** | | Modal Log Detail | Xem chi tiết 1 sự kiện bảo mật | `GET /audit-logs/:id` |
| **39** | **Admin Logs** | `/admin/audit-logs` | Tra cứu toàn bộ kiểm toán hệ thống | `GET /audit-logs` |
| **40** | | `/admin/audit-logs` | Xem chi tiết bản ghi kiểm toán | `GET /audit-logs/:id` |

---

## 5. ĐỀ XUẤT CẤU TRÚC THƯ MỤC SOURCE CODE TRONG `ui/`

Để hiện thực hóa hệ thống menu trên với Next.js App Router, cấu trúc khuyến nghị cho thư mục `ui/src/app` như sau:

```
ui/src/
├── app/
│   └── [locale]/
│       ├── (auth)/
│       │   ├── login/page.tsx
│       │   └── register/page.tsx
│       │
│       ├── (social)/                     <-- Layout chung có Left Sidebar & Topbar
│       │   ├── layout.tsx
│       │   ├── feed/
│       │   │   ├── page.tsx              <-- News Feed chính
│       │   │   └── posts/[id]/page.tsx   <-- Chi tiết bài viết
│       │   ├── profile/[userId]/page.tsx <-- Trang cá nhân
│       │   ├── friends/
│       │   │   ├── layout.tsx            <-- Tabs: Bạn bè, Lời mời, Chặn
│       │   │   ├── list/page.tsx
│       │   │   ├── requests/page.tsx
│       │   │   └── blocked/page.tsx
│       │   ├── messages/
│       │   │   ├── layout.tsx            <-- Layout 2 cột: Danh sách hội thoại + Khung chat
│       │   │   ├── page.tsx              <-- Màn hình chờ chọn hội thoại
│       │   │   └── [id]/page.tsx         <-- Cửa sổ chat chi tiết
│       │   ├── notifications/
│       │   │   ├── page.tsx              <-- Danh sách thông báo
│       │   │   └── schedules/page.tsx    <-- Quản lý thông báo hẹn trước
│       │   └── settings/
│       │       └── audit-logs/page.tsx   <-- Nhật ký bảo mật người dùng
│       │
│       └── (admin)/
│           └── admin/
│               └── audit-logs/page.tsx   <-- Bảng kiểm toán Admin
│
├── components/
│   ├── navigation/
│   │   ├── Topbar.tsx
│   │   ├── LeftSidebar.tsx
│   │   └── NotificationDropdown.tsx
│   ├── feed/
│   │   ├── CreatePostBox.tsx
│   │   └── PostCard.tsx
│   ├── chat/
│   │   ├── ConversationItem.tsx
│   │   ├── ChatWindow.tsx
│   │   └── ChatFloatingDock.tsx
│   └── friend/
│       ├── FriendCard.tsx
│       └── FriendRequestItem.tsx
│
└── services/api/                         <-- Axios / Fetch wrapper gọi social-api
    ├── auth.api.ts
    ├── post.api.ts
    ├── friend.api.ts
    ├── chat.api.ts
    ├── notification.api.ts
    └── audit-log.api.ts
```
