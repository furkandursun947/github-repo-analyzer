# GitHub Repo Analizörü

Bu uygulama, GitHub repo URL'si alarak repo hakkında detaylı bilgiler (kullanılan teknolojiler, diller, bağımlılıklar, vb.) sunan bir analiz aracıdır.

## Özellikler

- GitHub repo analizi
- Kullanılan dillerin görsel grafiği
- Tespit edilen teknolojilerin listesi
- Paket bağımlılıklarının detaylı görünümü
- Katkıda bulunanların listesi

## Teknolojik Altyapı

### Frontend

- React + TypeScript
- Tailwind CSS
- React Router
- Chart.js & React-ChartJS-2
- Axios

### Backend

- Node.js + Express
- TypeScript
- GitHub API Entegrasyonu

## Kurulum

### Ön Gereksinimler

- Node.js (v14+)
- npm veya yarn

### Backend Kurulumu

```bash
# Backend klasörüne git
cd github-analyzer/backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur (opsiyonel ama tavsiye edilir)
cp .env.example .env
# .env dosyasını düzenleyerek GitHub token ekleyebilirsiniz

# Sunucuyu başlat
npm run dev
```

### Frontend Kurulumu

```bash
# Frontend klasörüne git
cd github-analyzer/frontend

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

## Kullanım

1. Frontend uygulamasını açın (varsayılan olarak http://localhost:5173/)
2. Analiz etmek istediğiniz GitHub repo URL'sini girin (örn: https://github.com/username/repo)
3. "Analiz Et" düğmesine tıklayın
4. Repo hakkında detaylı analizleri görüntüleyin

## Lisans

MIT
# github-repo-analyzer
