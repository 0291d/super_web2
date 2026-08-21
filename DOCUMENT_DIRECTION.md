# Document Direction - Cach web hoat dong

Tai lieu nay dung de tra nhanh flow cua web: app duoc nhung o file nao, click vao dau thi goi ham nao, frontend goi API nao, backend xu ly route nao.

## 1. Tong quan kien truc

- Frontend: React + Vite trong `src/`
- Backend: Express trong `server/`
- Database: MongoDB qua Mongoose models trong `server/models/`
- Anh san pham/local assets: folder `img/`
- Static public assets: folder `public/`

Lenh chay ca frontend va backend:

```powershell
npm run dev:all
```

Frontend mac dinh chay o:

```txt
http://localhost:5173
```

Backend API mac dinh chay o:

```txt
http://localhost:5000
```

## 2. Web duoc nhung va khoi chay o dau?

Flow khoi dong frontend:

```txt
index.html
  -> div#root
  -> script /src/main.tsx
  -> render <App />
  -> App boc AuthProvider + GlobalProvider + RouterProvider
  -> routes.tsx chon page theo URL
```

Chi tiet file:

- `index.html`: tao `<div id="root"></div>` va nhung script `/src/main.tsx`.
- `src/main.tsx`: lay `document.getElementById("root")` va render `<App />`.
- `src/app/App.tsx`: boc toan app bang:
  - `AuthProvider`: quan ly dang nhap, token, user.
  - `GlobalProvider`: quan ly cart, wishlist, search overlay, mobile menu.
  - `RouterProvider`: nap router trong `src/app/routes.tsx`.
  - `Toaster`: hien toast thong bao.
- `src/app/routes.tsx`: khai bao URL nao render page nao.
- `src/app/components/Layout.tsx`: layout chung gom `Header`, noi dung page qua `<Outlet />`, `Footer`, `CartDrawer`, `SearchOverlay`.

## 3. Routing frontend

File khai bao route: `src/app/routes.tsx`

Route chinh:

| URL | Component/Page |
| --- | --- |
| `/` | `Home` |
| `/shop` | `Shop` |
| `/shop/:category` | `Shop` |
| `/products` | `Shop` |
| `/product/:id` | `ProductDetail` |
| `/cart` | `Cart` |
| `/checkout` | `Checkout` |
| `/order-confirmation/:orderNumber` | `OrderConfirmation` |
| `/login` | `Login` |
| `/account` | `Account` |
| `/wishlist` | `Wishlist` |
| `/rooms` | `Rooms` |
| `/rooms/:id` | `RoomDetail` |
| `/inspire`, `/stories`, `/inspiration` | `Inspiration` |
| `/inspiration/:id` | `StoryDetail` |
| `/styling` | `StylingSessions` |
| `/care` | `Care` |
| `/service/:slug` | `ServicePageDetail` |
| `/professionals` | `Professionals` |

Route admin:

| URL | Component/Page |
| --- | --- |
| `/admin` | redirect sang `/admin/revenue` |
| `/admin/revenue` | `AdminRevenue` |
| `/admin/orders` | `AdminOrders` |
| `/admin/products` | `AdminProducts` |
| `/admin/customers` | `AdminCustomers` |
| `/admin/rooms` | `AdminRooms` |
| `/admin/professionals` | `AdminProfessionals` |
| `/admin/project-inquiries` | `AdminProjectInquiries` |
| `/admin/customer-service` | `AdminServicePages` |
| `/admin/inspire` | `AdminStories` |

## 4. Layout chung cua web

File: `src/app/components/Layout.tsx`

Layout render theo thu tu:

```txt
Header
main
  Outlet: page hien tai theo route
Footer
CartDrawer
SearchOverlay
```

Khi URL thay doi:

- `useLocation()` lay `pathname`.
- `useEffect()` scroll len dau trang.
- Doi `document.title`.
- Doi meta description va Open Graph title/description.
- `AnimatePresence` + `motion.div` tao animation khi doi page.

## 5. State dung chung

### 5.1 Cart, wishlist, overlay

File: `src/app/context/GlobalContext.tsx`

State quan trong:

