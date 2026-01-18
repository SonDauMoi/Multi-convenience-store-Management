import {
  sequelize,
  ProductTemplate,
  StoreProduct,
  Store,
} from "../src/models/index.js";

// Danh sách sản phẩm với từ khóa tiếng Anh để tìm ảnh chính xác
const productData = [
  // Grocery - Thực phẩm
  {
    name: "Gạo ST25 túi 5kg",
    description:
      "Gạo ST25 thơm ngon, hạt dài, được mệnh danh là gạo ngon nhất thế giới",
    category: "grocery",
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80", // rice bag
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80",
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80", // rice grains
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&q=80", // rice close up
    ],
  },
  {
    name: "Trứng gà ta hộp 10 quả",
    description:
      "Trứng gà ta tươi ngon, giàu dinh dưỡng, an toàn vệ sinh thực phẩm",
    category: "grocery",
    price: 45000,
    image:
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80", // eggs carton
    images: [
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80",
      "https://images.unsplash.com/photo-1587486937695-f96ab2549ec6?w=800&q=80", // brown eggs
      "https://images.unsplash.com/photo-1498654077810-b9c8db8fe011?w=800&q=80", // eggs in basket
    ],
  },
  {
    name: "Thịt ba chỉ heo 500g",
    description:
      "Thịt ba chỉ heo tươi ngon, thớ thịt mềm, phù hợp nhiều món ăn",
    category: "grocery",
    price: 89000,
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80", // pork belly
    images: [
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80",
      "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800&q=80", // raw pork
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80", // meat market
    ],
  },
  {
    name: "Cá hồi Na Uy phi lê 300g",
    description: "Cá hồi Na Uy nhập khẩu, giàu omega-3, thịt săn chắc",
    category: "grocery",
    price: 195000,
    image:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80", // salmon fillet
    images: [
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
      "https://images.unsplash.com/photo-1580959375944-57151228e30b?w=800&q=80", // salmon steak
      "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&q=80", // fresh salmon
    ],
  },
  {
    name: "Rau cải xanh hữu cơ",
    description: "Rau cải xanh hữu cơ, không thuốc trừ sâu, tươi mát",
    category: "grocery",
    price: 18000,
    image:
      "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=800&q=80", // bok choy
    images: [
      "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=800&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80", // green vegetables
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80", // fresh greens
    ],
  },
  {
    name: "Táo Fuji Nhật Bản hộp 6 trái",
    description: "Táo Fuji Nhật Bản ngọt giòn, size to, đẹp mắt",
    category: "grocery",
    price: 125000,
    image:
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80", // red apples
    images: [
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&q=80", // fuji apples
      "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&q=80", // apple box
    ],
  },
  {
    name: "Sữa tươi Vinamilk 1L",
    description: "Sữa tươi tiệt trùng Vinamilk không đường, giàu canxi",
    category: "grocery",
    price: 35000,
    image:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80", // milk carton
    images: [
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80",
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80", // fresh milk
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", // milk bottle
    ],
  },
  {
    name: "Dầu ăn Neptune 1L",
    description: "Dầu ăn Neptune cao cấp, 100% từ đậu nành",
    category: "grocery",
    price: 42000,
    image:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80", // cooking oil
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80",
      "https://images.unsplash.com/photo-1608198399988-841b7c7e3dc4?w=800&q=80", // oil bottle
    ],
  },

  // Snack - Đồ ăn vặt
  {
    name: "Snack khoai tây Lay's vị phô mai 52g",
    description: "Snack khoai tây chiên giòn tan, vị phô mai thơm béo",
    category: "snack",
    price: 12000,
    image:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80", // potato chips
    images: [
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80",
      "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=800&q=80", // chips bag
      "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=800&q=80", // potato chips close
    ],
  },
  {
    name: "Bánh Oreo gói 137g",
    description: "Bánh quy Oreo kem vani, giòn tan thơm ngon",
    category: "snack",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80", // oreo cookies
    images: [
      "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80",
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80", // oreo stack
      "https://images.unsplash.com/photo-1600117462643-e93a5f3e69f6?w=800&q=80", // cookies package
    ],
  },
  {
    name: "Socola KitKat 4 thanh",
    description: "Socola sữa phủ bánh xốp giòn tan KitKat",
    category: "snack",
    price: 28000,
    image:
      "https://images.unsplash.com/photo-1606312619070-d48b4863ad08?w=800&q=80", // chocolate bar
    images: [
      "https://images.unsplash.com/photo-1606312619070-d48b4863ad08?w=800&q=80",
      "https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&q=80", // chocolate wafer
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80", // chocolate snack
    ],
  },
  {
    name: "Kẹo dẻo Haribo gấu vàng 100g",
    description: "Kẹo dẻo hình gấu nhiều vị trái cây, thơm ngon",
    category: "snack",
    price: 32000,
    image:
      "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80", // gummy bears
    images: [
      "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80",
      "https://images.unsplash.com/photo-1631540616851-b8a0f3d7c7e9?w=800&q=80", // candy gummy
      "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80", // colorful candy
    ],
  },
  {
    name: "Hạt điều rang muối Vinamit 150g",
    description: "Hạt điều rang muối giòn ngon, bổ dưỡng",
    category: "snack",
    price: 68000,
    image:
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80", // cashew nuts
    images: [
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80",
      "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=800&q=80", // roasted nuts
      "https://images.unsplash.com/photo-1582047037087-5b9c86257467?w=800&q=80", // nuts snack
    ],
  },

  // Beverage - Đồ uống
  {
    name: "Coca Cola lon 330ml",
    description: "Nước ngọt có gas Coca Cola, sảng khoái tươi mát",
    category: "beverage",
    price: 10000,
    image:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80", // coca cola can
    images: [
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80",
      "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&q=80", // coke close up
      "https://images.unsplash.com/photo-1622766768290-d43e18c08edc?w=800&q=80", // soda can
    ],
  },
  {
    name: "Nước cam ép Tropicana 1L",
    description: "Nước cam ép 100% không đường, giàu vitamin C",
    category: "beverage",
    price: 42000,
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80", // orange juice
    images: [
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80",
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80", // juice bottle
      "https://images.unsplash.com/photo-1600271772470-bd22a42787b3?w=800&q=80", // orange drink
    ],
  },
  {
    name: "Trà xanh C2 hương chanh 455ml",
    description: "Trà xanh C2 hương chanh sảng khoái, thanh mát",
    category: "beverage",
    price: 9000,
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80", // green tea bottle
    images: [
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80",
      "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80", // iced tea
      "https://images.unsplash.com/photo-1544145945-35fc6cfb5e5e?w=800&q=80", // lemon tea
    ],
  },
  {
    name: "Nước suối Lavie 500ml",
    description: "Nước khoáng tinh khiết Lavie, an toàn cho sức khỏe",
    category: "beverage",
    price: 5000,
    image:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80", // water bottle
    images: [
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80", // mineral water
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80", // bottled water
    ],
  },
  {
    name: "Cà phê sữa G7 hộp 16 gói",
    description: "Cà phê sữa hòa tan G7 3in1 thơm ngon đậm đà",
    category: "beverage",
    price: 38000,
    image:
      "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80", // instant coffee
    images: [
      "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80", // coffee sachet
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80", // coffee drink
    ],
  },
  {
    name: "Bia Heineken lon 330ml",
    description: "Bia Heineken Hà Lan, hương vị đặc trưng",
    category: "beverage",
    price: 18000,
    image:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80", // heineken can
    images: [
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80",
      "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&q=80", // beer can
      "https://images.unsplash.com/photo-1594027882758-1f4df6fe19b1?w=800&q=80", // lager beer
    ],
  },

  // Household - Đồ gia dụng
  {
    name: "Nước rửa chén Sunlight 750ml",
    description: "Nước rửa chén Sunlight chanh vàng, sạch dầu mỡ",
    category: "household",
    price: 28000,
    image:
      "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=800&q=80", // dish soap
    images: [
      "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=800&q=80",
      "https://images.unsplash.com/photo-1627126525515-d16f34e41fb9?w=800&q=80", // cleaning liquid
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80", // detergent bottle
    ],
  },
  {
    name: "Nước giặt OMO Matic 3.7kg",
    description: "Nước giặt OMO dành cho máy giặt, sạch vượt trội",
    category: "household",
    price: 195000,
    image:
      "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=80", // laundry detergent
    images: [
      "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=80",
      "https://images.unsplash.com/photo-1582561833854-5cc7f02e2c87?w=800&q=80", // washing liquid
      "https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=800&q=80", // detergent jug
    ],
  },
  {
    name: "Túi rác đen cuộn 30 túi",
    description: "Túi rác đen size đại 65x78cm, bền chắc",
    category: "household",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=800&q=80", // trash bags
    images: [
      "https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=800&q=80",
      "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800&q=80", // garbage bags
    ],
  },
  {
    name: "Giấy vệ sinh Pulppy 10 cuộn",
    description: "Giấy vệ sinh Pulppy 3 lớp mềm mại, thấm hút tốt",
    category: "household",
    price: 42000,
    image:
      "https://images.unsplash.com/photo-1584967918940-a7d51b064268?w=800&q=80", // toilet paper
    images: [
      "https://images.unsplash.com/photo-1584967918940-a7d51b064268?w=800&q=80",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80", // tissue roll
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80", // paper towel
    ],
  },
  {
    name: "Bông tẩy trang 3 lớp 222 miếng",
    description: "Bông tẩy trang cotton mềm mại, không gây kích ứng",
    category: "household",
    price: 18000,
    image:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80", // cotton pads
    images: [
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80",
      "https://images.unsplash.com/photo-1612165362824-1e9d8c879e00?w=800&q=80", // cotton rounds
    ],
  },

  // Personal Care - Chăm sóc cá nhân
  {
    name: "Kem đánh răng PS 230g",
    description: "Kem đánh răng P/S ngừa sâu răng, hơi thở thơm mát",
    category: "personal_care",
    price: 32000,
    image:
      "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&q=80", // toothpaste
    images: [
      "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&q=80",
      "https://images.unsplash.com/photo-1622372738946-62e02505feb3?w=800&q=80", // dental care
      "https://images.unsplash.com/photo-1598662957477-f0262a8cf3c7?w=800&q=80", // toothpaste tube
    ],
  },
  {
    name: "Dầu gội Clear Men 650g",
    description: "Dầu gội Clear Men chống gàu hiệu quả, mát lạnh",
    category: "personal_care",
    price: 115000,
    image:
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80", // shampoo bottle
    images: [
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80",
      "https://images.unsplash.com/photo-1571781418606-70265b9cce90?w=800&q=80", // hair care
      "https://images.unsplash.com/photo-1629198726868-b0cfeaf1eb4e?w=800&q=80", // shampoo
    ],
  },
  {
    name: "Sữa tắm Dove dưỡng ẩm 530g",
    description: "Sữa tắm Dove nuôi dưỡng làn da mềm mượt",
    category: "personal_care",
    price: 98000,
    image:
      "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80", // body wash
    images: [
      "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80", // shower gel
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80", // bath products
    ],
  },
  {
    name: "Nước hoa Chanel Coco 100ml",
    description: "Nước hoa Chanel Coco Mademoiselle quyến rũ sang trọng",
    category: "personal_care",
    price: 2850000,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80", // perfume bottle
    images: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80", // chanel perfume
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80", // luxury fragrance
    ],
  },
  {
    name: "Mặt nạ JM Solution 10 miếng",
    description: "Mặt nạ dưỡng da JM Solution cấp ẩm tức thì",
    category: "personal_care",
    price: 125000,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80", // face mask
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80", // sheet mask
      "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=800&q=80", // skincare mask
    ],
  },
  {
    name: "Khăn giấy Kleenex hộp 150 tờ",
    description: "Khăn giấy rút Kleenex 3 lớp mềm mại",
    category: "personal_care",
    price: 22000,
    image:
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80", // tissue box
    images: [
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80",
      "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&q=80", // facial tissues
    ],
  },

  // Other - Khác
  {
    name: "Bật lửa Zippo đen mờ",
    description: "Bật lửa Zippo chính hãng USA, bền bỉ theo thời gian",
    category: "other",
    price: 680000,
    image:
      "https://images.unsplash.com/photo-1613214150494-fe88d4797dba?w=800&q=80", // zippo lighter
    images: [
      "https://images.unsplash.com/photo-1613214150494-fe88d4797dba?w=800&q=80",
      "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800&q=80", // metal lighter
      "https://images.unsplash.com/photo-1560747178-0d97e60e2a1e?w=800&q=80", // classic lighter
    ],
  },
  {
    name: "Pin AA Panasonic vỉ 4 viên",
    description: "Pin tiểu AA Panasonic chất lượng cao, dung lượng lớn",
    category: "other",
    price: 28000,
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80", // batteries
    images: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80", // aa batteries
    ],
  },
  {
    name: "Bao cao su Durex hộp 12 cái",
    description: "Bao cao su Durex siêu mỏng, độ tin cậy cao",
    category: "other",
    price: 125000,
    image:
      "https://images.unsplash.com/photo-1522057306606-9cb5838c7d7f?w=800&q=80", // condom box
    images: [
      "https://images.unsplash.com/photo-1522057306606-9cb5838c7d7f?w=800&q=80",
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80", // contraceptive
    ],
  },
];

