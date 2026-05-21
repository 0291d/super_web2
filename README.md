# Super Web2 - BREW E-commerce

Du an web ban hang noi that/phong cach song, gom frontend React/Vite va backend Express/MongoDB. Frontend chay qua Vite, backend cung cap REST API cho san pham, don hang, tai khoan, bai viet inspire, customer service va trang professionals.

## Cong nghe chinh

- Frontend: React 18, React Router, Vite, Tailwind CSS, Radix UI, MUI icons, lucide-react, sonner.
- Backend: Node.js, Express, Mongoose, MongoDB.
- Tooling: nodemon, concurrently.

## Yeu cau truoc khi chay

- Cai Node.js va npm.
- Cai MongoDB Community Server hoac co MongoDB URI tuong duong.
- Dam bao MongoDB dang chay local neu dung cau hinh mac dinh.

## Mo du an lan dau

1. Cai dependencies:

```bash
npm install
```

2. Tao file `.env` tu file mau:

```bash
copy .env.example .env
```

Neu dung PowerShell co the dung:

```powershell
Copy-Item .env.example .env
```

3. Kiem tra noi dung `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/brew
CLIENT_ORIGIN=http://localhost:5173
```

Co the them tai khoan admin khi seed du lieu:

```env
ADMIN_EMAIL=admin@brew.local
ADMIN_PASSWORD=admin12345
```

Neu khong khai bao, seed se dung mac dinh `admin@brew.local` / `admin12345`.

4. Seed du lieu mau vao MongoDB:

```bash
npm run seed
```

Lenh nay se tao/cap nhat du lieu mau cho products, orders, inspire stories, professionals, service pages va tai khoan admin.

5. Chay frontend va backend cung luc:

```bash
npm run dev:all
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Cac lenh thuong dung

```bash
npm run dev
```

Chay rieng frontend Vite.

```bash
npm run dev:server
```

Chay rieng backend Express bang nodemon.

```bash
npm run dev:all
```

Chay frontend va backend cung luc.

```bash
npm run seed
```

Nap lai du lieu mau vao MongoDB.

```bash
npm run build
```

Build frontend production vao thu muc `dist`.

```bash
npm start
```

Chay backend Express o che do start.

## Cau truc thu muc

```txt
src/
  app/
    api/          Goi API tu frontend
    components/   Layout, header, footer, cart drawer, search, product card, UI components
    context/      AuthContext va GlobalContext
    data/         Du lieu tinh cho menu, rooms, inspire categories
    lib/          Helper xu ly anh
    pages/        Cac trang user va admin
    routes.tsx    Khai bao route frontend
  styles/         CSS global, theme, fonts, Tailwind

server/
  config/         Ket noi database
  middleware/     Auth middleware
  models/         Mongoose models
  routes/         REST API routes
  seed/           Du lieu seed theo module
  seed.js         Script nap du lieu mau

public/           Static assets public
img/              Anh san pham theo danh muc
dist/             Ban build production
```

## Module frontend da phat trien

### Public storefront

- Home: trang chu gioi thieu san pham va noi dung noi bat.
- Shop / Products: danh sach san pham, ho tro route theo category.
- Product detail: chi tiet san pham, anh, thong tin, thao tac them gio hang.
- Cart: gio hang va cap nhat so luong san pham.
- Checkout: tao don hang demo thong qua API orders.
- Order confirmation: hien thi thong tin don hang theo ma don.
- Wishlist: danh sach san pham yeu thich trong state frontend.
- Search overlay: tim kiem san pham trong giao dien.

### Content va service pages

- Rooms: danh sach phong/khong gian.
- Room detail: chi tiet mot room.
- Inspiration / Stories: danh sach bai viet inspire.
- Story detail: chi tiet bai viet.
- Styling sessions, Care, Service page detail: cac trang dich vu/cham soc khach hang theo slug.
- Professionals: trang danh cho professional/trade va form inquiry.

### Account va auth

- Login/Register: dang nhap va dang ky tai khoan.
- Account: xem/cap nhat thong tin nguoi dung, dia chi, newsletter.
- AuthContext: luu user hien tai, token va trang thai dang nhap.

### Admin

Duong dan admin nam trong `/admin`.

- `/admin/products`: quan ly san pham.
- `/admin/revenue`: bao cao doanh thu, don hang, gia tri don trung binh va san pham ban chay.
- `/admin/rooms`: quan ly noi dung rooms o frontend.
- `/admin/professionals`: quan ly trang professionals va inquiry.
- `/admin/customer-service`: quan ly service pages.
- `/admin/inspire`: quan ly inspire stories.

Luu y: cac API tao/sua/xoa can dang nhap bang user co role `admin`.

## Module backend/API da phat trien

### Auth

Base path: `/api/auth`

- `POST /register`: dang ky user.
- `POST /login`: dang nhap, tra ve user va token.
- `GET /me`: lay user hien tai.
- `PATCH /me`: cap nhat ho ten, newsletter, dia chi.

### Products

Base path: `/api/products`

- `GET /`: danh sach san pham, co filter `category`, `subcategory`, `q`, `sort`.
- `GET /:id`: lay san pham theo Mongo `_id`, `productId` hoac `slug`.
- `POST /`: tao san pham, yeu cau admin.
- `PUT /:id`: cap nhat san pham, yeu cau admin.
- `DELETE /:id`: xoa san pham, yeu cau admin.

### Orders

Base path: `/api/orders`

- `POST /`: tao don hang.
- `GET /my`: danh sach don hang cua user dang nhap.
- `GET /`: danh sach tat ca don hang, yeu cau admin.
- `GET /:orderNumber`: lay chi tiet don hang theo ma don.

### Stories / Inspiration

Base path: `/api/stories`

- `GET /`: danh sach stories, ho tro `category`, `q`, `featured`, `includeDrafts`.
- `GET /:id`: chi tiet story theo `_id`, `storyId` hoac `slug`.
- `POST /`, `PUT /:id`, `DELETE /:id`: quan tri story, yeu cau admin.

### Service Pages

Base path: `/api/service-pages`

- `GET /`: danh sach service pages, mac dinh chi lay published.
- `GET /:id`: chi tiet service page theo `_id`, `pageId` hoac `slug`.
- `POST /`, `PUT /:id`, `DELETE /:id`: quan tri service page, yeu cau admin.

### Professionals

Base path: `/api/professionals`

- `GET /`: lay trang professionals dang published.
- `GET /admin`: lay trang professionals cho admin.
- `PUT /admin`: cap nhat trang professionals, yeu cau admin.
- `POST /inquiries`: gui inquiry tu frontend.
- `GET /inquiries`: danh sach inquiry, yeu cau admin.
- `PATCH /inquiries/:id`: cap nhat inquiry, yeu cau admin.
- `DELETE /inquiries/:id`: xoa inquiry, yeu cau admin.