- `cart`: danh sach san pham trong gio.
- `wishlist`: danh sach san pham da yeu thich.
- `isCartOpen`: bat/tat cart drawer.
- `isSearchOpen`: bat/tat search overlay.
- `isMobileMenuOpen`: bat/tat menu mobile.

Ham quan trong:

- `addToCart(product, quantity)`: them san pham vao cart, neu da co thi tang quantity, sau do mo cart drawer.
- `removeFromCart(id)`: xoa san pham khoi cart.
- `updateQuantity(id, quantity)`: cap nhat so luong; neu quantity < 1 thi xoa san pham.
- `clearCart()`: xoa het cart.
- `toggleWishlist(product)`: them/xoa san pham khoi wishlist.
- `setIsCartOpen(true/false)`: mo/dong cart drawer.
- `setIsSearchOpen(true/false)`: mo/dong search overlay.
- `setIsMobileMenuOpen(true/false)`: mo/dong menu mobile.

Du lieu cart va wishlist duoc luu localStorage:

- Cart key: `brew.cart`
- Wishlist key: `brew.wishlist`

### 5.2 Dang nhap va user

File: `src/app/context/AuthContext.tsx`

State quan trong:

- `user`: user hien tai hoac `null`.
- `isAuthLoading`: dang kiem tra token/user.

Ham quan trong:

- `login(email, password)`: goi API login, luu token, set user.
- `register(input)`: goi API register, luu token, set user.
- `updateProfile(input)`: goi API cap nhat profile.
- `changePassword(input)`: goi API doi mat khau.
- `logout()`: xoa token, set user ve `null`.

Token luu localStorage o file `src/app/api/auth.ts`:

```txt
brew_auth_token
```

## 6. Header: click vao dau thi lam gi?

File: `src/app/components/Header.tsx`

### Logo BREW

Click logo:

```txt
<Link to="/" />
  -> React Router doi URL sang /
  -> routes.tsx render Home
```

### Menu desktop

Click `Shop`:

```txt
<Link to="/shop" />
  -> routes.tsx render Shop
```

Hover `Shop`:

```txt
onMouseEnter
  -> setActiveMenu('shop')
  -> setActiveShopCategory(...)
  -> hien Mega Menu
```

Click category/subcategory trong Mega Menu:

```txt
shopLinkFor(...)
  -> tao URL /shop?category=... hoac /shop?subcategory=...
  -> onClick setActiveMenu(null)
  -> Shop doc query string
  -> getProducts({ category, subcategory, q, sort })
```

Click `Inspire`, `Rooms`, `Professionals`:

```txt
<Link to="/inspire" />       -> Inspiration
<Link to="/rooms" />         -> Rooms
<Link to="/professionals" /> -> Professionals
```

### Search icon

Click icon search:

```txt
onClick={() => setIsSearchOpen(true)}
  -> GlobalContext doi isSearchOpen = true
  -> Layout dang render SearchOverlay
  -> SearchOverlay hien overlay
```

### Wishlist icon

Click heart tren header:

```txt
<Link to="/wishlist" />
  -> routes.tsx render Wishlist
```

### Account/User icon

Neu chua dang nhap:

```txt
<Link to="/login" />
  -> Login page
```

Neu da dang nhap user thuong:

```txt
<Link to="/account" />
  -> Account page
```

Neu user role la admin:

```txt
<Link to="/admin" />
  -> routes.tsx redirect /admin/revenue
  -> AdminLayout + AdminRevenue
```

### Cart icon

Click gio hang:

```txt
onClick={() => setIsCartOpen(true)}
  -> GlobalContext doi isCartOpen = true
  -> Layout dang render CartDrawer
  -> CartDrawer hien drawer ben phai
```

### Mobile menu

Click menu icon mobile:

```txt
onClick={() => setIsMobileMenuOpen(true)}
  -> Header hien mobile overlay
```

Click nut X trong mobile menu:

```txt
onClick={() => setIsMobileMenuOpen(false)}
  -> dong mobile overlay
```

## 7. Search overlay flow

File: `src/app/components/SearchOverlay.tsx`

Mo overlay:

