import { 
  BusinessService, 
  Supplier, 
  SupplyTransaction, 
  BusinessProfile, 
  SalesInvoice, 
  InventoryItem, 
  InventoryRequest, 
  ServiceRequest, 
  Expense, 
  OfficeUseRequest, 
  Shareholder,
  CustomerAccount,
  HardwareTypeOption,
  EcommerceProduct,
  EcommerceOrder,
  EcommerceServiceTicket,
  CustomerInquiryMessage
} from './types';

export const INITIAL_PROFILE: BusinessProfile = {
  name: "ReliableTech",
  companyNameNepali: "सूर्योदय बहुउद्देश्यीय सहकारी संस्था लि.",
  companySubtitle: "Services and Suppliers",
  companySubtitleNepali: "सर्भिसेज एण्ड सप्लायर्स",
  location: "Fikkal Bazaar, Ilam, Nepal",
  addressNepali: "सूर्योदय न.पा.-१०, फिक्कल बजार, इलाम",
  phone: "+977-27-540123",
  email: "reliabletechss.fikkal@gmail.com",
  panNumber: "609874512",
  estdYear: "2075",
  logoUrl: "",
  headerImageUrl: "",
  footerImageUrl: "",
  paymentQrSettings: {
    rbbAccountName: "RELIABLETECH SERVICES AND SUPPLIERS",
    rbbAccountNumber: "2030010004523001",
    rbbBranch: "Fikkal Branch, Suryodaya-10, Ilam",
    rbbQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=RBB-RELIABLETECH-2030010004523001",

    esewaAccountName: "RELIABLETECH (OFFICIAL)",
    esewaId: "9852680456",
    esewaQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ESEWA-9852680456-RELIABLETECH",

    sahakariName: "Suryodaya Multipurpose Cooperative Ltd.",
    sahakariAccountName: "RELIABLETECH SS PVT",
    sahakariAccountNumber: "001-045-88910",
    sahakariQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SAHAKARI-00104588910-SURYODAYA",

    instructions: "Scan the official QR code using mobile banking or digital wallet. Upload payment receipt screenshot during checkout or in order tracking for rapid 5-minute counter verification."
  },
  customerChatQuickReply: "Namaste! Thank you for messaging ReliableTech Support Desk (Fikkal Bazaar, Ilam • Direct Counter Connect). Our on-duty technical counter staff have received your message and will assist you immediately. For urgent dispatch or on-site queries, feel free to call our hotline at 9852680780."
};

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    expenseNo: "RTSS-EXP-0001",
    category: "Rent",
    title: "Office Space Rent - July 2026",
    amount: 15000,
    paymentMethod: "RBB",
    date: "2026-07-01",
    remarks: "Paid to landlord Mr. Poudel for Fikkal branch second floor.",
    status: "Approved",
    createdBy: "Admin",
    approvedBy: "Admin"
  },
  {
    id: "exp-2",
    expenseNo: "RTSS-EXP-0002",
    category: "Salary",
    title: "Staff Shyam Thapa - June Salary",
    amount: 18000,
    paymentMethod: "Esewa",
    date: "2026-06-30",
    remarks: "Monthly salary and internet allowance.",
    status: "Approved",
    createdBy: "Admin",
    approvedBy: "Admin"
  },
  {
    id: "exp-3",
    expenseNo: "RTSS-EXP-0003",
    category: "Office Supplies",
    title: "Soldering Station and Thermal Paste",
    amount: 4500,
    paymentMethod: "Cash",
    date: "2026-07-02",
    remarks: "Urgent purchase of Quick 936A soldering station and Arctic MX-6 paste.",
    status: "Pending Approval",
    createdBy: "Shyam - Staff"
  },
  {
    id: "exp-4",
    expenseNo: "RTSS-EXP-0004",
    category: "Shareholder Payout",
    title: "Shareholder Arpan Khadka - Q2 Dividend",
    amount: 50000,
    paymentMethod: "RBB",
    date: "2026-07-01",
    remarks: "Quarterly dividend distribution as approved by board.",
    status: "Pending Approval",
    createdBy: "Shyam - Staff"
  }
];

export const INITIAL_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: "sr-1",
    requestNo: "RTSS-SERV-0001",
    customerName: "Kanyam Tea Estate",
    customerAddress: "Kanyam, Ilam",
    customerContact: "9852620111",
    items: [
      {
        itemName: "Hikvision 16-Port PoE Switch",
        reason: "Port 5 to 12 not delivering power, network light flashing red",
        solution: "Replaced burnt capacitors on the internal power delivery circuit",
        price: 2500
      }
    ],
    status: "Completed",
    dateCreated: "2026-06-20"
  },
  {
    id: "sr-2",
    requestNo: "RTSS-SERV-0002",
    customerName: "Dinesh Baskota",
    customerAddress: "Fikkal Bazaar, Ilam",
    customerContact: "9842630412",
    items: [
      {
        itemName: "Asus Zenbook 14 Laptop",
        reason: "Extremely overheating, shut downs when compiling code",
        solution: "Deep cleaned dust from cooler fan, replaced original thermal pads with high performance graphene sheet",
        price: 1800
      },
      {
        itemName: "Crucial MX500 SSD Upgrade",
        reason: "Client requested upgrade from slow HDD to premium storage",
        solution: "Installed Crucial 500GB SSD, cloned system partition successfully",
        price: 5200
      }
    ],
    status: "On Process",
    dateCreated: "2026-07-01"
  }
];

