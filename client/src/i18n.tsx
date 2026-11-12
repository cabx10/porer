import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "tr" | "en";

const tr = {
  "nav.search": "İlan Ara",
  "nav.messages": "Mesajlar",
  "nav.dashboard": "Panelim",
  "nav.profile": "Profilim",
  "nav.logout": "Çıkış Yap",
  "nav.newListing": "İlan Ver",
  "nav.login": "Giriş Yap",
  "nav.register": "Kayıt Ol",
  "footer.tagline": "Kiralık ev ve işyeri bulmanın kolay yolu",

  "common.back": "Geri",
  "common.continue": "Devam",
  "common.cancel": "Vazgeç",
  "common.retry": "Tekrar dene",
  "common.loadError": "Bir şeyler ters gitti, veriler yüklenemedi.",

  "type.ALL": "Tümü",
  "type.HOME": "Konut",
  "type.OFFICE": "İşyeri",
  "status.PENDING": "Bekliyor",
  "status.APPROVED": "Onaylandı",
  "status.REJECTED": "Reddedildi",

  "listing.perMonth": "/ay",
  "listing.roomsCount": "{n} oda",
  "listing.photosShort": "foto",

  "location.city": "İl seçin",
  "location.district": "İlçe seçin",
  "location.neighborhood": "Mahalle seçin",
  "location.allCities": "Tüm iller",
  "location.allDistricts": "Tüm ilçeler",
  "location.allNeighborhoods": "Tüm mahalleler",

  "home.title": "Kiralık ev ve işyeri bulun",
  "home.subtitle": "Konuma, fiyata ve büyüklüğe göre filtreleyin; ilanları haritada görün.",
  "home.resultCount": "{n} ilan bulundu",
  "home.emptyTitle": "Aramanıza uygun ilan yok",
  "home.emptyText": "Filtreleri genişletmeyi ya da farklı bir bölge seçmeyi deneyin.",
  "filter.minPrice": "En az fiyat (₺)",
  "filter.maxPrice": "En çok fiyat (₺)",
  "filter.minArea": "En az m²",
  "filter.maxArea": "En çok m²",
  "filter.rooms": "Oda sayısı",
  "filter.more": "Daha fazla filtre",
  "filter.search": "Ara",
  "filter.clear": "Filtreleri temizle",

  "map.error": "Harita yüklenemedi",
  "gallery.noPhotos": "Bu ilan için fotoğraf eklenmemiş",
  "gallery.fullscreen": "Büyüt",

  "detail.backToListings": "İlanlara dön",
  "detail.notFound": "İlan bulunamadı",
  "detail.notFoundText": "Bu ilan kaldırılmış ya da adres hatalı olabilir.",
  "detail.published": "Yayın tarihi: {date}",
  "detail.overview": "Genel bakış",
  "detail.price": "Kira",
  "detail.area": "Alan",
  "detail.rooms": "Oda",
  "detail.type": "Tür",
  "detail.description": "Açıklama",
  "detail.location": "Konum",
  "detail.owner": "İlan sahibi",
  "detail.yourListing": "Bu sizin ilanınız.",
  "detail.edit": "İlanı düzenle",
  "detail.message": "Mesaj gönder",
  "detail.loginToContact": "Randevu istemek ve ilan sahibine yazmak için giriş yapın.",

  "viewing.title": "Görüntüleme randevusu",
  "viewing.date": "Tarih ve saat",
  "viewing.note": "Not (isteğe bağlı)",
  "viewing.notePlaceholder": "Örn. Hafta içi akşam saatleri uygunum.",
  "viewing.request": "Randevu iste",
  "viewing.sent": "Randevu talebiniz ilan sahibine iletildi.",

  "form.newTitle": "Yeni ilan oluştur",
  "form.editTitle": "İlanı düzenle",
  "form.step.details": "Bilgiler",
  "form.step.location": "Konum",
  "form.step.photos": "Fotoğraflar",
  "form.step.review": "Önizleme",
  "form.type": "İlan türü",
  "form.title": "İlan başlığı",
  "form.titleHint": "Kısa ve açıklayıcı olsun. Örn. Çukurova'da eşyalı 2+1 daire",
  "form.description": "Açıklama",
  "form.descriptionPlaceholder": "Evin öne çıkan özellikleri, bina ve çevre hakkında bilgiler…",
  "form.price": "Aylık kira",
  "form.area": "Alan",
  "form.rooms": "Oda sayısı",
  "form.region": "Bölge",
  "form.address": "Açık adres (isteğe bağlı)",
  "form.addressPlaceholder": "Sokak, bina no…",
  "form.pin": "Haritadaki konum",
  "form.pinSet": "Konum seçildi",
  "form.pinHint": "Bölge seçince harita oraya gider. Mülkün tam yerine tıklayarak işaretleyin.",
  "form.dropTitle": "Fotoğrafları sürükleyin ya da seçmek için tıklayın",
  "form.dropHint": "JPG, PNG veya WEBP · en fazla {mb} MB · ilk fotoğraf kapak olur",
  "form.existingPhotosNote": "Mevcut fotoğraflar korunur, yeni seçtikleriniz sona eklenir.",
  "form.cover": "Kapak",
  "form.makeCover": "Kapak yap",
  "form.removePhoto": "Kaldır",
  "form.reviewHint": "İlanınız ziyaretçilere böyle görünecek. Her şey doğruysa yayınlayın.",
  "form.photoCount": "{n} fotoğraf",
  "form.publish": "İlanı yayınla",
  "form.saveChanges": "Değişiklikleri kaydet",
  "form.published": "İlanınız yayında!",
  "form.updated": "İlan güncellendi.",
  "form.notYours": "Bu ilanı düzenleme yetkiniz yok.",
  "form.photoRejected": "Bazı dosyalar eklenmedi: yalnızca {mb} MB'tan küçük resim dosyaları kabul edilir.",
  "form.err.title": "Başlık en az 5 karakter olmalı.",
  "form.err.price": "Geçerli bir kira tutarı girin.",
  "form.err.area": "Geçerli bir alan girin.",
  "form.err.rooms": "Oda sayısını girin.",
  "form.err.city": "Bir il seçin.",
  "form.err.location": "Haritaya tıklayarak konumu işaretleyin.",

  "dash.title": "Panelim",
  "dash.greeting": "Merhaba {name}, ilanlarınızı ve randevularınızı buradan yönetin.",
  "dash.tab.listings": "İlanlarım",
  "dash.tab.incoming": "Gelen talepler",
  "dash.tab.requests": "Taleplerim",
  "dash.view": "Gör",
  "dash.edit": "Düzenle",
  "dash.delete": "Sil",
  "dash.approve": "Onayla",
  "dash.reject": "Reddet",
  "dash.approved": "Randevu onaylandı.",
  "dash.rejected": "Randevu reddedildi.",
  "dash.deleted": "İlan silindi.",
  "dash.deleteTitle": "İlanı sil",
  "dash.deleteText": "“{title}” ilanı ve ona ait randevu talepleri kalıcı olarak silinecek. Emin misiniz?",
  "dash.noListings": "Henüz ilanınız yok",
  "dash.noListingsText": "Evinizi ya da işyerinizi birkaç adımda kiraya verin.",
  "dash.noIncoming": "Gelen talep yok",
  "dash.noIncomingText": "İlanlarınız için randevu istendiğinde burada göreceksiniz.",
  "dash.noRequests": "Henüz randevu talebiniz yok",
  "dash.noRequestsText": "Beğendiğiniz bir ilanın sayfasından görüntüleme randevusu isteyebilirsiniz.",

  "messages.empty": "Henüz mesajınız yok",
  "messages.emptyText": "Bir ilanın sayfasından ilan sahibine mesaj gönderebilirsiniz.",
  "messages.select": "Okumak için soldan bir konuşma seçin.",
  "messages.general": "Genel",
  "messages.placeholder": "Mesajınızı yazın…",
  "messages.send": "Gönder",
  "messages.startHint": "Henüz mesaj yok. İlk mesajı siz yazın.",
  "messages.newToast": "Yeni mesaj: {text}",

  "auth.loginTitle": "Tekrar hoş geldiniz",
  "auth.loginSubtitle": "Hesabınıza giriş yapın",
  "auth.registerTitle": "Hesap oluşturun",
  "auth.registerSubtitle": "İlan vermek ve randevu istemek için ücretsiz kaydolun",
  "auth.name": "Ad soyad",
  "auth.email": "E-posta",
  "auth.phone": "Telefon",
  "auth.phoneHint": "İlanlarınızda iletişim için gösterilir.",
  "auth.password": "Şifre",
  "auth.passwordHint": "En az 6 karakter",
  "auth.togglePassword": "Şifreyi göster/gizle",
  "auth.createAccount": "Hesap oluştur",
  "auth.noAccount": "Hesabınız yok mu?",
  "auth.haveAccount": "Zaten hesabınız var mı?",
  "auth.welcome": "Hoş geldiniz, {name}!",
  "auth.welcomeBack": "Tekrar hoş geldiniz, {name}!",
  "auth.sessionExpired": "Oturumunuz sona erdi, lütfen tekrar giriş yapın.",
  "auth.err.name": "Adınızı girin.",
  "auth.err.email": "Geçerli bir e-posta adresi girin.",
  "auth.err.password": "Şifre en az 6 karakter olmalı.",
  "auth.err.passwordRequired": "Şifrenizi girin.",
  "auth.err.phone": "Geçerli bir telefon numarası girin (örn. 0555 123 45 67).",

  "profile.subtitle": "İletişim bilgileriniz ilanlarınızda görünür.",
  "profile.emailHint": "E-posta adresi değiştirilemez.",
  "profile.save": "Kaydet",
  "profile.saved": "Profiliniz güncellendi.",

  "notFound.title": "Sayfa bulunamadı",
  "notFound.text": "Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.",
  "notFound.home": "Ana sayfaya dön",

  "hero.badge": "{city}'da {n} aktif ilan",
  "hero.badgeLoading": "{city}'da kiralık ilanlar",
  "hero.title": "Yeni eviniz bir arama uzağınızda",
  "hero.subtitle": "Kiralık konut ve işyerlerini konuma, bütçeye ve büyüklüğe göre karşılaştırın; görüntüleme randevunuzu tek tıkla alın.",
  "hero.type": "Ne arıyorsunuz?",
  "hero.where": "Nerede?",
  "hero.allOf": "Tüm {city}",
  "hero.budget": "En çok kira",
  "hero.budgetPlaceholder": "Örn. 25000 ₺",
  "hero.point1": "Ücretsiz ilan verme",
  "hero.point2": "Online randevu talebi",
  "hero.point3": "İlan sahibiyle anlık mesajlaşma",
  "hero.newest": "En yeni ilan",
  "hero.viewingCard": "Randevu talebi gönderildi",
  "hero.viewingCardSub": "İlan sahibi onayladığında haber verilir",
  "home.latest": "Son eklenen ilanlar",
  "home.latestSub": "Yeni yayınlanan kiralık konut ve işyerleri",
  "home.viewAll": "Tüm ilanları gör",
  "home.noListingsYet": "Henüz yayında ilan yok. İlk ilanı siz verin!",
  "home.districts": "{city} ilçelerini keşfedin",
  "home.districtsSub": "Yaşamak ya da çalışmak istediğiniz bölgeyi seçin",
  "home.listingCount": "{n} ilan",
  "how.title": "Nasıl çalışır?",
  "how.subtitle": "Üç adımda yeni adresinize",
  "how.1.title": "Arayın ve karşılaştırın",
  "how.1.text": "Konum, kira, metrekare ve oda sayısına göre filtreleyin; ilanları listede ya da haritada inceleyin.",
  "how.2.title": "Randevu isteyin",
  "how.2.text": "Size uygun gün ve saati seçin, ilan sahibi talebinizi onayladığında haberiniz olsun.",
  "how.3.title": "Anahtarı teslim alın",
  "how.3.text": "Sorularınızı ilan sahibine mesajla sorun, evi görün ve yeni adresinize taşının.",
  "cta.title": "Mülkünüzü kiraya mı vermek istiyorsunuz?",
  "cta.text": "İlanınızı birkaç dakikada ücretsiz yayınlayın, randevu taleplerini tek panelden yönetin.",
  "cta.button": "Hemen ilan verin",
  "footer.about": "Kiralık konut ve işyeri arayanlarla mülk sahiplerini buluşturan, sade ve güvenilir bir kiralama platformu.",
  "footer.explore": "Keşfet",
  "footer.homes": "Kiralık konutlar",
  "footer.offices": "Kiralık işyerleri",
  "footer.mapSearch": "Haritada ara",
  "footer.owners": "Ev sahipleri için",

  "search.title": "Kiralık ilanlar",
  "search.titleIn": "{place} kiralık ilanlar",
  "search.list": "Liste",
  "search.map": "Harita",
  "search.mapLimited": "Haritada {total} ilandan {n} tanesi gösteriliyor",
  "filter.title": "Filtreler",
  "filter.type": "İlan türü",
  "filter.location": "Konum",
  "filter.rent": "Aylık kira",
  "filter.area": "Alan",
  "filter.min": "En az",
  "filter.max": "En çok",
  "filter.apply": "Sonuçları göster",
  "filter.clearAll": "Tümünü temizle",
  "filter.reset": "Temizle",
  "gallery.showAll": "Tüm fotoğraflar ({n})",
  "detail.openInMaps": "Google Haritalar'da aç",
};