```txt
Header Search button
  -> setIsSearchOpen(true)
  -> SearchOverlay render
```

Khi overlay mo hoac nguoi dung go search:

```txt
useEffect([isSearchOpen, query])
  -> neu query rong: getProducts({ sort: 'popular' })
  -> neu co query: getProducts({ q: query.trim() })
  -> fetch /api/products?... trong src/app/api/products.ts
  -> backend server/routes/products.js xu ly GET /api/products
  -> setResults(products.slice(0, 4))
```

Submit form search:

```txt
handleSearch(event)
  -> event.preventDefault()
  -> setIsSearchOpen(false)
  -> navigate(`/shop?q=${query}`)
  -> Shop page doc q tu URL
  -> getProducts({ q, sort, category, subcategory })
```

Click san pham trong result:

```txt
<Link to={`/product/${product.id}`} />
  -> ProductDetail
```

## 8. Shop page flow

File: `src/app/pages/Shop.tsx`

Shop lay input tu:

- Path param: `/shop/:category`
- Query string: `category`, `subcategory`, `q`, `sort`

Khi cac tham so thay doi:

```txt
useEffect([category, subcategory, q, sort])
  -> getProducts({ category, subcategory, q, sort })
  -> fetch /api/products?category=...&subcategory=...&q=...&sort=...
  -> setProducts(data)
```

Click `Filter`:

```txt
onClick={() => setShowFilters(!showFilters)}
  -> hien/an sidebar filter
```

Submit input search trong Shop:

```txt
onSubmit
  -> updateQuery({ q })
  -> setSearchParams(params)
  -> URL query doi
  -> useEffect goi getProducts lai
```

Doi sort:

```txt
onChange={(event) => updateQuery({ sort: event.target.value })}
  -> URL query doi
  -> useEffect goi getProducts lai
```

Click product card:

```txt
ProductCard
  -> <Link to={`/product/${product.id}`} />
  -> ProductDetail
```

## 9. ProductCard flow

File: `src/app/components/ProductCard.tsx`

Click vao anh/ten san pham:

```txt
<Link to={`/product/${product.id}`} />
  -> routes.tsx render ProductDetail
```

Click heart tren card:

```txt
handleWishlist(event)
  -> event.preventDefault()
  -> event.stopPropagation()
  -> toggleWishlist(product)
  -> luu wishlist vao localStorage
  -> toast success neu la them moi
```

Click `Quick Add`:

```txt
handleAddToCart(event)
  -> event.preventDefault()
  -> event.stopPropagation()
  -> addToCart(product, 1)
  -> setIsCartOpen(true)
  -> toast success
```

## 10. Product detail flow

File: `src/app/pages/ProductDetail.tsx`

Khi vao URL `/product/:id`:

```txt
useParams() lay id
useEffect([id])
  -> getProduct(id)
  -> fetch /api/products/:id
  -> backend server/routes/products.js GET /api/products/:id
  -> setProduct(data)
```

Sau khi co product:

```txt
useEffect([product.category])
  -> getProducts({ category: product.category, sort: 'popular' })
  -> lay related products
```

Click thumbnail anh:

```txt
onClick={() => setActiveImageIndex(index)}
  -> doi anh dang xem
```

Click heart:

```txt
onClick={() => toggleWishlist(product)}
  -> them/xoa wishlist
```

Click nut tru/plus quantity:

```txt
Minus -> setQty(Math.max(1, qty - 1))
Plus  -> setQty(Math.min(qty + 1, maxQuantity))
```

Click `Add to Cart`:

```txt
handleAddToCart()
  -> neu out of stock thi return
  -> addToCart(product, qty)
  -> mo CartDrawer
  -> toast success
```

Click accordion:

```txt
toggleAccordion(section.id)
  -> mo/dong section description/details/care
```

## 11. Cart drawer flow

File: `src/app/components/CartDrawer.tsx`

Mo drawer:

```txt
Header cart icon hoac addToCart()
  -> setIsCartOpen(true)
```

Dong drawer:

```txt
Click backdrop -> setIsCartOpen(false)
Click X        -> setIsCartOpen(false)
```

Click xoa item:

