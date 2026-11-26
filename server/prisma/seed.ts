// Demo data: two owner accounts and sample home/commercial listings across Adana.
// Run with: docker compose exec api npx prisma db seed
// Safe to run again: it first removes the demo accounts and everything they own.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Demo-only credentials, documented in the README. Never use them for real accounts.
const DEMO_PASSWORD = "demo1234";
const OWNERS = [
  { key: "office", name: "Demo Emlak Ofisi", email: "demo.emlak@example.com", phone: "05550000001" },
  { key: "person", name: "Ayşe Yılmaz (Demo)", email: "demo.ayse@example.com", phone: "05550000002" },
] as const;

type OwnerKey = (typeof OWNERS)[number]["key"];

interface SeedListing {
  owner: OwnerKey;
  type: "HOME" | "OFFICE";
  title: string;
  description: string;
  price: number;
  area: number;
  rooms: number;
  district: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  photos: string[]; // file names in prisma/seed-images
}

const LISTINGS: SeedListing[] = [
  {
    owner: "office",
    type: "HOME",
    title: "Turgut Özal'da site içinde 3+1 daire",
    description:
      "Havuzlu ve güvenlikli site içinde, güney cepheli 3+1 daire.\n\nAçık mutfak, ebeveyn banyosu, iki balkon\nKapalı otopark, 7/24 güvenlik\nOkullara ve Turgut Özal Bulvarı'na yürüme mesafesinde\n\nAidat: 1.500 ₺ · Depozito: 2 kira",
    price: 32000,
    area: 145,
    rooms: 3,
    district: "Çukurova",
    neighborhood: "Turgut Özal Mahallesi",
    address: "Turgut Özal Blv. yakını",
    lat: 37.0452,
    lng: 35.3021,
    photos: ["turgutozal-salon", "turgutozal-yemek", "turgutozal-yatak"],
  },
  {
    owner: "person",
    type: "HOME",
    title: "Güzelyalı'da eşyalı 1+1 daire",
    description:
      "Tek kişi ya da çift için uygun, tamamen eşyalı 1+1 daire.\n\nBeyaz eşyalar mevcut\nDoğalgaz kombi\nToplu taşımaya 2 dakika\n\nAidat: 600 ₺",
    price: 17500,
    area: 65,
    rooms: 1,
    district: "Çukurova",
    neighborhood: "Güzelyalı Mahallesi",
    address: "",
    lat: 37.0388,
    lng: 35.2887,
    photos: ["guzelyali-salon", "guzelyali-mutfak"],
  },
  {
    owner: "person",
    type: "HOME",
    title: "Reşatbey'de asansörlü binada 2+1",
    description:
      "Şehir merkezinde, asansörlü binanın 4. katında 2+1 daire.\n\nYeni yapılmış mutfak\nGeniş salon\nÇarşıya ve hastanelere yakın\n\nAidat: 750 ₺",
    price: 22000,
    area: 110,
    rooms: 2,
    district: "Seyhan",
    neighborhood: "Reşatbey Mahallesi",
    address: "",
    lat: 37.0012,
    lng: 35.3243,
    photos: ["resatbey-salon", "resatbey-mutfak", "resatbey-yatak"],
  },
  {
    owner: "office",
    type: "HOME",
    title: "Ziyapaşa'da yeni binada 3+1 daire",
    description:
      "2024 yapımı binada, ilk kez kiraya verilecek 3+1 daire.\n\nYerden ısıtma\nAnkastre mutfak\nOtopark ve jeneratör\n\nAidat: 1.200 ₺ · Depozito: 2 kira",
    price: 28000,
    area: 135,
    rooms: 3,
    district: "Seyhan",
    neighborhood: "Ziyapaşa Mahallesi",
    address: "",
    lat: 37.0041,
    lng: 35.3229,
    photos: ["ziyapasa-bina", "ziyapasa-salon", "ziyapasa-mutfak"],
  },
  {
    owner: "person",
    type: "HOME",
    title: "Sinanpaşa'da bahçeli müstakil ev",
    description:
      "Tek katlı, 200 m² bahçe içinde müstakil ev.\n\n3 oda, 1 salon\nAraç girişi olan bahçe\nEvcil hayvana uygun",
    price: 19000,
    area: 160,
    rooms: 3,
    district: "Yüreğir",
    neighborhood: "Sinanpaşa Mahallesi",
    address: "",
    lat: 36.9893,
    lng: 35.3521,
    photos: ["sinanpasa-dis", "sinanpasa-salon", "sinanpasa-mutfak"],
  },
  {
    owner: "office",
    type: "HOME",
    title: "Gültepe'de öğrenciye uygun 2+1",
    description:
      "Çukurova Üniversitesi'ne servisle 10 dakika, öğrenciye uygun 2+1 daire.\n\nEşyalı\nİnternet altyapısı hazır\nAylık ödeme",
    price: 15000,
    area: 95,
    rooms: 2,
    district: "Sarıçam",
    neighborhood: "Gültepe Mahallesi",
    address: "",
    lat: 37.0309,
    lng: 35.3818,
    photos: ["gultepe-oda", "gultepe-mutfak"],
  },
  {
    owner: "office",
    type: "OFFICE",
    title: "Cemalpaşa'da 120 m² ofis katı",
    description:
      "İş merkezinde, bölmeli 120 m² ofis katı.\n\n4 çalışma odası ve bekleme alanı\nMerkezi klima\nAsansör ve otopark",
    price: 35000,
    area: 120,
    rooms: 4,
    district: "Seyhan",
    neighborhood: "Cemalpaşa Mahallesi",
    address: "",
    lat: 37.0104,
    lng: 35.3152,
    photos: ["cemalpasa-ofis", "cemalpasa-bekleme"],
  },
  {
    owner: "office",
    type: "OFFICE",
    title: "Toros'ta plaza katında 250 m² açık ofis",
    description:
      "Plaza binasında, tek kat 250 m² açık ofis.\n\nToplantı salonu ve mutfak\nFiber internet\nGüvenlik ve resepsiyon hizmeti binaya dahil",
    price: 65000,
    area: 250,
    rooms: 6,
    district: "Çukurova",
    neighborhood: "Toros Mahallesi",
    address: "",
    lat: 37.0298,
    lng: 35.3082,
    photos: ["toros-acikofis", "toros-toplanti"],
  },
  {
    owner: "person",
    type: "OFFICE",
    title: "Kurtuluş'ta cadde üzeri 80 m² dükkân",
    description:
      "Yaya trafiği yoğun caddede, geniş vitrinli 80 m² dükkân.\n\nWC ve küçük depo alanı\nHer sektöre uygun\nDepozito: 3 kira",
    price: 40000,
    area: 80,
    rooms: 1,
    district: "Seyhan",
    neighborhood: "Kurtuluş Mahallesi",
    address: "",
    lat: 36.9991,
    lng: 35.3202,
    photos: ["kurtulus-vitrin"],
  },
  {
    owner: "office",
    type: "OFFICE",
    title: "Beyazevler'de AVM içinde 45 m² mağaza",
    description:
      "Alışveriş merkezinin giriş katında 45 m² mağaza.\n\nYürüyen merdiven karşısı\nOrtak alan giderleri: 2.000 ₺",
    price: 30000,
    area: 45,
    rooms: 1,
    district: "Çukurova",
    neighborhood: "Beyazevler Mahallesi",
    address: "",
    lat: 37.0213,
    lng: 35.2958,
    photos: ["beyazevler-avm"],
  },
  {
    owner: "office",
    type: "OFFICE",
    title: "Kazım Karabekir'de 600 m² depo",
    description:
      "Çevre yoluna yakın, tır girişine uygun 600 m² depo.\n\nYükseklik 8 m\nEpoksi zemin\n2 yükleme kapısı ve 30 m² ofis bölümü",
    price: 55000,
    area: 600,
    rooms: 1,
    district: "Yüreğir",
    neighborhood: "Kazım Karabekir Mahallesi",
    address: "",
    lat: 36.9951,
    lng: 35.3648,
    photos: ["kazimkarabekir-depo", "kazimkarabekir-depo2"],
  },
];

