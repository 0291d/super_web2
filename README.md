# Super Web2

Du an web ban hang noi that gom:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB

## 1. Can cai truoc

May can co:

- Node.js LTS: https://nodejs.org
- MongoDB Community Server hoac MongoDB Atlas URI
- Git neu muon clone tu GitHub

Kiem tra Node va npm:

```powershell
node -v
npm -v
```

## 2. Tai code ve may

Neu chua co source:

```powershell
git clone https://github.com/0291d/super_web2.git
cd super_web2
```

## 3. Cai dependencies

Lan dau chay project can cai thu vien:

```powershell
npm install
```

Lenh nay se tao lai folder `node_modules/`. Folder nay khong dua len GitHub.

## 4. Tao file cau hinh `.env`

Copy file mau:

```powershell
Copy-Item .env.example .env
```

Noi dung mac dinh:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/brew
CLIENT_ORIGIN=http://localhost:5173
```

Neu dung MongoDB Atlas, thay `MONGODB_URI` bang connection string cua Atlas.



Neu khong them, project dung mac dinh tk admin:

- Email: `admin@brew.local`
- Password: `admin12345`

Tai khoan nguoi dung demo:

- Email: `user@brew.local`
- Password: `user12345`

## 5. Bat MongoDB

Neu dung MongoDB local, dam bao MongoDB dang chay.

Co the kiem tra bang:

```powershell
mongosh
```

Neu `mongosh` ket noi duoc la MongoDB dang chay. Neu dung MongoDB Atlas thi khong can chay MongoDB local.

## 6. Nap du lieu mau

Sau khi `.env` da dung va MongoDB dang chay:

```powershell
npm run seed
```

Lenh nay tao du lieu mau cho san pham, don hang, bai viet, service pages, professionals, user demo va user admin.

## 7. Chay web

Chay frontend va backend cung luc:

```powershell
npm run dev:all
```

Sau khi terminal chay xong, mo trinh duyet:

- Web frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

Dung server bang `Ctrl + C` trong terminal.

## 8. Cac lenh hay dung

Chay rieng frontend:

```powershell
npm run dev
```

Chay rieng backend:

```powershell
npm run dev:server
```

Chay frontend va backend:

```powershell
npm run dev:all
```

Seed lai database: 

```powershell
npm run seed
```

Build frontend production:

```powershell
npm run build
```

Sau khi build, folder `dist/` se duoc tao lai. Folder nay khong dua len GitHub.

## 9. Cau truc folder

```txt
src/        Frontend React
server/     Backend Express va API
img/        Anh san pham theo danh muc
public/     Static assets public
.env        Cau hinh local, khong commit
```

## 10. Loi thuong gap

Neu `npm run dev:all` bao loi thieu package:

```powershell
npm install
```

Neu backend khong ket noi database, kiem tra:

- MongoDB local da chay chua
- `MONGODB_URI` trong `.env` co dung khong
- Neu dung Atlas, IP may da duoc allow trong Network Access chua

Neu port bi trung, doi `PORT` trong `.env` hoac tat app dang dung port do.