export const INITIAL_SERVICES: BusinessService[] = [
  {
    id: "srv-1",
    name: "CCTV Security System Installation",
    category: "Security",
    priceRate: 3500,
    rateType: "Per Unit",
    description: "Installation, wiring, and network configuration of HD IP Cameras, including NVR/DVR setup for tea estates and retail stores.",
    status: "Active",
    dateAdded: "2026-01-10"
  },
  {
    id: "srv-2",
    name: "Fiber Optic & Office Networking Setup",
    category: "Networking",
    priceRate: 12000,
    rateType: "Flat",
    description: "End-to-end office networking, including CAT6 cabling, router configuration, access points placement, and local network sharing.",
    status: "Active",
    dateAdded: "2026-02-15"
  },
  {
    id: "srv-3",
    name: "Computer & Laptop Chip-Level Repair",
    category: "Hardware",
    priceRate: 1500,
    rateType: "Hourly",
    description: "Diagnostic and motherboard level repair, hardware upgrades (RAM, SSD), display replacement, and cooling system servicing.",
    status: "Active",
    dateAdded: "2026-03-05"
  },
  {
    id: "srv-4",
    name: "Tea Factory Automated Billing & POS Software",
    category: "Software",
    priceRate: 45000,
    rateType: "Flat",
    description: "Deploying our custom billing and weight-scale integration software for local tea packaging factories in Ilam.",
    status: "Active",
    dateAdded: "2026-04-12"
  },
  {
    id: "srv-5",
    name: "Monthly IT Support & Server Retainer",
    category: "Maintenance",
    priceRate: 15000,
    rateType: "Monthly",
    description: "Routine server backups, network health audits, printer server maintenance, and remote helpdesk support for business offices.",
    status: "Active",
    dateAdded: "2026-05-01"
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    name: "Mechi IT Wholesalers",
    contactPerson: "Dinesh Baskota",
    phone: "023-541298",
    email: "sales@mechiit.com.np",
    address: "Birtamode, Jhapa",
    productsSupplied: "Laptops, Desktops, SSDs, RAM, Power Supplies",
    status: "Active",
    creditBalance: 45000,
    rating: 5,
    panNumber: "601245892"
  },
  {
    id: "sup-2",
    name: "Sagarmatha Network Solutions",
    contactPerson: "Kiran Shrestha",
    phone: "01-4432109",
    email: "info@sagarmathanet.com",
    address: "New Road, Kathmandu",
    productsSupplied: "Fiber Cables, Routers, PoE Switches, Network Racks",
    status: "Active",
    creditBalance: 12500,
    rating: 4,
    panNumber: "302456789"
  },
  {
    id: "sup-3",
    name: "Pathibhara Electronic Traders",
    contactPerson: "Sunita Tamang",
    phone: "027-520443",
    email: "pathibharailam@gmail.com",
    address: "Ilam Bazaar, Ilam",
    productsSupplied: "CCTV Cameras, PVC Pipes, Coaxial Cables, Connectors",
    status: "Active",
    creditBalance: 0,
    rating: 5,
    panNumber: "605987123"
  },
  {
    id: "sup-4",
    name: "Eastern Software Distributors",
    contactPerson: "Rajan Adhikari",
    phone: "021-465712",
    email: "licensing@easternsoft.com",
    address: "Mahendra Chowk, Biratnagar",
    productsSupplied: "Operating Systems, Antivirus Licenses, POS hardware",
    status: "On Hold",
    creditBalance: 8200,
    rating: 3,
    panNumber: "305142895"
  }
];

export const INITIAL_TRANSACTIONS: SupplyTransaction[] = [
  {
    id: "tx-1",
    date: "2026-05-10",
    supplierId: "sup-3",
    itemsBought: "10x CP-Plus 2MP Dome Cameras, 2 Rolls Cat6 Wire",
    amountPaid: 32000,
    amountDue: 0,
    status: "Paid",
    remarks: "Direct cash payment on delivery for Ilam tea estate project."
  },
  {
    id: "tx-2",
    date: "2026-06-15",
    supplierId: "sup-1",
    itemsBought: "5x Dell Vostro Laptops, 10x Crucial 500GB SSDs",
    amountPaid: 150000,
    amountDue: 45000,
    status: "Partially Paid",
    remarks: "Balance to be cleared within 30 days of invoice."
  },
  {
    id: "tx-3",
    date: "2026-06-28",
    supplierId: "sup-2",
    itemsBought: "2x TP-Link 24-Port Gigabit Switches, 5 Rolls Cat5e cable",
    amountPaid: 0,
    amountDue: 12500,
    status: "Pending",
    remarks: "Awaiting installation completion at government school project."
  }
];