```txt
removeFromCart(item.id)
  -> xoa item khoi cart
  -> localStorage brew.cart duoc cap nhat
```

Click tru/plus quantity:

```txt
Minus -> updateQuantity(item.id, item.quantity - 1)
Plus  -> updateQuantity(item.id, item.quantity + 1)
```

Click `Go to Cart`:

```txt
<Link to="/cart" onClick={() => setIsCartOpen(false)} />
  -> Cart page
```

Click `Checkout`:

```txt
<Link to="/checkout" onClick={() => setIsCartOpen(false)} />
  -> Checkout page
```

## 12. Checkout flow

File: `src/app/pages/Checkout.tsx`

Nguon du lieu:

- `cart`, `cartTotal`, `clearCart` tu `GlobalContext`.
- `user` tu `AuthContext`.
- `createOrder`, `getMyOrders` tu `src/app/api/orders.ts`.

Khi vao checkout:

```txt
useEffect()
  -> neu user dang nhap thi getMyOrders()
  -> co the dung de tinh/kiem tra thong tin order cua user
```

Submit form checkout:

```txt
handleSubmit(event)
  -> event.preventDefault()
  -> lay FormData
  -> build shippingAddress/billingAddress
  -> createOrder({...})
  -> fetch POST /api/orders
  -> backend server/routes/orders.js router.post('/')
  -> clearCart()
  -> neu order.paymentUrl ton tai: window.location.href = paymentUrl
  -> neu khong: navigate(`/order-confirmation/${order.orderNumber}?token=...`)
```

Backend khi tao order:

```txt
server/routes/orders.js POST /api/orders
  -> optionalAuth
  -> buildOrderItems(items)
  -> reserveInventory(items)
  -> tao Order
  -> neu payment VNPay thi tao paymentUrl
  -> tra order/paymentUrl ve frontend
```

## 13. Login/Register flow

File frontend:

- `src/app/pages/Login.tsx`
- `src/app/context/AuthContext.tsx`
- `src/app/api/auth.ts`

File backend:

- `server/routes/auth.js`
- `server/middleware/auth.js`
- `server/utils/password.js`
- `server/utils/token.js`
- `server/models/User.js`

Click tab Login/Register:

```txt
Login tab    -> setIsLogin(true)
Register tab -> setIsLogin(false)
```

Submit login:

```txt
handleLogin(event)
  -> login(email, password) tu AuthContext
  -> loginRequest(email, password) trong api/auth.ts
  -> fetch POST /api/auth/login
  -> backend server/routes/auth.js router.post('/login')
  -> backend tra { user, token }
  -> setAuthToken(token)
  -> setUser(user)
  -> navigate admin ve /admin, user thuong ve redirectTo hoac /
```

Submit register:

```txt
handleRegister(event)
  -> register(input) tu AuthContext
  -> registerRequest(input) trong api/auth.ts
  -> fetch POST /api/auth/register
  -> backend server/routes/auth.js router.post('/register')
  -> backend tao user, hash password, tao token
  -> frontend luu token, set user
  -> navigate
```

Khi refresh app:

```txt
AuthProvider useEffect()
  -> getCurrentUser()
  -> lay token trong localStorage
  -> fetch GET /api/auth/me
  -> neu token hop le setUser(user)
  -> neu token loi clearAuthToken()
```

## 14. Account flow

File: `src/app/pages/Account.tsx`

Nguon ham:

- `updateProfile()` tu `AuthContext`
- `changePassword()` tu `AuthContext`
- `getMyOrders()` tu `src/app/api/orders.ts`

Flow chinh:

```txt
Vao /account
  -> doc user tu AuthContext
  -> lay order cua user bang getMyOrders()
  -> submit profile -> updateProfile() -> PATCH /api/auth/me
  -> submit password -> changePassword() -> PATCH /api/auth/password
```

## 15. Admin layout va admin flow

File: `src/app/components/AdminLayout.tsx`

Admin sidebar link:

```txt
NavLink /admin/revenue
NavLink /admin/orders
NavLink /admin/products
NavLink /admin/customers
NavLink /admin/rooms
NavLink /admin/professionals
NavLink /admin/project-inquiries
NavLink /admin/customer-service
NavLink /admin/inspire
```

