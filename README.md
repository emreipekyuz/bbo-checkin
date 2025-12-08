# Bir Bulut Olsam - Oyunlaştırılmış Check-in

Tek sayfalık, oyunlaştırılmış bir etkinlik karşılama deneyimi. Katılımcılar ruh hallerini seçiyor, görevleri tamamlayıp XP topluyor ve serilerini koruyarak check-in yapıyor.

## Öne Çıkanlar
- 🎮 **Görev Panosu & XP**: Ruh hali seçme, formu tamamlama ve KVKK onayıyla XP kazanımı; check-in sonrası otomatik bonus.
- 🔥 **Günlük Seri Takibi**: Art arda günlerde check-in yapıldıkça seri sayacı büyüyor.
- 💙 **Kalp Enerjisi Ölçeri**: Form dolduruldukça dolan kalp ve parlayan animasyonlar.
- ⭐ **Yıldız Avı Mini Oyunu**: Takımyıldızındaki yıldızlara dokunarak rastgele motivasyon mesajları.
- 🌗 **Karanlık Mod**: Tema tercihi otomatik hatırlanır.
- 🔒 **Doğrulamalar**: Telefon, e-posta ve KVKK onayı kontrolü.

## Kurulum
1. `apps-script.js` dosyasındaki kodu Google Apps Script projenize yapıştırın ve web uygulaması olarak yayınlayın.
   - Çalışma sayfanızda **Events** için `EventCode`, `EventName`, `Status` sütunları; **Check-ins** için `Timestamp`, `EventCode`, `EventName`, `Phone`, `Email`, `Mood` ve ad/soyad başlığı (örn. `Ad Soyad`) olmalıdır.
   - `Status` değeri **ACTIVE** olan etkinlikler listelenir, `Mood` kolonunuz yoksa kod otomatik ekler.
2. Yayın URL'inizi `index.html` dosyasındaki `WEBAPP_URL` değişkeniyle değiştirin.
3. Dosyayı statik olarak barındırın (GitHub Pages, Netlify vb.).
4. Sayfayı açın; etkinlik listesi ve mood istatistikleri API'den otomatik çekilir.

## Notlar
- Admin paneli kaldırıldı; tüm deneyim tek sayfalık oyuncu modunda.
- Mood istatistikleri ve etkinlik listesi Apps Script API'sinden çekilir; JSONP geri dönüşü desteklenir.

## Geliştirme
- Değişiklik sonrası yerel bir statik sunucuyla (`python -m http.server` vb.) açıp deneyebilirsiniz.
- Tema, animasyon ve görev metinleri doğrudan `index.html` içerisinde düzenlenebilir.