export const INITIAL_INVOICES: SalesInvoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "RTSS-INV-2082/83-001",
    date: "2026-06-10",
    customerName: "Kanyam Tea Estate",
    customerPhone: "+977-9852620111",
    customerAddress: "Kanyam, Ilam",
    items: [
      { serviceId: "srv-1", quantity: 8, unitPrice: 3500 }
    ],
    totalAmount: 28000,
    discountAmount: 1500,
    finalAmount: 26500,
    paidAmount: 26500,
    dueAmount: 0,
    status: "Paid",
    paymentMethod: "RBB",
    remarks: "Installed 8 Outdoor High-Res Bullet Cameras around the processing unit."
  },
  {
    id: "inv-2",
    invoiceNumber: "RTSS-INV-2082/83-002",
    date: "2026-06-18",
    customerName: "Fikkal Multipurpose Cooperative",
    customerPhone: "+977-27-540222",
    customerAddress: "Fikkal Bazaar, Ilam",
    items: [
      { serviceId: "srv-2", quantity: 1, unitPrice: 12000 }
    ],
    totalAmount: 12000,
    discountAmount: 0,
    finalAmount: 12000,
    paidAmount: 8000,
    dueAmount: 4000,
    status: "Partially Paid",
    paymentMethod: "Esewa",
    remarks: "Office network cabling done. Pending final payment after test run."
  },
  {
    id: "inv-3",
    invoiceNumber: "RTSS-INV-2082/83-003",
    date: "2026-06-25",
    customerName: "Ilam Orthopedic & General Hospital",
    customerPhone: "+977-27-520555",
    customerAddress: "Ilam Chautari, Ilam",
    items: [
      { serviceId: "srv-5", quantity: 2, unitPrice: 15000 }
    ],
    totalAmount: 30000,
    discountAmount: 2000,
    finalAmount: 28000,
    paidAmount: 28000,
    dueAmount: 0,
    status: "Paid",
    paymentMethod: "Sahakari",
    remarks: "IT support retainer fee for May and June 2026."
  },
  {
    id: "inv-4",
    invoiceNumber: "RTSS-INV-2082/83-004",
    date: "2026-06-29",
    customerName: "Pathibhara Tea Packaging Industry",
    customerPhone: "+977-9842630444",
    customerAddress: "Fikkal Chowk, Ilam",
    items: [
      { serviceId: "srv-4", quantity: 1, unitPrice: 45000 }
    ],
    totalAmount: 45000,
    discountAmount: 5000,
    finalAmount: 40000,
    paidAmount: 0,
    dueAmount: 40000,
    status: "Unpaid",
    paymentMethod: "Due",
    remarks: "Billing system set up completed. Client requested 15 days credit."
  }
];

export const INITIAL_INVENTORY_STOCK: InventoryItem[] = [
  {
    id: "inv-stock-1",
    name: "CP-Plus 2MP Dome Cameras",
    quantity: 12,
    costPrice: 2200,
    sellingPrice: 3500,
    supplierId: "sup-3",
    lastReceivedDate: "2026-05-10"
  },
  {
    id: "inv-stock-2",
    name: "Dell Vostro Laptops",
    quantity: 5,
    costPrice: 55000,
    sellingPrice: 65000,
    supplierId: "sup-1",
    lastReceivedDate: "2026-06-15"
  },
  {
    id: "inv-stock-3",
    name: "Crucial 500GB SSDs",
    quantity: 15,
    costPrice: 3800,
    sellingPrice: 5000,
    supplierId: "sup-1",
    lastReceivedDate: "2026-06-15"
  }
];

export const INITIAL_INVENTORY_REQUESTS: InventoryRequest[] = [
  {
    id: "inv-req-1",
    purchaseOrderId: "tx-2",
    date: "2026-06-15",
    supplierId: "sup-1",
    items: [
      { name: "Dell Vostro Laptops", quantity: 5, costPrice: 55000, sellingPrice: 65000 },
      { name: "Crucial 500GB SSDs", quantity: 15, costPrice: 3800, sellingPrice: 5000 }
    ],
    amountPaid: 150000,
    status: "Approved",
    remarks: "Automatic receipt entry verified"
  }
];

export const INITIAL_OFFICE_USE_REQUESTS: OfficeUseRequest[] = [
  {
    id: "off-req-1",
    requestNo: "REQ-OFF-2083-001",
    date: "2083-02-10",
    itemId: "st-1",
    itemName: "A4 Paper Rim (80 GSM)",
    quantity: 2,
    requestedBy: "Suman Sharma",
    department: "Administration",
    status: "Approved",
    totalCost: 1100,
    approvedBy: "Super Admin",
    approvalDate: "2083-02-10",
    remarks: "Printing monthly statements and meeting minutes"
  },
  {
    id: "off-req-2",
    requestNo: "REQ-OFF-2083-002",
    date: "2083-02-15",
    itemId: "st-2",
    itemName: "Ballpen Box (Blue)",
    quantity: 1,
    requestedBy: "Anil Karki",
    department: "Account & Finance",
    status: "Approved",
    totalCost: 250,
    approvedBy: "Super Admin",
    approvalDate: "2083-02-15",
    remarks: "Stationery refill for cash counter"
  },
  {
    id: "off-req-3",
    requestNo: "REQ-OFF-2083-003",
    date: "2083-02-20",
    itemId: "st-3",
    itemName: "Stapler Pins Heavy Duty",
    quantity: 3,
    requestedBy: "Rita Dahal",
    department: "Front Desk",
    status: "Pending",
    totalCost: 360,
    remarks: "Document filing supplies"
  }
];