export type TKey = keyof typeof tr;

const en: Record<TKey, string> = {
  "nav.search": "Search",
  "nav.messages": "Messages",
  "nav.dashboard": "My Dashboard",
  "nav.profile": "My Profile",
  "nav.logout": "Log out",
  "nav.newListing": "List a Property",
  "nav.login": "Log in",
  "nav.register": "Sign up",
  "footer.tagline": "The easy way to rent a home or office",

  "common.back": "Back",
  "common.continue": "Continue",
  "common.cancel": "Cancel",
  "common.retry": "Try again",
  "common.loadError": "Something went wrong and the data could not be loaded.",

  "type.ALL": "All",
  "type.HOME": "Home",
  "type.OFFICE": "Office",
  "status.PENDING": "Pending",
  "status.APPROVED": "Approved",
  "status.REJECTED": "Rejected",

  "listing.perMonth": "/mo",
  "listing.roomsCount": "{n} rooms",
  "listing.photosShort": "photos",

  "location.city": "Select province",
  "location.district": "Select district",
  "location.neighborhood": "Select neighborhood",
  "location.allCities": "All provinces",
  "location.allDistricts": "All districts",
  "location.allNeighborhoods": "All neighborhoods",

  "home.title": "Find a home or office to rent",
  "home.subtitle": "Filter by location, price and size, and see every listing on the map.",
  "home.resultCount": "{n} listings found",
  "home.emptyTitle": "No listings match your search",
  "home.emptyText": "Try widening your filters or choosing another area.",
  "filter.minPrice": "Min price (₺)",
  "filter.maxPrice": "Max price (₺)",
  "filter.minArea": "Min m²",
  "filter.maxArea": "Max m²",
  "filter.rooms": "Rooms",
  "filter.more": "More filters",
  "filter.search": "Search",
  "filter.clear": "Clear filters",

  "map.error": "The map could not be loaded",
  "gallery.noPhotos": "No photos for this listing",
  "gallery.fullscreen": "Enlarge",

  "detail.backToListings": "Back to listings",
  "detail.notFound": "Listing not found",
  "detail.notFoundText": "This listing may have been removed, or the address is wrong.",
  "detail.published": "Listed on {date}",
  "detail.overview": "Overview",
  "detail.price": "Rent",
  "detail.area": "Area",
  "detail.rooms": "Rooms",
  "detail.type": "Type",
  "detail.description": "Description",
  "detail.location": "Location",
  "detail.owner": "Listed by",
  "detail.yourListing": "This is your listing.",
  "detail.edit": "Edit listing",
  "detail.message": "Send a message",
  "detail.loginToContact": "Log in to request a viewing or message the owner.",

  "viewing.title": "Request a viewing",
  "viewing.date": "Date and time",
  "viewing.note": "Note (optional)",
  "viewing.notePlaceholder": "e.g. Weekday evenings work best for me.",
  "viewing.request": "Request viewing",
  "viewing.sent": "Your viewing request was sent to the owner.",

  "form.newTitle": "Create a listing",
  "form.editTitle": "Edit listing",
  "form.step.details": "Details",
  "form.step.location": "Location",
  "form.step.photos": "Photos",
  "form.step.review": "Review",
  "form.type": "Property type",
  "form.title": "Title",
  "form.titleHint": "Keep it short and clear, e.g. Furnished 2+1 flat in Çukurova",
  "form.description": "Description",
  "form.descriptionPlaceholder": "Highlights of the property, the building and the neighborhood…",
  "form.price": "Monthly rent",
  "form.area": "Area",
  "form.rooms": "Rooms",
  "form.region": "Area",
  "form.address": "Street address (optional)",
  "form.addressPlaceholder": "Street, building no…",
  "form.pin": "Location on the map",
  "form.pinSet": "Location set",
  "form.pinHint": "The map moves to the area you pick. Click the exact spot of the property to mark it.",
  "form.dropTitle": "Drag photos here or click to choose",
  "form.dropHint": "JPG, PNG or WEBP · up to {mb} MB · the first photo is the cover",
  "form.existingPhotosNote": "Existing photos are kept; new ones are added after them.",
  "form.cover": "Cover",
  "form.makeCover": "Make cover",
  "form.removePhoto": "Remove",
  "form.reviewHint": "This is how visitors will see your listing. Publish it if everything looks right.",
  "form.photoCount": "{n} photos",
  "form.publish": "Publish listing",
  "form.saveChanges": "Save changes",
  "form.published": "Your listing is live!",
  "form.updated": "Listing updated.",
  "form.notYours": "You can't edit this listing.",
  "form.photoRejected": "Some files were skipped: only images under {mb} MB are accepted.",
  "form.err.title": "The title must be at least 5 characters.",
  "form.err.price": "Enter a valid rent.",
  "form.err.area": "Enter a valid area.",
  "form.err.rooms": "Enter the number of rooms.",
  "form.err.city": "Choose a province.",
  "form.err.location": "Click the map to mark the location.",

  "dash.title": "My Dashboard",
  "dash.greeting": "Hi {name}, manage your listings and viewings here.",
  "dash.tab.listings": "My listings",
  "dash.tab.incoming": "Incoming requests",
  "dash.tab.requests": "My requests",
  "dash.view": "View",
  "dash.edit": "Edit",
  "dash.delete": "Delete",
  "dash.approve": "Approve",
  "dash.reject": "Decline",
  "dash.approved": "Viewing approved.",
  "dash.rejected": "Viewing declined.",
  "dash.deleted": "Listing deleted.",
  "dash.deleteTitle": "Delete listing",
  "dash.deleteText": "“{title}” and its viewing requests will be deleted permanently. Are you sure?",
  "dash.noListings": "You have no listings yet",
  "dash.noListingsText": "Rent out your home or office in a few steps.",
  "dash.noIncoming": "No incoming requests",
  "dash.noIncomingText": "Viewing requests for your listings will show up here.",
  "dash.noRequests": "You haven't requested any viewings",
  "dash.noRequestsText": "Request a viewing from any listing page you like.",

  "messages.empty": "No messages yet",
  "messages.emptyText": "You can message an owner from any listing page.",
  "messages.select": "Pick a conversation on the left to read it.",
  "messages.general": "General",
  "messages.placeholder": "Write a message…",
  "messages.send": "Send",
  "messages.startHint": "No messages yet. Say hello!",
  "messages.newToast": "New message: {text}",

  "auth.loginTitle": "Welcome back",
  "auth.loginSubtitle": "Log in to your account",
  "auth.registerTitle": "Create your account",
  "auth.registerSubtitle": "Sign up free to list properties and request viewings",
  "auth.name": "Full name",
  "auth.email": "Email",
  "auth.phone": "Phone",
  "auth.phoneHint": "Shown on your listings so people can reach you.",
  "auth.password": "Password",
  "auth.passwordHint": "At least 6 characters",
  "auth.togglePassword": "Show/hide password",
  "auth.createAccount": "Create account",
  "auth.noAccount": "Don't have an account?",
  "auth.haveAccount": "Already have an account?",
  "auth.welcome": "Welcome, {name}!",
  "auth.welcomeBack": "Welcome back, {name}!",
  "auth.sessionExpired": "Your session has ended. Please log in again.",
  "auth.err.name": "Enter your name.",
  "auth.err.email": "Enter a valid email address.",
  "auth.err.password": "The password must be at least 6 characters.",
  "auth.err.passwordRequired": "Enter your password.",
  "auth.err.phone": "Enter a valid phone number (e.g. 0555 123 45 67).",

  "profile.subtitle": "Your contact details appear on your listings.",
  "profile.emailHint": "Your email address can't be changed.",
  "profile.save": "Save",
  "profile.saved": "Your profile was updated.",

  "notFound.title": "Page not found",
  "notFound.text": "The page you're looking for may have moved or never existed.",
  "notFound.home": "Go to the home page",

  "hero.badge": "{n} active listings in {city}",
  "hero.badgeLoading": "Rentals in {city}",
  "hero.title": "Your next home is one search away",
  "hero.subtitle": "Compare homes and offices for rent by location, budget and size, and book a viewing in one click.",
  "hero.type": "Looking for",
  "hero.where": "Where",
  "hero.allOf": "All of {city}",
  "hero.budget": "Max rent",
  "hero.budgetPlaceholder": "e.g. ₺25,000",
  "hero.point1": "Free listings",
  "hero.point2": "Online viewing requests",
  "hero.point3": "Instant chat with owners",
  "hero.newest": "Newest listing",
  "hero.viewingCard": "Viewing request sent",
  "hero.viewingCardSub": "You will be notified when the owner approves",
  "home.latest": "Latest listings",
  "home.latestSub": "Homes and offices recently listed for rent",
  "home.viewAll": "View all listings",
  "home.noListingsYet": "No listings yet. Be the first to list a property!",
  "home.districts": "Explore {city} districts",
  "home.districtsSub": "Pick the area where you want to live or work",
  "home.listingCount": "{n} listings",
  "how.title": "How it works",
  "how.subtitle": "Three steps to your new address",
  "how.1.title": "Search and compare",
  "how.1.text": "Filter by location, rent, size and rooms, and browse listings as a list or on the map.",
  "how.2.title": "Request a viewing",
  "how.2.text": "Pick a day and time that suits you and get notified when the owner approves.",
  "how.3.title": "Get the keys",
  "how.3.text": "Message the owner with your questions, see the place and move in.",
  "cta.title": "Want to rent out your property?",
  "cta.text": "Publish your listing free in minutes and manage viewing requests from one dashboard.",
  "cta.button": "List your property",
  "footer.about": "A simple, reliable rental platform connecting people looking for homes and offices with property owners.",
  "footer.explore": "Explore",
  "footer.homes": "Homes for rent",
  "footer.offices": "Offices for rent",
  "footer.mapSearch": "Search on the map",
  "footer.owners": "For owners",

  "search.title": "Properties for rent",
  "search.titleIn": "Properties for rent in {place}",
  "search.list": "List",
  "search.map": "Map",
  "search.mapLimited": "Showing {n} of {total} listings on the map",
  "filter.title": "Filters",
  "filter.type": "Property type",
  "filter.location": "Location",
  "filter.rent": "Monthly rent",
  "filter.area": "Area",
  "filter.min": "Min",
  "filter.max": "Max",
  "filter.apply": "Show results",
  "filter.clearAll": "Clear all",
  "filter.reset": "Reset",
  "gallery.showAll": "Show all photos ({n})",
  "detail.openInMaps": "Open in Google Maps",
};