Click logout:

```txt
onClick
  -> logout()
  -> clearAuthToken()
  -> setUser(null)
  -> navigate('/')
```

Noi dung admin page render qua:

```txt
<Outlet />
```

### Admin products

File: `src/app/pages/AdminProducts.tsx`

Load danh sach:

```txt
loadProducts()
  -> getProducts({ sort: 'newest' })
  -> GET /api/products?sort=newest
```

Click product ben trai:

```txt
selectProduct(product)
  -> setSelectedId(product.id)
  -> setForm(productToForm(product))
```

Click `New Product`:

```txt
newProduct()
  -> reset selectedId
  -> setForm(emptyProduct voi id moi)
```

Submit form save:

```txt
handleSave(event)
  -> build payload tu form
  -> neu selectedId co gia tri: updateProduct(selectedId, payload)
       -> PUT /api/products/:id
  -> neu selectedId rong: createProduct(payload)
       -> POST /api/products
  -> backend yeu cau requireAuth + requireAdmin
  -> loadProducts() lai
```

Click `Delete`:

```txt
handleDelete()
  -> window.confirm()
  -> deleteProduct(selectedId)
  -> DELETE /api/products/:id
  -> backend yeu cau requireAuth + requireAdmin
  -> loadProducts() lai
```

## 16. Frontend API layer

### Products

File: `src/app/api/products.ts`

| Ham frontend | HTTP | Backend |
| --- | --- | --- |
| `getProducts(query)` | `GET /api/products?...` | `server/routes/products.js` `router.get('/')` |
| `getProduct(id)` | `GET /api/products/:id` | `router.get('/:id')` |
| `createProduct(product)` | `POST /api/products` | `router.post('/')` |
| `updateProduct(id, product)` | `PUT /api/products/:id` | `router.put('/:id')` |
| `deleteProduct(id)` | `DELETE /api/products/:id` | `router.delete('/:id')` |

Admin product APIs gui them header:

```txt
Authorization: Bearer <token>
```

### Orders

File: `src/app/api/orders.ts`

| Ham frontend | HTTP | Backend |
| --- | --- | --- |
| `createOrder(input)` | `POST /api/orders` | `server/routes/orders.js` `router.post('/')` |
| `getOrder(orderNumber, token)` | `GET /api/orders/:orderNumber?token=...` | `router.get('/:orderNumber')` |
| `getMyOrders()` | `GET /api/orders/my` | `router.get('/my')` |
| `getAllOrders()` | `GET /api/orders` | `router.get('/')` |
| `updateOrderStatus(id, status)` | `PATCH /api/orders/:id/status` | `router.patch('/:id/status')` |

### Auth

File: `src/app/api/auth.ts`

| Ham frontend | HTTP | Backend |
| --- | --- | --- |
| `login(email, password)` | `POST /api/auth/login` | `server/routes/auth.js` `router.post('/login')` |
| `register(input)` | `POST /api/auth/register` | `router.post('/register')` |
| `getCurrentUser()` | `GET /api/auth/me` | `router.get('/me')` |
| `updateCurrentUser(input)` | `PATCH /api/auth/me` | `router.patch('/me')` |
| `changeCurrentUserPassword(input)` | `PATCH /api/auth/password` | `router.patch('/password')` |

### Rooms, stories, service pages, professionals, customers

Cac file API frontend cung mau:

- `src/app/api/rooms.ts` -> `/api/rooms`
- `src/app/api/stories.ts` -> `/api/stories`
- `src/app/api/servicePages.ts` -> `/api/service-pages`
- `src/app/api/professionals.ts` -> `/api/professionals`
- `src/app/api/customers.ts` -> `/api/customers`

Backend tuong ung:

- `server/routes/rooms.js`
- `server/routes/stories.js`
- `server/routes/servicePages.js`
- `server/routes/professionals.js`
- `server/routes/customers.js`

## 17. Backend Express flow

File: `server/index.js`

Khoi dong backend:

```txt
dotenv.config()
create express app
setup CORS
setup express.json({ limit: '10mb' })
serve static images /assets/img -> folder img/
register API routes
connectDB()
app.listen(port)
```