export const INITIAL_SHAREHOLDERS: Shareholder[] = [
  {
    id: "sh-1",
    name: "Arpan Khadka",
    address: "Fikkal, Suryodaya-10, Ilam",
    citizenshipNumber: "1001-2070-04123",
    contactNumber: "9852620100",
    totalShareAmount: 250000,
    status: "Active",
    openingDetails: {
      openingAmount: 250000,
      openingDate: "2081-01-01",
      citizenshipNumber: "1001-2070-04123",
      address: "Fikkal, Suryodaya-10, Ilam",
      contact: "9852620100",
      paymentMethod: "RBB",
      referenceNo: "OP-SH-001",
      remarks: "Initial promoter share capital deposit",
      addedBy: "reliableadmin",
      addedAt: "2081-01-01"
    },
    transactions: []
  },
  {
    id: "sh-2",
    name: "Kiran Sharma",
    address: "Pashupatinagar, Ilam",
    citizenshipNumber: "1002-2072-08541",
    contactNumber: "9842630111",
    totalShareAmount: 150000,
    status: "Active",
    openingDetails: {
      openingAmount: 150000,
      openingDate: "2081-01-01",
      citizenshipNumber: "1002-2072-08541",
      address: "Pashupatinagar, Ilam",
      contact: "9842630111",
      paymentMethod: "Cash",
      referenceNo: "OP-SH-002",
      remarks: "Initial promoter share capital deposit",
      addedBy: "reliableadmin",
      addedAt: "2081-01-01"
    },
    transactions: []
  }
];