// Hàm tạo số lượng ngẫu nhiên
function randomQuantity(min = 10, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedProducts() {
  try {
    console.log("🌱 Bắt đầu seed products với ảnh chính xác...");

    // Sync database
    await sequelize.authenticate();
    console.log("✅ Database connected!");

    // Lấy tất cả stores
    const stores = await Store.findAll();
    if (stores.length === 0) {
      console.error("❌ Không có store nào. Vui lòng tạo stores trước!");
      return;
    }

    console.log(`📍 Tìm thấy ${stores.length} stores`);

    // Xóa dữ liệu cũ (nếu có flag --clear)
    const shouldClearOldData = process.argv.includes("--clear");
    if (shouldClearOldData) {
      await StoreProduct.destroy({ where: {} });
      await ProductTemplate.destroy({ where: {} });
      console.log("🗑️  Đã xóa dữ liệu cũ");
    }

    // Tạo ProductTemplates
    console.log(`\n📦 Tạo ${productData.length} product templates...`);
    const createdTemplates = [];

    for (const product of productData) {
      const template = await ProductTemplate.create(product);
      createdTemplates.push(template);
      console.log(`  ✓ ${template.name}`);
    }

    // Tạo StoreProducts
    console.log("\n🏪 Tạo StoreProducts cho các cửa hàng...");
    let totalStoreProducts = 0;

    for (const template of createdTemplates) {
      for (const store of stores) {
        // 70% sản phẩm có trong store
        if (Math.random() > 0.3) {
          const quantity = randomQuantity(5, 150);
          await StoreProduct.create({
            store_id: store.id,
            product_template_id: template.id,
            quantity: quantity,
            sold: Math.floor(quantity * Math.random() * 0.3),
            price: template.price * (0.95 + Math.random() * 0.1),
          });
          totalStoreProducts++;
        }
      }
    }

    console.log(`\n✅ Seed hoàn tất!`);
    console.log(`📊 Thống kê:`);
    console.log(`   - Product Templates: ${createdTemplates.length}`);
    console.log(`   - Store Products: ${totalStoreProducts}`);
    console.log(`   - Stores: ${stores.length}`);
    console.log(`   - Ảnh: Unsplash (từ khóa tiếng Anh chính xác)`);
  } catch (error) {
    console.error("❌ Lỗi seed:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run seed
seedProducts()
  .then(() => {
    console.log("🎉 Seed thành công!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("💥 Seed thất bại:", err);
    process.exit(1);
  });
