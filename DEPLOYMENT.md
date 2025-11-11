# Panduan Deployment Expense Tracker ke VPS

## Informasi VPS
- IP: 43.157.243.243
- User: ubuntu
- Domain: expense.mdwisu.com

## Langkah-Langkah Deployment

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

Start aplikasi dengan PM2:
```bash
pm2 start npm --name "expense-tracker" -- start
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
        proxy_pass http://localhost:3000;
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