export const INITIAL_ECOMMERCE_PRODUCTS = [
  // 1. Category: Stationery
  {
    product_id: "RTSS-STN-001",
    product_name: "JK Copier A4 Paper (75 GSM, 500 Sheets Ream)",
    category: "Stationery" as const,
    cost_price_npr: 460,
    selling_price_npr: 580,
    discount_type: "Percentage" as const,
    discount_value: 5,
    stock_count: 120,
    image_url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80",
    description: "Premium multipurpose office paper for high-speed laser and inkjet printing, copying, and faxing.",
    brand: "JK Copier",
    is_active: true,
    featured: true,
    features: ["75 GSM High Brightness", "Jam Free Guarantee", "Acid-Free Archival Quality", "Ideal for Offices & Schools"],
    warranty: "Manufacturer Standard",
    date_added: "2081-01-10"
  },
  {
    product_id: "RTSS-STN-002",
    product_name: "Kangaro Heavy Duty Stapler HD-23S17 (200 Sheets)",
    category: "Stationery" as const,
    cost_price_npr: 1850,
    selling_price_npr: 2450,
    discount_type: "Fixed_Amount" as const,
    discount_value: 150,
    stock_count: 24,
    image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80",
    description: "Robust metal body heavy-duty binding stapler for commercial offices, schools, and cooperatives.",
    brand: "Kangaro",
    is_active: true,
    featured: false,
    features: ["All Metal Construction", "Adjustable Paper Guide", "Binds up to 200 sheets (23/17 pins)", "Anti-Skid Base"],
    warranty: "1 Year Replacement",
    date_added: "2081-01-15"
  },
  {
    product_id: "RTSS-STN-003",
    product_name: "Casio DR-120TM Heavy Duty 12-Digit Printing Calculator",
    category: "Stationery" as const,
    cost_price_npr: 5800,
    selling_price_npr: 7200,
    discount_type: "Percentage" as const,
    discount_value: 8,
    stock_count: 15,
    image_url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80",
    description: "Heavy-duty 2-color ribbon printing calculator designed for banking, cooperative audits, and retail stores.",
    brand: "Casio",
    is_active: true,
    featured: true,
    features: ["12 Digits Digitron Display", "3.5 lines/sec Printing Speed", "Tax & Exchange Functions", "Cost/Sell/Margin Mode"],
    warranty: "2 Years Official Warranty",
    date_added: "2081-02-01"
  },
  {
    product_id: "RTSS-STN-004",
    product_name: "Natraj Gel & Ballpoint Pen Executive Office Pack (50 Pcs)",
    category: "Stationery" as const,
    cost_price_npr: 450,
    selling_price_npr: 650,
    discount_type: "None" as const,
    discount_value: 0,
    stock_count: 85,
    image_url: "https://images.unsplash.com/photo-1585336261026-7f09d84e5659?w=600&auto=format&fit=crop&q=80",
    description: "Smooth gliding executive blue and black pen set for daily accounting entries and staff documentation.",
    brand: "Natraj",
    is_active: true,
    featured: false,
    features: ["0.7mm Fine Tip", "Waterproof Smudge-Free Ink", "Comfort Grip", "Pack of 50"],
    warranty: "N/A",
    date_added: "2081-02-12"
  },

  // 2. Category: Computer Parts
  {
    product_id: "RTSS-CMP-001",
    product_name: "Kingston NV2 1TB PCIe 4.0 NVMe M.2 SSD",
    category: "Computer Parts" as const,
    cost_price_npr: 8200,
    selling_price_npr: 10400,
    discount_type: "Fixed_Amount" as const,
    discount_value: 600,
    stock_count: 18,
    image_url: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80",
    description: "High-speed NVMe PCIe 4.0 storage solution delivering speeds up to 3,500MB/s for laptops and desktops.",
    brand: "Kingston",
    is_active: true,
    featured: true,
    features: ["Read Speeds up to 3,500MB/s", "Write Speeds up to 2,800MB/s", "Low Power Draw", "M.2 2280 Form Factor"],
    warranty: "3 Years Warranty",
    date_added: "2081-01-20"
  },
  {
    product_id: "RTSS-CMP-002",
    product_name: "Corsair Vengeance LPX 16GB (1x16GB) DDR4 3200MHz RAM",
    category: "Computer Parts" as const,
    cost_price_npr: 4800,
    selling_price_npr: 6200,
    discount_type: "Percentage" as const,
    discount_value: 5,
    stock_count: 22,
    image_url: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80",
    description: "Anodized aluminum heat spreader for faster heat dissipation and optimal performance in workstation PCs.",
    brand: "Corsair",
    is_active: true,
    featured: true,
    features: ["DDR4 3200MHz Speed", "Pure Aluminum Heatspreader", "XMP 2.0 Support", "Low Profile Design"],
    warranty: "5 Years Replacement",
    date_added: "2081-01-22"
  },
  {
    product_id: "RTSS-CMP-003",
    product_name: "Logitech MK270 Wireless Keyboard & Mouse Combo",
    category: "Computer Parts" as const,
    cost_price_npr: 3200,
    selling_price_npr: 4100,
    discount_type: "Fixed_Amount" as const,
    discount_value: 200,
    stock_count: 35,
    image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    description: "Reliable 2.4GHz wireless combo with 10m range, long battery life, and spill-resistant design.",
    brand: "Logitech",
    is_active: true,
    featured: false,
    features: ["Long Range 2.4GHz Wireless", "36-Month Keyboard Battery Life", "8 Dedicated Shortcut Keys", "Spill Resistant"],
    warranty: "1 Year Official Warranty",
    date_added: "2081-02-05"
  },
  {
    product_id: "RTSS-CMP-004",
    product_name: "Epson EcoTank L3210 All-in-One Color Ink Tank Printer",
    category: "Computer Parts" as const,
    cost_price_npr: 21500,
    selling_price_npr: 25500,
    discount_type: "Percentage" as const,
    discount_value: 6,
    stock_count: 8,
    image_url: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80",
    description: "Cost-effective, spill-free ink tank printer designed for office printing, scanning, and high-volume photocopying.",
    brand: "Epson",
    is_active: true,
    featured: true,
    features: ["Print, Scan, Copy", "Ultra-Low Cost per Page", "High Yield: 4,500 Black / 7,500 Color", "Borderless 4R Photo Print"],
    warranty: "1 Year / 30,000 Prints Warranty",
    date_added: "2081-02-10"
  },

  // 3. Category: CCTV & Security
  {
    product_id: "RTSS-CTV-001",
    product_name: "Hikvision 4-Channel 1080P Full HD CCTV Surveillance Kit (4 Cameras + DVR + 1TB)",
    category: "CCTV & Security" as const,
    cost_price_npr: 22000,
    selling_price_npr: 27900,
    discount_type: "Fixed_Amount" as const,
    discount_value: 1400,
    stock_count: 12,
    image_url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80",
    description: "Complete commercial & home CCTV security bundle with 2 Indoor Domes, 2 Outdoor Weatherproof Bullets, 4CH DVR & 1TB Surveillance HDD.",
    brand: "Hikvision",
    is_active: true,
    featured: true,
    features: ["1080P Full HD Clarity", "Smart IR Night Vision 20m", "Mobile App Remote View (Hik-Connect)", "IP66 Weatherproof Bullets"],
    warranty: "2 Years Warranty + RTSS Free Setup Support",
    date_added: "2081-01-05"
  },
  {
    product_id: "RTSS-CTV-002",
    product_name: "CP Plus 2MP Wi-Fi Smart PTZ Camera with 360° Pan-Tilt & Audio",
    category: "CCTV & Security" as const,
    cost_price_npr: 3600,
    selling_price_npr: 4800,
    discount_type: "Percentage" as const,
    discount_value: 10,
    stock_count: 30,
    image_url: "https://images.unsplash.com/photo-1580983218765-f663bec07b37?w=600&auto=format&fit=crop&q=80",
    description: "Standalone smart security camera with 360-degree motor rotation, motion tracking, two-way audio, and SD card slot.",
    brand: "CP Plus Ezykam",
    is_active: true,
    featured: true,
    features: ["360° Pan & 90° Tilt", "Two-Way Talk Mic & Speaker", "Smart Human Motion Tracking", "Supports up to 128GB MicroSD"],
    warranty: "1 Year Official Replacement",
    date_added: "2081-01-25"
  },
  {
    product_id: "RTSS-CTV-003",
    product_name: "Dahua 8-Channel PoE Network Video Recorder (NVR) 4K Ultra HD",
    category: "CCTV & Security" as const,
    cost_price_npr: 14500,
    selling_price_npr: 18200,
    discount_type: "Fixed_Amount" as const,
    discount_value: 1000,
    stock_count: 6,
    image_url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80",
    description: "Professional enterprise 8-channel PoE NVR supporting up to 8MP IP cameras with H.265+ smart video compression.",
    brand: "Dahua Technology",
    is_active: true,
    featured: false,
    features: ["8 Built-in PoE Ports", "Up to 8MP 4K Decoding", "Dual Stream Video Compression", "HDMI/VGA Simultaneous Output"],
    warranty: "2 Years Warranty",
    date_added: "2081-02-02"
  },
  {
    product_id: "RTSS-CTV-004",
    product_name: "Cat6 Pure Copper UTP High-Speed Network Cable Roll (305 Meters)",
    category: "CCTV & Security" as const,
    cost_price_npr: 7800,
    selling_price_npr: 9600,
    discount_type: "None" as const,
    discount_value: 0,
    stock_count: 14,
    image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    description: "Solid 23AWG pure copper 1000Mbps Ethernet cable roll for IP CCTV cameras, internet distribution, and LAN networks.",
    brand: "D-Link",
    is_active: true,
    featured: false,
    features: ["100% Solid Pure Bare Copper", "Gigabit 1000Mbps Speed", "Weather-Resistant PVC Sheath", "305m Drum Box"],
    warranty: "Factory Certified",
    date_added: "2081-02-08"
  }
];