const dictionaries: Record<Lang, Record<TKey, string>> = { tr, en };
const locales: Record<Lang, string> = { tr: "tr-TR", en: "en-GB" };

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangValue>({ lang: "tr", setLang: () => {} });

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "tr" || saved === "en") return saved;
  } catch {
    // storage unavailable
  }
  return navigator.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      // storage unavailable
    }
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export type TFunction = ((key: TKey | string, params?: Record<string, string | number>) => string) & { lang: Lang };

/** Translate a key in the current language; `{name}` placeholders are filled from params. */
export function useT(): TFunction {
  const { lang } = useLang();
  return useMemo(() => {
    const dict = dictionaries[lang];
    const fn = (key: string, params?: Record<string, string | number>) => {
      let s = dict[key as TKey] ?? tr[key as TKey] ?? key;
      if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
      return s;
    };
    return Object.assign(fn, { lang });
  }, [lang]);
}

export const formatPrice = (n: number, lang: Lang) =>
  new Intl.NumberFormat(locales[lang], { style: "currency", currency: "TRY", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);

export const formatPriceShort = (n: number, lang: Lang) =>
  new Intl.NumberFormat(locales[lang], {
    style: "currency",
    currency: "TRY",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

export const formatDate = (iso: string, lang: Lang) => new Intl.DateTimeFormat(locales[lang], { dateStyle: "long" }).format(new Date(iso));

export const formatDateTime = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(locales[lang], { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export const formatTime = (iso: string, lang: Lang) => new Intl.DateTimeFormat(locales[lang], { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function formatRelative(iso: string, lang: Lang) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locales[lang], { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), "day");
  return new Intl.DateTimeFormat(locales[lang], { day: "numeric", month: "short" }).format(new Date(iso));
}
