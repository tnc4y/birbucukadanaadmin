# 1.5 Adana Admin Panel (Next.js + Firebase)

Bu panel ile mobil uygulamadaki tum icerikler Firebase Firestore uzerinden yonetilir.

## Ozellikler

- Firebase Auth giris (email/sifre)
- Opsiyonel UID bazli admin kisitlamasi (`NEXT_PUBLIC_ALLOWED_ADMIN_UIDS`)
- `settings/app` dokumani icin JSON editor
- Koleksiyon bazli CRUD JSON editor:
  - `announcements`
  - `teams`
  - `events`
  - `sponsors`
  - `competitions`
  - `awards`
  - `projects`

## Kurulum

1. Klasore gecin:
   - `cd admin-panel`
2. Bagimliliklari yukleyin:
   - `npm install`
3. Ortam dosyasi olusturun:
   - `.env.example` kopyasini `.env.local` yapin
4. Firebase degerlerini doldurun.
5. Calistirin:
   - `npm run dev`

## Firebase Auth

- Firebase Authentication bolumunden Email/Password provider acik olmali.
- `NEXT_PUBLIC_ALLOWED_ADMIN_UIDS` bos birakilirsa oturum acan herkes panele girer.
- Guvenlik icin admin UID listesini doldurun.

## Firestore Beklenen Yapi

Panel JSON tabanli oldugu icin alanlar serbesttir; ancak mobil uygulama ile uyumlu olmasi icin asagidaki alanlar onerilir:

- `settings/app`:
  - `appName`, `aboutTitle`, `aboutContent`, `contactEmail`, `contactPhone`, `contactAddress`, `socialLinks[]`
- `announcements`:
  - `title`, `summary`, `content`, `imageUrl`, `order`, `visible`, `buttonText`, `buttonUrl`, `showAsPopup`, `popupDismissKey`
- `teams`:
  - `name`, `logoUrl`, `shortDescription`, `description`, `bannerUrl`, `homeOrder`, `visible`, `socialLinks[]`
- `events`:
  - `title`, `description`, `tag`, `date`, `imageUrl`, `teamId`, `visible`
- `sponsors`:
  - `name`, `logoUrl`, `website`, `description`, `teamId`, `visible`
- `competitions`:
  - `title`, `performance`, `year`, `teamId`, `imageUrl`, `visible`
- `awards`:
  - `title`, `description`, `projectName`, `teamId`, `mediaUrl`, `year`, `visible`
- `projects`:
  - `title`, `description`, `teamId`, `mediaUrl`, `repoUrl`, `visible`

## Not

Panelde JSON dogrudan Firestore'a yazilir. Alan adlarinda yazim hatasi yapilmamasi icin standart alan listesini kullanin.