export const INITIAL_CUSTOMER_ACCOUNTS: CustomerAccount[] = [
  {
    customer_id: "RTSS-CUST-001",
    name: "Dipak Adhikari",
    phone: "9842650123",
    alt_phone: "9804911223",
    email: "dipak.adhikari@gmail.com",
    password: "password123",
    account_category: "Individual / Household",
    municipality: "Suryodaya Municipality" as const,
    ward: "Ward 10",
    tole_area: "Fikkal Bazaar",
    landmark: "Near Old Buspark & Siddhartha Bank",
    detailed_address: "Fikkal Bazaar, Near Old Buspark, Suryodaya-10, Ilam",
    is_institutional: false,
    preferred_language: "ENG",
    createdAt: "2081-01-12",
    status: "Active" as const
  },
  {
    customer_id: "RTSS-CUST-002",
    name: "Suryodaya Tea Estate & Producers Ltd.",
    phone: "9852620888",
    alt_phone: "027-540123",
    email: "procurement@suryodayatea.com",
    password: "password123",
    account_category: "Tea Estate / Factory",
    municipality: "Suryodaya Municipality" as const,
    ward: "Ward 04",
    tole_area: "Kanyam",
    landmark: "Main Processing Factory Gate, Kanyam Tea Garden",
    detailed_address: "Kanyam, Suryodaya-04, Ilam (Main Processing Factory)",
    is_institutional: true,
    organization_name: "Suryodaya Tea Estate & Producers Ltd.",
    organization_pan: "302819405",
    contact_designation: "Factory Manager & Procurement Lead",
    preferred_language: "ENG",
    createdAt: "2081-01-18",
    status: "Active" as const
  },
  {
    customer_id: "RTSS-CUST-003",
    name: "Sarita Rai",
    phone: "9814321980",
    alt_phone: "9842699887",
    email: "sarita.rai@yahoo.com",
    password: "password123",
    account_category: "Commercial Business / Retail",
    municipality: "Rong Municipality" as const,
    ward: "Ward 03",
    tole_area: "Kolbung Highway Corridor",
    landmark: "Kolbung Highway Chowk, Opp. Rong Ward 3 Office",
    detailed_address: "Kolbong Chowk, Rong-03, Ilam",
    is_institutional: false,
    preferred_language: "NEP",
    createdAt: "2081-02-04",
    status: "Active" as const
  },
  {
    customer_id: "RTSS-CUST-004",
    name: "Ilam Community English School",
    phone: "9842611223",
    alt_phone: "027-520456",
    email: "administration@ilamschool.edu.np",
    password: "password123",
    account_category: "School / College / Campus",
    municipality: "Ilam Municipality" as const,
    ward: "Ward 07",
    tole_area: "Golakharka",
    landmark: "Near Ilam Tea Garden & Ward 7 Health Post",
    detailed_address: "Golakharka, Ilam Municipality-07, Ilam",
    is_institutional: true,
    organization_name: "Ilam Community English School",
    organization_pan: "601928374",
    contact_designation: "Principal / Administrator",
    preferred_language: "ENG",
    createdAt: "2081-02-10",
    status: "Active" as const
  }
];

export const INITIAL_ECOMMERCE_ORDERS = [
  {
    order_id: "RTSS-ORD-1001",
    user_id: "RTSS-CUST-001",
    customer_name: "Dipak Adhikari",
    customer_phone: "9842650123",
    customer_email: "dipak.adhikari@gmail.com",
    municipality: "Suryodaya Municipality" as const,
    ward: "Ward 10",
    delivery_address: "Fikkal Bazaar, Near Old Buspark, Suryodaya-10, Ilam",
    items: [
      {
        product_id: "RTSS-STN-001",
        product_name: "JK Copier A4 Paper (75 GSM, 500 Sheets Ream)",
        quantity: 3,
        unit_price_npr: 580,
        discount_amount_npr: 29,
        final_price_npr: 551,
        image_url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80",
        category: "Stationery" as const
      },
      {
        product_id: "RTSS-CMP-003",
        product_name: "Logitech MK270 Wireless Keyboard & Mouse Combo",
        quantity: 1,
        unit_price_npr: 4100,
        discount_amount_npr: 200,
        final_price_npr: 3900,
        image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
        category: "Computer Parts" as const
      }
    ],
    subtotal_npr: 5840,
    discount_npr: 287,
    delivery_charge_npr: 0,
    total_amount_npr: 5553,
    payment_method: "COD" as const,
    order_state: "Processing/Packing" as const,
    order_notes: "Please deliver in the afternoon around 2 PM to Fikkal shop.",
    created_at: "2081-02-14",
    assigned_courier: "RTSS Express Rider - Bibek"
  },
  {
    order_id: "RTSS-ORD-1002",
    user_id: "RTSS-CUST-002",
    customer_name: "Suryodaya Tea Estate & Producers Ltd.",
    customer_phone: "9852620888",
    customer_email: "procurement@suryodayatea.com",
    municipality: "Suryodaya Municipality" as const,
    ward: "Ward 04",
    delivery_address: "Kanyam, Suryodaya-04, Ilam (Main Processing Factory)",
    items: [
      {
        product_id: "RTSS-CTV-001",
        product_name: "Hikvision 4-Channel 1080P Full HD CCTV Surveillance Kit",
        quantity: 1,
        unit_price_npr: 27900,
        discount_amount_npr: 1400,
        final_price_npr: 26500,
        image_url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80",
        category: "CCTV & Security" as const
      }
    ],
    subtotal_npr: 27900,
    discount_npr: 1400,
    delivery_charge_npr: 0,
    total_amount_npr: 26500,
    payment_method: "INSTITUTIONAL_CREDIT" as const,
    order_state: "Pending Verification" as const,
    organization_name: "Suryodaya Tea Estate & Producers Ltd.",
    organization_pan: "302819405",
    purchase_order_document_url: "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=80",
    order_notes: "Purchase Order #STE-PO-2081-44 attached. Payment via 30-day corporate credit term.",
    created_at: "2081-02-15"
  },
  {
    order_id: "RTSS-ORD-1003",
    user_id: "RTSS-CUST-003",
    customer_name: "Sarita Rai",
    customer_phone: "9814321980",
    customer_email: "sarita.rai@yahoo.com",
    municipality: "Rong Municipality" as const,
    ward: "Ward 03",
    delivery_address: "Kolbong Chowk, Rong-03, Ilam",
    items: [
      {
        product_id: "RTSS-CTV-002",
        product_name: "CP Plus 2MP Wi-Fi Smart PTZ Camera",
        quantity: 1,
        unit_price_npr: 4800,
        discount_amount_npr: 480,
        final_price_npr: 4320,
        image_url: "https://images.unsplash.com/photo-1580983218765-f663bec07b37?w=600&auto=format&fit=crop&q=80",
        category: "CCTV & Security" as const
      }
    ],
    subtotal_npr: 4800,
    discount_npr: 480,
    delivery_charge_npr: 100,
    total_amount_npr: 4420,
    payment_method: "ESEWA" as const,
    order_state: "Processing/Packing" as const,
    gateway_ref_token: "ESW-TXN-8849201948",
    order_notes: "Paid via eSewa mobile app. Please verify transaction ID.",
    created_at: "2081-02-16",
    verified_by: "reliableadmin"
  }
];

