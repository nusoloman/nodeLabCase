# nodeLabCase

nodelabs backend developer case

---

## Proje Hakkında

NodeLabCase, modern web teknolojileriyle geliştirilmiş, gerçek zamanlı mesajlaşma, otomatik mesaj planlama, asenkron işleme ve güçlü kullanıcı yönetimi sunan bir backend ve frontend uygulamasıdır. Proje; **Node.js, Express.js, MongoDB, Redis, RabbitMQ, Socket.IO, ElasticSearch** ve modern React ile geliştirilmiştir.

---

## Özellikler

### 1. Kullanıcı Yönetimi ve Kimlik Doğrulama

- JWT tabanlı kimlik doğrulama (Access & Refresh Token)
- Kayıt, giriş, profil görüntüleme ve güncelleme
- Güvenli oturum sonlandırma (token blacklist)

### 2. Gerçek Zamanlı Mesajlaşma

- Socket.IO ile anlık mesaj gönderme/alma
- Yazıyor (typing) bildirimi
- Okundu (seen) ve iletildi (delivered) bildirimleri
- Online kullanıcı takibi (Socket.IO + Redis)

### 3. Otomatik Mesaj Planlama ve Kuyruk Sistemi

- Cron job ile her gece 02:00'de otomatik mesaj planlama
- Rastgele kullanıcı eşleştirme ve mesaj üretimi
- RabbitMQ ile asenkron mesaj kuyruğu (producer/consumer)
- Worker ile zamanında mesaj gönderimi

### 4. Performans ve Cache

- Redis ile online kullanıcı, session ve cache yönetimi
- ElasticSearch ile mesaj arama ve indeksleme

### 5. API ve Dokümantasyon

- RESTful API endpoint'leri
- Swagger/OpenAPI ile otomatik API dokümantasyonu (`/api-docs`)

### 6. Güvenlik ve Kalite

- Rate limiting middleware
- Temiz kod, modüler yapı, best practice'ler
- Logger (Winston)
- Hata yönetimi ve merkezi error handler

---

## Kurulum ve Çalıştırma

### 1. Gereksinimler

- Node.js (v18+)
- MongoDB
- Redis
- RabbitMQ
- ElasticSearch

### 2. Projeyi Klonla

```bash
git clone <repo-url>
cd nodeLabCase
docker compose up --build -d
```

### 3. Ortam Değişkenlerini Ayarla

`.env` dosyasını oluştur ve aşağıdaki gibi doldur:

```env
MONGO_URI=mongodb://localhost:27017/nodelabcase
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
JWT_SECRET=supersecretkey
ELASTICSEARCH_URL=http://localhost:9200
PORT=3000
```

### 4. Bağımlılıkları Kur

#### Frontend:

```bash
cd frontend
npm install
```

### 5. Servisleri Başlat

#### Backend, MongoDB, Redis, RabbitMQ ve ElasticSearch'i başlat (Docker Compose ile örnek):

```bash
cd backend
docker-compose up --build -d
```

#### Frontend'i başlat:

```bash
cd frontend
npm run dev
```

> **Not:** Eğer kurulum veya çalıştırma sırasında node sürümüyle ilgili hata alırsanız, aşağıdaki komutlarla nvm kullanarak Node.js v20+ sürümüne geçiş yapabilirsiniz:
>
> ```bash
> nvm install 20
> nvm use 20
> ```
>
> Proje Node.js 20 ve üzeri sürümlerde sorunsuz çalışır.

### 6. Swagger API Dokümantasyonu

- [http://localhost:3000/api-docs](http://localhost:3000/api-docs) adresinden API endpoint'lerini ve dökümantasyonu inceleyebilirsin.

---

## Kullanım Rehberi

### 1. Kayıt ve Giriş

- `/register` ve `/login` endpoint'leri veya frontend arayüzü üzerinden kullanıcı oluşturup giriş yapabilirsin.

### 2. Profil Yönetimi

- `/auth/me` endpoint'i ile profil bilgilerini görüntüleyebilir, güncelleyebilirsin.

### 3. Gerçek Zamanlı Mesajlaşma

- Giriş yaptıktan sonra sohbet başlatabilir, anlık mesajlaşabilir, yazıyor ve okundu bildirimlerini görebilirsin.

### 4. Otomatik Mesaj Planlama

- Sistem her gece 02:00'de otomatik olarak kullanıcıları eşleştirip mesajları planlar.
- `/shuffle` sayfasından demo olarak rastgele mesaj eşleştirme ve gönderme işlemlerini test edebilirsin.

### 5. Online Kullanıcı Takibi

- Aktif kullanıcılar listesini anlık olarak görebilir, kendi online/offline durumunu takip edebilirsin.

### 6. Mesaj Arama

- ElasticSearch entegrasyonu ile mesajlarda hızlı arama yapabilirsin.

---

## Geliştirici Notları

- Kodlar modüler ve best practice'lere uygun yazılmıştır.
- Tüm önemli middleware'ler, error handler ve logger entegre edilmiştir.
- API endpoint'leri Swagger/OpenAPI ile dökümante edilmiştir.
- Rate limiting, JWT blacklist, Redis cache gibi güvenlik ve performans önlemleri alınmıştır.

---

## Katkı ve Geliştirme

- PR ve issue açarak katkıda bulunabilirsin.
- Kodunuzu geliştirmeden önce lütfen testleri çalıştırın ve kod stiline uyun.

---

**Her türlü soru ve katkı için iletişime geçmekten çekinmeyin!**

## İletişim & Profil

|               |                                                                        |
| :------------ | :--------------------------------------------------------------------- |
| **İsim:**     | Nusret Atıf Göbütoğlu                                                  |
| **Telefon:**  | [0532 579 63 99](tel:05325796399)                                      |
| **Web:**      | [nusoft.pro](https://nusoft.pro)                                       |
| **LinkedIn:** | [linkedin.com/in/nusret-atif](https://www.linkedin.com/in/nusret-atif) |
| **GitHub:**   | [github.com/nusoloman](https://github.com/nusoloman)                   |
