# Panduan Deployment Expense Tracker ke VPS

## Informasi VPS
- IP: 43.157.243.243
- User: ubuntu
- Domain: expense.mdwisu.com
- Port: 3001 (aplikasi berjalan di port 3001, Nginx proxy ke port 80/443)

## 🚀 Quick Start (Otomatis dengan Script)

### First-Time Deployment

1. **Persiapan DNS**: Tambahkan A record di domain provider
   ```
   Type: A
   Name: expense
   Value: 43.157.243.243
   TTL: Auto
   ```

2. **Pastikan SSH key sudah dikonfigurasi** untuk akses ke VPS

3. **Jalankan script first-time deployment**:
   ```bash
   chmod +x first-deploy.sh
   ./first-deploy.sh
   ```

Script ini akan otomatis:
- Setup direktori di VPS
- Clone repository
- Install dependencies
- Setup database dan seed data
- Build aplikasi
- Start dengan PM2
- Konfigurasi Nginx
- Setup SSL certificate (opsional)

### Update Deployment

Setelah first-time deployment, untuk update aplikasi cukup jalankan:
```bash
chmod +x deploy.sh
./deploy.sh
```

Script akan otomatis:
- Pull latest code dari GitHub
- Install/update dependencies
- Run migrations
- Build aplikasi
- Restart PM2

---

## 📋 Langkah-Langkah Manual (Jika Tidak Menggunakan Script)

### 1. Persiapan VPS

SSH ke VPS:
```bash
ssh ubuntu@43.157.243.243
```

Update sistem dan install dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx
```

Install PM2 (Process Manager):
```bash
sudo npm install -g pm2
```

### 2. Clone Repository

Buat direktori untuk aplikasi:
```bash
cd /var/www
sudo mkdir -p expense-tracker
sudo chown -R ubuntu:ubuntu expense-tracker
cd expense-tracker
```

Clone repository:
```bash
git clone https://github.com/mdwisu/expense-tracker.git .
```

### 3. Install Dependencies dan Setup Database

Install npm packages:
```bash
npm install
```

Buat file .env:
```bash
nano .env
```

Isi dengan:
```
DATABASE_URL="file:./dev.db"
NODE_ENV=production
```

Setup database:
```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### 4. Build Aplikasi

```bash
npm run build
```

### 5. Setup PM2

Start aplikasi dengan PM2 menggunakan ecosystem config:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Jalankan command yang diberikan oleh `pm2 startup` (biasanya dimulai dengan `sudo`).

Cek status:
```bash
pm2 status
pm2 logs expense-tracker
```

### 6. Setup Nginx

Buat konfigurasi Nginx:
```bash
sudo nano /etc/nginx/sites-available/expense-tracker
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name expense.mdwisu.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Note**: Port 3001 digunakan karena port 3000 sudah dipakai oleh aplikasi lain di VPS.

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup DNS

Di dashboard domain provider (Cloudflare/Namecheap/etc), tambahkan A record:
```
Type: A
Name: expense
Value: 43.157.243.243
TTL: Auto
```

Tunggu DNS propagasi (1-15 menit).

### 8. Setup SSL Certificate

Install SSL certificate dengan Certbot:
```bash
sudo certbot --nginx -d expense.mdwisu.com
```

Ikuti instruksi dan pilih opsi untuk redirect HTTP ke HTTPS.

Test auto-renewal:
```bash
sudo certbot renew --dry-run
```

### 9. Verifikasi

Akses aplikasi di browser:
```
https://expense.mdwisu.com
```

Cek logs jika ada masalah:
```bash
pm2 logs expense-tracker
sudo tail -f /var/log/nginx/error.log
```

## Update Aplikasi

Untuk update aplikasi di kemudian hari:
```bash
cd /var/www/expense-tracker
git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 restart expense-tracker
```

## Troubleshooting

### Aplikasi tidak bisa diakses
```bash
# Cek status PM2
pm2 status

# Restart aplikasi
pm2 restart expense-tracker

# Cek logs
pm2 logs expense-tracker
```

### Error Nginx
```bash
# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Cek logs
sudo tail -f /var/log/nginx/error.log
```

### Database error
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (HATI-HATI: akan menghapus data)
npx prisma migrate reset

# Atau hanya migrate
npx prisma migrate deploy
npm run seed
```

## Monitoring

Lihat resource usage:
```bash
pm2 monit
```

Setup PM2 monitoring (optional):
```bash
pm2 install pm2-logrotate
```

---

## 📁 Files Konfigurasi

Repository ini sudah dilengkapi dengan file-file konfigurasi deployment:

### `ecosystem.config.js`
PM2 process configuration file. Mendefinisikan:
- Nama aplikasi: `expense-tracker`
- Port: 3001
- Working directory: `/var/www/expense-tracker`
- Environment variables
- Log file locations
- Auto-restart settings

### `first-deploy.sh`
Script bash untuk first-time deployment ke VPS. Otomatis menjalankan:
1. Setup direktori
2. Clone repository
3. Install dependencies
4. Setup database
5. Build aplikasi
6. Konfigurasi PM2, Nginx, dan SSL

Cara pakai:
```bash
chmod +x first-deploy.sh
./first-deploy.sh
```

### `deploy.sh`
Script bash untuk update deployment. Otomatis menjalankan:
1. Pull latest code
2. Install/update dependencies
3. Run database migrations
4. Build aplikasi
5. Restart PM2

Cara pakai:
```bash
chmod +x deploy.sh
./deploy.sh
```

**Note**: Script-script ini menggunakan SSH untuk menjalankan command di VPS. Pastikan SSH key sudah dikonfigurasi.