export const INITIAL_SERVICE_TICKETS = [
  {
    ticket_id: "RTSS-SRV-2001",
    customer_id: "RTSS-CUST-001",
    customer_name: "Dipak Adhikari",
    customer_phone: "9842650123",
    customer_address: "Fikkal-10, Ilam",
    hardware_type: "PC" as const,
    service_type: "Fikkal Shop Drop-off" as const,
    target_municipality: "Suryodaya Municipality" as const,
    problem_description: "Desktop PC power supply issue & Windows 11 boot loop error with SSD upgrade request.",
    assigned_technician: "Arpan Khadka",
    ticket_status: "In-Progress" as const,
    estimated_cost_npr: 3500,
    actual_cost_npr: 3500,
    technician_notes: "Power supply tested OK. Upgrading OS to genuine Windows 11 and installing Kingston NVMe SSD.",
    created_at: "2081-02-10",
    preferred_date: "2081-02-11"
  },
  {
    ticket_id: "RTSS-SRV-2002",
    customer_id: "RTSS-CUST-002",
    customer_name: "Suryodaya Tea Estate",
    customer_phone: "9852620888",
    customer_address: "Kanyam, Suryodaya-04, Ilam",
    hardware_type: "CCTV System" as const,
    service_type: "Technician Home Visit" as const,
    target_municipality: "Suryodaya Municipality" as const,
    problem_description: "Annual maintenance for 16-channel factory CCTV cameras, rewiring Cat6 cables, and mobile remote app sync.",
    assigned_technician: "Kiran Sharma",
    ticket_status: "Site-Survey Scheduled" as const,
    estimated_cost_npr: 8500,
    technician_notes: "Site survey scheduled for Tuesday morning at 10 AM with Kanyam factory supervisor.",
    created_at: "2081-02-14",
    preferred_date: "2081-02-17"
  },
  {
    ticket_id: "RTSS-SRV-2003",
    customer_id: "RTSS-CUST-004",
    customer_name: "Ilam Community English School",
    customer_phone: "9842611223",
    customer_address: "Golakharka, Ilam-07",
    hardware_type: "Printer" as const,
    service_type: "Fikkal Shop Drop-off" as const,
    target_municipality: "Ilam Municipality" as const,
    problem_description: "Epson EcoTank L3110 paper feed roller jammed and print head nozzle cleaning required.",
    assigned_technician: "Arpan Khadka",
    ticket_status: "Completed - Awaiting Invoice Payment" as const,
    estimated_cost_npr: 1800,
    actual_cost_npr: 1800,
    technician_notes: "Roller cleaned, ink pads reset, test print passes with 100% nozzle alignment.",
    created_at: "2081-02-12"
  }
];