const imagesDir = path.join(__dirname, "seed-images");
const uploadsDir = path.join(process.cwd(), "uploads");

/** Copy a seed photo into uploads/ under a fresh name, as an upload would be stored. */
function storePhoto(name: string): string {
  const fileName = `seed-${name}-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
  fs.copyFileSync(path.join(imagesDir, `${name}.jpg`), path.join(uploadsDir, fileName));
  return `/uploads/${fileName}`;
}

async function main() {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const emails = OWNERS.map((o) => o.email);

  // Remove an earlier demo seed (and its photo files) before inserting again.
  const old = await prisma.listing.findMany({ where: { owner: { email: { in: emails } } }, select: { photos: true } });
  old.flatMap((l) => l.photos).forEach((p) => fs.rmSync(path.join(process.cwd(), p), { force: true }));
  const oldUsers = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = oldUsers.map((u) => u.id);
  await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] } });
  await prisma.appointment.deleteMany({ where: { OR: [{ seekerId: { in: ids } }, { listing: { ownerId: { in: ids } } }] } });
  await prisma.listing.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ownerIds = {} as Record<OwnerKey, number>;
  for (const o of OWNERS) {
    const user = await prisma.user.create({ data: { name: o.name, email: o.email, phone: o.phone, password } });
    ownerIds[o.key] = user.id;
  }

  // Spread creation dates over the last weeks so "latest listings" has an order.
  const now = Date.now();
  for (const [i, l] of LISTINGS.entries()) {
    await prisma.listing.create({
      data: {
        title: l.title,
        description: l.description,
        type: l.type,
        price: l.price,
        area: l.area,
        rooms: l.rooms,
        city: "Adana",
        district: l.district,
        neighborhood: l.neighborhood,
        address: l.address,
        lat: l.lat,
        lng: l.lng,
        photos: l.photos.map(storePhoto),
        ownerId: ownerIds[l.owner],
        createdAt: new Date(now - (i + 1) * 36 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`Seeded ${OWNERS.length} demo owners and ${LISTINGS.length} listings (password: ${DEMO_PASSWORD}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