Route dang ky:

```txt
/api/auth           -> server/routes/auth.js
/api/customers      -> server/routes/customers.js
/api/orders         -> server/routes/orders.js
/api/products       -> server/routes/products.js
/api/professionals  -> server/routes/professionals.js
/api/rooms          -> server/routes/rooms.js
/api/service-pages  -> server/routes/servicePages.js
/api/stories        -> server/routes/stories.js
```

Health check:

```txt
GET /api/health
  -> { ok: true, database: 'brew' }
```

Static image:

```txt
/assets/img/...
  -> doc file trong folder img/
```

## 18. Backend middleware auth

File: `server/middleware/auth.js`

Y nghia chung:

- `requireAuth`: bat buoc co token hop le.
- `optionalAuth`: co token thi gan user, khong co van cho di tiep.
- `requireAdmin`: bat buoc user role la admin.

Nhung route can admin:

- Tao/sua/xoa product.
- Xem tat ca orders.
- Cap nhat order status.
- Cac trang admin khac tuy route tuong ung.

## 19. Flow mua hang tong hop

```txt
User vao /shop
  -> Shop useEffect goi getProducts()
  -> ProductCard hien san pham

User click Quick Add
  -> ProductCard.handleAddToCart()
  -> GlobalContext.addToCart()
  -> CartDrawer mo

User click Checkout trong CartDrawer
  -> Link /checkout
  -> Checkout page

User submit checkout form
  -> Checkout.handleSubmit()
  -> createOrder()
  -> POST /api/orders
  -> server/routes/orders.js tao order
  -> clearCart()
  -> redirect VNPay hoac /order-confirmation/:orderNumber
```

## 20. Flow admin sua san pham tong hop

```txt
Admin click icon user
  -> neu user.role === 'admin' thi Link /admin
  -> routes redirect /admin/revenue

Admin click Products trong sidebar
  -> /admin/products
  -> AdminProducts loadProducts()
  -> GET /api/products?sort=newest

Admin click san pham
  -> selectProduct()
  -> form duoc fill data

Admin sua form va Save
  -> handleSave()
  -> PUT /api/products/:id
  -> backend requireAuth + requireAdmin
  -> MongoDB update product
  -> loadProducts() lai
```

## 21. Cac file nen doc khi muon sua mot flow

Muon sua menu/header:

```txt
src/app/components/Header.tsx
src/app/data/shopMenu.ts
```

Muon sua route/page:

```txt
src/app/routes.tsx
src/app/pages/<TenPage>.tsx
```

Muon sua cart/wishlist:

```txt
src/app/context/GlobalContext.tsx
src/app/components/CartDrawer.tsx
src/app/pages/Cart.tsx
src/app/pages/Wishlist.tsx
```

Muon sua dang nhap:

```txt
src/app/context/AuthContext.tsx
src/app/api/auth.ts
server/routes/auth.js
server/middleware/auth.js
```

Muon sua product:

```txt
src/app/pages/Shop.tsx
src/app/pages/ProductDetail.tsx
src/app/components/ProductCard.tsx
src/app/api/products.ts
server/routes/products.js
server/models/Product.js
```

Muon sua checkout/order:

```txt
src/app/pages/Checkout.tsx
src/app/pages/OrderConfirmation.tsx
src/app/api/orders.ts
server/routes/orders.js
server/models/Order.js
server/utils/vnpay.js
```

Muon sua admin:

```txt
src/app/components/AdminLayout.tsx
src/app/pages/Admin*.tsx
src/app/api/*.ts
server/routes/*.js
```

## 22. Ghi chu nhanh ve data seed

File seed chinh:

```txt
server/seed.js
```

Lenh nap data mau:

```powershell
npm run seed
```

Seed tach theo nhom nam trong:

```txt
server/seed/
```

Vi du:

- `server/seed/products.seed.js`
- `server/seed/orders.seed.js`
- `server/seed/customers.seed.js`
- `server/seed/stories.seed.js`
- `server/seed/servicePages.seed.js`
- `server/seed/professionals.seed.js`