export const INITIAL_HARDWARE_TYPES = [
  { 
    id: 'hw-pc', 
    name: 'Desktop PC / Computer System', 
    nameNepali: 'डेस्कटप कम्प्युटर / पीसी', 
    categoryHint: 'Hardware Assembly, SSD/RAM Upgrade, OS Installation', 
    estimatedTurnaround: '24-48 Hours', 
    isActive: true 
  },
  { 
    id: 'hw-laptop', 
    name: 'Laptop / Notebook', 
    nameNepali: 'ल्यापटप / नोटबुक', 
    categoryHint: 'Display Screen, Keyboard, Battery, Motherboard Chip-Level', 
    estimatedTurnaround: '24-48 Hours', 
    isActive: true 
  },
  { 
    id: 'hw-cctv', 
    name: 'CCTV Camera / DVR / NVR Setup', 
    nameNepali: 'सीसीटीभी क्यामेरा, डीभीआर र एनभीआर', 
    categoryHint: 'Hikvision/CP Plus Surveillance, Mobile Sync, Remote View', 
    estimatedTurnaround: 'Same Day / On-site Visit', 
    isActive: true 
  },
  { 
    id: 'hw-printer', 
    name: 'Printer / Photocopier / Scanner', 
    nameNepali: 'प्रिन्टर / फोटोकपी / स्क्यानर', 
    categoryHint: 'Epson/Canon Ink Tank, HP Laserjet, Roller & Head Service', 
    estimatedTurnaround: 'Same Day / 24 Hours', 
    isActive: true 
  },
  { 
    id: 'hw-network', 
    name: 'Networking / Wi-Fi Router / Fiber Setup', 
    nameNepali: 'राउटर / नेटवर्किङ / अप्टिकल फाइबर', 
    categoryHint: 'Office LAN, Cat6 Cabling, Router & Network Switch Setup', 
    estimatedTurnaround: 'Same Day On-site', 
    isActive: true 
  },
  { 
    id: 'hw-biometric', 
    name: 'Biometric Attendance Device (Fingerprint/Facial)', 
    nameNepali: 'डिजिटल हाजिरी मेसिन (बायोमेट्रिक)', 
    categoryHint: 'ZKTeco/Realtime Attendance, Cloud Sync, Shift Config', 
    estimatedTurnaround: '24 Hours', 
    isActive: true 
  },
  { 
    id: 'hw-power', 
    name: 'Solar Inverter / Online UPS / Battery Backup', 
    nameNepali: 'सोलार इन्भर्टर / अनलाइन युपिएस / ब्याट्री', 
    categoryHint: 'Luminous/Microtek Inverter, Heavy Battery Testing', 
    estimatedTurnaround: '24-48 Hours', 
    isActive: true 
  },
  { 
    id: 'hw-audio', 
    name: 'Sound System / School PA & Microphone System', 
    nameNepali: 'साउन्ड सिस्टम / विद्यालय माइक तथा एम्पलीफायर', 
    categoryHint: 'Ahuja/Stranger Amplifier, Horns, Wireless Microphones', 
    estimatedTurnaround: '48 Hours', 
    isActive: true 
  },
  { 
    id: 'hw-cash', 
    name: 'Note Counting Machine / Fake Note Detector', 
    nameNepali: 'पैसा गन्ने मेसिन / नक्कली नोट डिटेक्टर', 
    categoryHint: 'Cooperative, Bank & Cash Counter Note Counting Machine', 
    estimatedTurnaround: '24 Hours', 
    isActive: true 
  }
];

export const INITIAL_CUSTOMER_INQUIRIES: CustomerInquiryMessage[] = [
  {
    id: 'INQ-1001',
    customerId: 'CUST-002',
    customerName: 'Shree Saraswati Secondary School',
    customerPhone: '9842601199',
    customerEmail: 'saraswati.school.fikkal@gmail.com',
    subject: 'Bulk A4 Paper & Ink Cartridge Order Quotation',
    initialMessage: 'Namaste ReliableTech team, We need 20 cartons of JK Copier Paper and 6 bottles of Epson 003 Ink. Can you deliver to Suryodaya Ward-4 today?',
    timestamp: '2026-08-20 10:15 AM',
    status: 'Replied',
    replies: [
      {
        id: 'rep-1',
        sender: 'Customer',
        senderName: 'Shree Saraswati Secondary School',
        message: 'Namaste ReliableTech team, We need 20 cartons of JK Copier Paper and 6 bottles of Epson 003 Ink. Can you deliver to Suryodaya Ward-4 today?',
        timestamp: '2026-08-20 10:15 AM'
      },
      {
        id: 'rep-2',
        sender: 'Staff',
        senderName: 'Shyam Thapa (Staff)',
        senderRole: 'Staff',
        message: 'Namaste! Yes, we have ready stock at our Fikkal store. Our dispatch vehicle will deliver it to your school by 2:00 PM today.',
        timestamp: '2026-08-20 10:30 AM'
      }
    ]
  },
  {
    id: 'INQ-1002',
    customerId: 'CUST-001',
    customerName: 'Kanyam Organic Tea Estate',
    customerPhone: '9852620111',
    customerEmail: 'kanyam.tea@gmail.com',
    subject: 'Hikvision 8CH NVR & IP Camera Quotation for Factory Premises',
    initialMessage: 'We require a customized surveillance proposal for our factory floor with 8 IP Cameras and cat6 cabling. Requesting technical quotation.',
    timestamp: '2026-08-22 03:40 PM',
    status: 'Forwarded to Admin',
    priority: 'Escalated to Admin',
    forwardedToAdminAt: '2026-08-22 04:00 PM',
    forwardedBy: 'Shyam Thapa (Staff)',
    adminNotes: 'High-value institutional client. Managing director requested technical site survey and custom proposal.',
    replies: [
      {
        id: 'rep-101',
        sender: 'Customer',
        senderName: 'Kanyam Organic Tea Estate',
        message: 'We require a customized surveillance proposal for our factory floor with 8 IP Cameras and cat6 cabling. Requesting technical quotation.',
        timestamp: '2026-08-22 03:40 PM'
      },
      {
        id: 'rep-102',
        sender: 'Staff',
        senderName: 'Shyam Thapa (Staff)',
        senderRole: 'Staff',
        message: 'Thank you for contacting ReliableTech! I have forwarded your corporate inquiry directly to our Administrative Director for specialized institutional pricing and site inspection.',
        timestamp: '2026-08-22 04:00 PM'
      }
    ]
  }
];

