import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'rtssdatabase.db');

let dbInstance: Database | null = null;
let SQL: any = null;

// Check if database file exists and is queryable (creates rtssdatabase.db if needed)
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const db = await getSQLiteDatabase();
    const stmt = db.prepare("SELECT 1");
    let ok = false;
    if (stmt.step()) {
      ok = true;
    }
    stmt.free();
    return ok;
  } catch (err) {
    console.error("[SQLite] Check connection failed:", err);
    return false;
  }
}

// Initialize SQLite engine & database file
export async function getSQLiteDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log(`[SQLite] Loaded existing database file: ${DB_FILE_PATH}`);
    } catch (err) {
      console.error(`[SQLite] Error reading ${DB_FILE_PATH}, creating fresh database instance:`, err);
      dbInstance = new SQL.Database();
    }
  } else {
    console.log(`[SQLite] Creating new single-file SQLite database: ${DB_FILE_PATH}`);
    dbInstance = new SQL.Database();
  }

  initRelationalSchema(dbInstance);
  saveDatabaseToDisk(dbInstance);
  return dbInstance;
}

// Ensure all relational tables exist in rtssdatabase.db
function initRelationalSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT,
      companyNameNepali TEXT,
      location TEXT,
      addressNepali TEXT,
      phone TEXT,
      email TEXT,
      panNumber TEXT,
      logoUrl TEXT,
      estdYear TEXT
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      description TEXT,
      priceRate REAL,
      rateType TEXT,
      status TEXT,
      dateAdded TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT,
      contactPerson TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      rating INTEGER,
      productsSupplied TEXT,
      status TEXT,
      creditBalance REAL
    );

    CREATE TABLE IF NOT EXISTS supplier_payments (
      id TEXT PRIMARY KEY,
      supplierId TEXT,
      date TEXT,
      amountPaid REAL,
      paymentMethod TEXT,
      remarks TEXT,
      receiptUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS supply_transactions (
      id TEXT PRIMARY KEY,
      supplierId TEXT,
      date TEXT,
      itemsBought TEXT,
      amountPaid REAL,
      amountDue REAL,
      totalAmount REAL,
      status TEXT,
      invoiceNo TEXT
    );

    CREATE TABLE IF NOT EXISTS sales_invoices (
      id TEXT PRIMARY KEY,
      invoiceNo TEXT,
      customerName TEXT,
      customerPhone TEXT,
      customerEmail TEXT,
      customerAddress TEXT,
      date TEXT,
      items TEXT,
      totalAmount REAL,
      discount REAL,
      grandTotal REAL,
      amountPaid REAL,
      amountDue REAL,
      paymentMethod TEXT,
      createdBy TEXT
    );

    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      name TEXT,
      nameNepali TEXT,
      role TEXT,
      password TEXT,
      post TEXT,
      designationNepali TEXT,
      address TEXT,
      contactNumber TEXT,
      citizenshipNumber TEXT,
      issueDate TEXT,
      issueDistrictAndOffice TEXT,
      monthlySalary REAL
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS edit_requests (
      id TEXT PRIMARY KEY,
      requestType TEXT,
      recordId TEXT,
      recordType TEXT,
      requestedBy TEXT,
      dateRequested TEXT,
      reason TEXT,
      status TEXT,
      dataPayload TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_stock (
      id TEXT PRIMARY KEY,
      itemCode TEXT,
      itemName TEXT,
      category TEXT,
      unit TEXT,
      quantity REAL,
      minStockThreshold REAL,
      unitPrice REAL,
      sellingPrice REAL,
      supplierId TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_requests (
      id TEXT PRIMARY KEY,
      requestNo TEXT,
      date TEXT,
      itemCode TEXT,
      itemName TEXT,
      quantity REAL,
      requestedBy TEXT,
      department TEXT,
      status TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS service_requests (
      id TEXT PRIMARY KEY,
      requestNo TEXT,
      customerName TEXT,
      customerPhone TEXT,
      serviceType TEXT,
      description TEXT,
      status TEXT,
      priority TEXT,
      dateCreated TEXT,
      assignedTo TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      expenseNo TEXT,
      category TEXT,
      description TEXT,
      amount REAL,
      paymentMethod TEXT,
      date TEXT,
      recordedBy TEXT,
      referenceId TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_closings (
      id TEXT PRIMARY KEY,
      closingDate TEXT,
      totalSales REAL,
      cashReceived REAL,
      esewaReceived REAL,
      bankReceived REAL,
      sahakariReceived REAL,
      totalExpenses REAL,
      closingBalance REAL,
      remarks TEXT,
      status TEXT,
      verifiedBy TEXT
    );

    CREATE TABLE IF NOT EXISTS periodic_closings (
      id TEXT PRIMARY KEY,
      periodType TEXT,
      startDate TEXT,
      endDate TEXT,
      totalRevenue REAL,
      totalExpenses REAL,
      netProfit REAL,
      meetingNumber TEXT,
      meetingDate TEXT,
      decisionNumber TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS official_letters (
      id TEXT PRIMARY KEY,
      letterNo TEXT,
      subject TEXT,
      recipient TEXT,
      date TEXT,
      content TEXT,
      category TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      staffId TEXT,
      date TEXT,
      checkInTime TEXT,
      checkOutTime TEXT,
      status TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      staffId TEXT,
      leaveType TEXT,
      startDate TEXT,
      endDate TEXT,
      reason TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS email_dispatch_logs (
      id TEXT PRIMARY KEY,
      timestamp INTEGER,
      dateFormatted TEXT,
      sender TEXT,
      recipientEmail TEXT,
      recipientName TEXT,
      emailType TEXT,
      subject TEXT,
      success INTEGER,
      error TEXT,
      messageId TEXT
    );

    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      threadId TEXT,
      account TEXT,
      sender TEXT,
      senderEmail TEXT,
      senderName TEXT,
      recipientEmail TEXT,
      recipientName TEXT,
      cc TEXT,
      bcc TEXT,
      subject TEXT,
      body TEXT,
      htmlContent TEXT,
      folder TEXT,
      emailType TEXT,
      timestamp INTEGER,
      dateFormatted TEXT,
      bsDate TEXT,
      isRead INTEGER DEFAULT 1,
      isStarred INTEGER DEFAULT 0,
      hasAttachments INTEGER DEFAULT 0,
      fileAttachmentsJson TEXT,
      systemReportsJson TEXT,
      success INTEGER DEFAULT 1,
      error TEXT,
      messageId TEXT
    );

    CREATE TABLE IF NOT EXISTS salary_distributions (
      id TEXT PRIMARY KEY,
      staffId TEXT,
      month TEXT,
      baseSalary REAL,
      bonus REAL,
      deductions REAL,
      netSalary REAL,
      paymentDate TEXT,
      paymentMethod TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance_requests (
      id TEXT PRIMARY KEY,
      staffId TEXT,
      date TEXT,
      requestType TEXT,
      reason TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS opening_balances (
      account TEXT PRIMARY KEY,
      openingBalance REAL,
      openingBalanceDate TEXT,
      openingBalanceProof TEXT
    );

    CREATE TABLE IF NOT EXISTS account_transfers (
      id TEXT PRIMARY KEY,
      date TEXT,
      fromAccount TEXT,
      toAccount TEXT,
      amount REAL,
      remarks TEXT,
      transferNo TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      assetName TEXT,
      category TEXT,
      purchaseDate TEXT,
      purchasePrice REAL,
      currentStatus TEXT,
      location TEXT
    );

    CREATE TABLE IF NOT EXISTS meeting_notes (
      id TEXT PRIMARY KEY,
      meetingDate TEXT,
      meetingNumber TEXT,
      typeOfMeeting TEXT,
      presentMembers TEXT,
      agendas TEXT,
      status TEXT,
      submittedBy TEXT,
      approvedByAdmins TEXT,
      totalAdminsAtSubmission INTEGER
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      admin_password_hash TEXT DEFAULT 'admin123'
    );

    INSERT OR IGNORE INTO admin_settings (id, admin_password_hash) VALUES (1, 'admin123');

    CREATE TABLE IF NOT EXISTS user_daily_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      entry_content TEXT NOT NULL,
      date_submitted TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS office_use_requests (
      id TEXT PRIMARY KEY,
      requestNo TEXT,
      date TEXT,
      itemId TEXT,
      itemName TEXT,
      quantity REAL,
      requestedBy TEXT,
      department TEXT,
      status TEXT,
      totalCost REAL,
      approvedBy TEXT,
      approvalDate TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_requests (
      id TEXT PRIMARY KEY,
      requestNo TEXT,
      date TEXT,
      itemId TEXT,
      itemName TEXT,
      quantity REAL,
      requestedBy TEXT,
      department TEXT,
      status TEXT,
      totalCost REAL,
      approvedBy TEXT,
      approvalDate TEXT,
      remarks TEXT
    );
  `);

  try {
    db.run("ALTER TABLE sales_invoices ADD COLUMN customerEmail TEXT;");
  } catch (e) {}

  try {
    seedInitialEmailsIfEmpty(db);
  } catch (err) {
    console.error('[SQLite] Error seeding initial emails:', err);
  }
}

// Data Sanitation & Safe Type Converter Helpers for SQLite Parameter Binding
function toStr(val: any): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function toNum(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function toInt(val: any): number {
  return Math.round(toNum(val));
}

function toJson(val: any): string {
  if (val === undefined || val === null) return '[]';
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch (e) {
    return '[]';
  }
}

function toBoolInt(val: any): number {
  if (val === true || val === 1 || val === '1' || val === 'true' || val === 'on') return 1;
  return 0;
}

// Flush SQLite database to disk instantly without delay
export function saveDatabaseToDisk(db: Database) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error(`[SQLite] Error saving ${DB_FILE_PATH} to disk:`, err);
    throw err;
  }
}

// Load full database object from SQLite
export async function loadFullDatabaseFromSQLite(): Promise<any> {
  const db = await getSQLiteDatabase();

  // Try to load master KV object
  let fullData: any = {};
  try {
    const stmt = db.prepare(`SELECT value FROM kv_store WHERE key = 'master_data'`);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.value) {
        fullData = JSON.parse(row.value as string);
      }
    }
    stmt.free();
  } catch (e) {
    console.error('[SQLite] Error reading master_data from kv_store:', e);
  }

  // Fallback: If master_data was empty or missing key collections, reconstruct from relational tables
  if (!fullData || Object.keys(fullData).length === 0 || !fullData.profile) {
    try {
      const reconstructed: any = { ...fullData };

      // Profile
      try {
        const stmtP = db.prepare(`SELECT * FROM profile WHERE id = 1`);
        if (stmtP.step()) {
          reconstructed.profile = stmtP.getAsObject();
        }
        stmtP.free();
      } catch (e) {}

      // Services
      try {
        const stmtS = db.prepare(`SELECT * FROM services`);
        const servicesList = [];
        while (stmtS.step()) {
          servicesList.push(stmtS.getAsObject());
        }
        stmtS.free();
        if (servicesList.length > 0) reconstructed.services = servicesList;
      } catch (e) {}

      // Suppliers
      try {
        const stmtSup = db.prepare(`SELECT * FROM suppliers`);
        const suppliersList = [];
        while (stmtSup.step()) {
          const row: any = stmtSup.getAsObject();
          if (row.productsSupplied && typeof row.productsSupplied === 'string') {
            try { row.productsSupplied = JSON.parse(row.productsSupplied); } catch {}
          }
          suppliersList.push(row);
        }
        stmtSup.free();
        if (suppliersList.length > 0) reconstructed.suppliers = suppliersList;
      } catch (e) {}

      // Supplier Payments
      try {
        const stmtSp = db.prepare(`SELECT * FROM supplier_payments`);
        const spList = [];
        while (stmtSp.step()) {
          spList.push(stmtSp.getAsObject());
        }
        stmtSp.free();
        if (spList.length > 0) reconstructed.supplierPayments = spList;
      } catch (e) {}

      // Invoices
      try {
        const stmtInv = db.prepare(`SELECT * FROM sales_invoices`);
        const invList = [];
        while (stmtInv.step()) {
          const row: any = stmtInv.getAsObject();
          if (row.items && typeof row.items === 'string') {
            try { row.items = JSON.parse(row.items); } catch {}
          }
          if (row.invoiceNo && !row.invoiceNumber) row.invoiceNumber = row.invoiceNo;
          if (!row.customerEmail) row.customerEmail = '';
          if (row.finalAmount === undefined && row.grandTotal !== undefined) row.finalAmount = row.grandTotal;
          if (row.paidAmount === undefined && row.amountPaid !== undefined) row.paidAmount = row.amountPaid;
          if (row.dueAmount === undefined && row.amountDue !== undefined) row.dueAmount = row.amountDue;
          invList.push(row);
        }
        stmtInv.free();
        if (invList.length > 0) reconstructed.invoices = invList;
      } catch (e) {}

      // Supply Transactions
      try {
        const stmtTx = db.prepare(`SELECT * FROM supply_transactions`);
        const txList = [];
        while (stmtTx.step()) {
          const row: any = stmtTx.getAsObject();
          if (row.itemsBought && typeof row.itemsBought === 'string') {
            try { row.itemsBought = JSON.parse(row.itemsBought); } catch {}
          }
          txList.push(row);
        }
        stmtTx.free();
        if (txList.length > 0) reconstructed.transactions = txList;
      } catch (e) {}

      // Users
      try {
        const stmtU = db.prepare(`SELECT * FROM app_users`);
        const uList = [];
        while (stmtU.step()) {
          uList.push(stmtU.getAsObject());
        }
        stmtU.free();
        if (uList.length > 0) reconstructed.users = uList;
      } catch (e) {}

      // Units
      try {
        const stmtUn = db.prepare(`SELECT name FROM units`);
        const unList: string[] = [];
        while (stmtUn.step()) {
          const row: any = stmtUn.getAsObject();
          if (row.name) unList.push(row.name);
        }
        stmtUn.free();
        if (unList.length > 0) reconstructed.units = unList;
      } catch (e) {}

      // Expenses
      try {
        const stmtExp = db.prepare(`SELECT * FROM expenses`);
        const expList = [];
        while (stmtExp.step()) {
          expList.push(stmtExp.getAsObject());
        }
        stmtExp.free();
        if (expList.length > 0) reconstructed.expenses = expList;
      } catch (e) {}

      // Daily Closings
      try {
        const stmtDc = db.prepare(`SELECT * FROM daily_closings`);
        const dcList = [];
        while (stmtDc.step()) {
          dcList.push(stmtDc.getAsObject());
        }
        stmtDc.free();
        if (dcList.length > 0) reconstructed.dailyClosings = dcList;
      } catch (e) {}

      // Inventory Stock
      try {
        const stmtStk = db.prepare(`SELECT * FROM inventory_stock`);
        const stkList = [];
        while (stmtStk.step()) {
          stkList.push(stmtStk.getAsObject());
        }
        stmtStk.free();
        if (stkList.length > 0) reconstructed.inventoryStock = stkList;
      } catch (e) {}

      if (Object.keys(reconstructed).length > 0) {
        fullData = reconstructed;
        // Sync master_data in kv_store for subsequent lightning queries
        try {
          const stmtSave = db.prepare(`INSERT OR REPLACE INTO kv_store (key, value) VALUES ('master_data', ?)`);
          stmtSave.run([toStr(JSON.stringify(fullData))]);
          stmtSave.free();
        } catch (e) {}
      }
    } catch (fallbackErr) {
      console.warn('[SQLite] Fallback table reconstruction notice:', fallbackErr);
    }
  }

  return fullData;
}

// Upload and mount raw file buffer (.db or .json) directly to SQLite
export async function uploadDatabaseBuffer(fileBuffer: Buffer): Promise<any> {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  // 1. Check if buffer is JSON text
  try {
    const str = fileBuffer.toString('utf8');
    if (str.trim().startsWith('{') || str.trim().startsWith('[')) {
      const parsedJson = JSON.parse(str);
      if (parsedJson && typeof parsedJson === 'object') {
        await saveFullDatabaseToSQLite(parsedJson);
        return await loadFullDatabaseFromSQLite();
      }
    }
  } catch (e) {
    // Not JSON, proceeding as binary SQLite DB
  }

  // 2. Treat as binary SQLite database file
  try {
    const uint8 = new Uint8Array(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
    const newDb = new SQL.Database(uint8);
    // Sanity validation: run simple SQLite pragma to verify integrity
    newDb.run("PRAGMA schema_version;");
    
    // Save physical file directly to rtssdatabase.db on disk
    fs.writeFileSync(DB_FILE_PATH, Buffer.from(uint8));

    dbInstance = newDb;
    try {
      initRelationalSchema(dbInstance);
    } catch (schemaErr) {
      console.warn("[SQLite] Schema initialization notice on uploaded DB:", schemaErr);
    }
    saveDatabaseToDisk(dbInstance);

    return await loadFullDatabaseFromSQLite();
  } catch (dbErr: any) {
    console.error("[SQLite] Error mounting binary SQLite buffer:", dbErr);
    throw new Error(`The uploaded file is not a valid SQLite database (rtssdatabase.db) or JSON backup: ${dbErr.message || 'Corrupted file'}`);
  }
}

export async function saveFullDatabaseToSQLite(data: any): Promise<void> {
  const db = await getSQLiteDatabase();

  // 1. Update Master KV Store
  const jsonString = JSON.stringify(data);
  const stmtKv = db.prepare(`INSERT OR REPLACE INTO kv_store (key, value) VALUES ('master_data', ?)`);
  stmtKv.run([toStr(jsonString)]);
  stmtKv.free();

  // 2. Sync Relational Tables
  try {
    if (data.profile) {
      const p = data.profile;
      const stmtProfile = db.prepare(`
        INSERT OR REPLACE INTO profile (id, name, companyNameNepali, location, addressNepali, phone, email, panNumber, logoUrl, estdYear)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmtProfile.run([
        toStr(p.name),
        toStr(p.companyNameNepali),
        toStr(p.location),
        toStr(p.addressNepali),
        toStr(p.phone),
        toStr(p.email),
        toStr(p.panNumber),
        toStr(p.logoUrl),
        toStr(p.estdYear)
      ]);
      stmtProfile.free();
    }

    if (Array.isArray(data.services)) {
      db.run(`DELETE FROM services`);
      const stmt = db.prepare(`
        INSERT INTO services (id, name, category, description, priceRate, rateType, status, dateAdded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const s of data.services) {
        if (!s) continue;
        stmt.run([
          toStr(s.id),
          toStr(s.name),
          toStr(s.category),
          toStr(s.description),
          toNum(s.priceRate),
          toStr(s.rateType),
          toStr(s.status),
          toStr(s.dateAdded)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.suppliers)) {
      db.run(`DELETE FROM suppliers`);
      const stmt = db.prepare(`
        INSERT INTO suppliers (id, name, contactPerson, phone, email, address, rating, productsSupplied, status, creditBalance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const s of data.suppliers) {
        if (!s) continue;
        stmt.run([
          toStr(s.id),
          toStr(s.name),
          toStr(s.contactPerson),
          toStr(s.phone),
          toStr(s.email),
          toStr(s.address),
          toNum(s.rating),
          toStr(s.productsSupplied),
          toStr(s.status),
          toNum(s.creditBalance)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.users)) {
      db.run(`DELETE FROM app_users`);
      const stmt = db.prepare(`
        INSERT INTO app_users (id, username, name, nameNepali, role, password, post, designationNepali, address, contactNumber, citizenshipNumber, issueDate, issueDistrictAndOffice, monthlySalary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of data.users) {
        if (!u) continue;
        stmt.run([
          toStr(u.id),
          toStr(u.username),
          toStr(u.name),
          toStr(u.nameNepali),
          toStr(u.role),
          toStr(u.password),
          toStr(u.post),
          toStr(u.designationNepali),
          toStr(u.address),
          toStr(u.contactNumber),
          toStr(u.citizenshipNumber),
          toStr(u.issueDate),
          toStr(u.issueDistrictAndOffice),
          toNum(u.monthlySalary)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.units)) {
      db.run(`DELETE FROM units`);
      const stmt = db.prepare(`INSERT INTO units (name) VALUES (?)`);
      for (const u of data.units) {
        stmt.run([toStr(u)]);
      }
      stmt.free();
    }

    if (Array.isArray(data.inventoryStock)) {
      db.run(`DELETE FROM inventory_stock`);
      const stmt = db.prepare(`
        INSERT INTO inventory_stock (id, itemCode, itemName, category, unit, quantity, minStockThreshold, unitPrice, sellingPrice, supplierId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const i of data.inventoryStock) {
        if (!i) continue;
        stmt.run([
          toStr(i.id),
          toStr(i.id),
          toStr(i.name),
          toStr(i.category || 'General'),
          toStr(i.unitType || 'pcs'),
          toNum(i.quantity),
          toNum(i.minStockThreshold || 5),
          toNum(i.costPrice),
          toNum(i.sellingPrice),
          toStr(i.supplierId)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.inventoryRequests)) {
      db.run(`DELETE FROM inventory_requests`);
      const stmt = db.prepare(`
        INSERT INTO inventory_requests (id, requestNo, date, itemCode, itemName, quantity, requestedBy, department, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of data.inventoryRequests) {
        if (!r) continue;
        stmt.run([
          toStr(r.id),
          toStr(r.purchaseOrderId || r.id),
          toStr(r.date),
          toStr(r.supplierId),
          toJson(r.items || []),
          toNum(r.amountPaid),
          toStr(r.requestedBy || 'Staff'),
          toStr(r.department || 'Inventory'),
          toStr(r.status),
          toStr(r.remarks)
        ]);
      }
      stmt.free();
    }

    // Office Use Requests / Pending Requests Table Synchronization
    const officeRequests = Array.isArray(data.officeUseRequests) ? data.officeUseRequests : (Array.isArray(data.pendingRequests) ? data.pendingRequests : []);
    if (officeRequests.length >= 0) {
      db.run(`DELETE FROM office_use_requests`);
      db.run(`DELETE FROM pending_requests`);

      const stmtOff = db.prepare(`
        INSERT INTO office_use_requests (id, requestNo, date, itemId, itemName, quantity, requestedBy, department, status, totalCost, approvedBy, approvalDate, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const stmtPend = db.prepare(`
        INSERT INTO pending_requests (id, requestNo, date, itemId, itemName, quantity, requestedBy, department, status, totalCost, approvedBy, approvalDate, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const r of officeRequests) {
        if (!r) continue;
        const rowVals = [
          toStr(r.id),
          toStr(r.requestNo || r.id),
          toStr(r.date),
          toStr(r.itemId),
          toStr(r.itemName),
          toNum(r.quantity),
          toStr(r.requestedBy || 'Staff'),
          toStr(r.department || 'Office Use'),
          toStr(r.status || 'Pending'),
          toNum(r.totalCost),
          toStr(r.approvedBy),
          toStr(r.approvalDate),
          toStr(r.remarks)
        ];
        stmtOff.run(rowVals);
        stmtPend.run(rowVals);
      }
      stmtOff.free();
      stmtPend.free();
    }

    if (Array.isArray(data.expenses)) {
      db.run(`DELETE FROM expenses`);
      const stmt = db.prepare(`
        INSERT INTO expenses (id, expenseNo, category, description, amount, paymentMethod, date, recordedBy, referenceId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of data.expenses) {
        if (!e) continue;
        stmt.run([
          toStr(e.id),
          toStr(e.expenseNo),
          toStr(e.category),
          toStr(e.title || e.description),
          toNum(e.amount),
          toStr(e.paymentMethod),
          toStr(e.date),
          toStr(e.createdBy || e.recordedBy),
          toStr(e.referenceId)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.dailyClosings)) {
      db.run(`DELETE FROM daily_closings`);
      const stmt = db.prepare(`
        INSERT INTO daily_closings (id, closingDate, totalSales, cashReceived, esewaReceived, bankReceived, sahakariReceived, totalExpenses, closingBalance, remarks, status, verifiedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of data.dailyClosings) {
        if (!c) continue;
        stmt.run([
          toStr(c.id),
          toStr(c.date || c.closingDate),
          toNum(c.totalSales),
          toNum(c.cashSales || c.cashReceived),
          toNum(c.esewaSales || c.esewaReceived),
          toNum(c.bankSales || c.bankReceived),
          toNum(c.sahakariSales || c.sahakariReceived),
          toNum(c.totalExpenses),
          toNum(c.remainingCash || c.closingBalance),
          toStr(c.adminRemarks || c.remarks),
          toStr(c.status),
          toStr(c.approvedBy || c.verifiedBy)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.invoices)) {
      db.run(`DELETE FROM sales_invoices`);
      const stmt = db.prepare(`
        INSERT INTO sales_invoices (id, invoiceNo, customerName, customerPhone, customerEmail, customerAddress, date, items, totalAmount, discount, grandTotal, amountPaid, amountDue, paymentMethod, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const inv of data.invoices) {
        if (!inv) continue;
        stmt.run([
          toStr(inv.id),
          toStr(inv.invoiceNo || inv.invoiceNumber),
          toStr(inv.customerName),
          toStr(inv.customerPhone),
          toStr(inv.customerEmail || inv.customer_email),
          toStr(inv.customerAddress),
          toStr(inv.date),
          toJson(inv.items || []),
          toNum(inv.totalAmount),
          toNum(inv.discount ?? inv.discountAmount),
          toNum(inv.grandTotal ?? inv.finalAmount),
          toNum(inv.amountPaid ?? inv.paidAmount),
          toNum(inv.amountDue ?? inv.dueAmount),
          toStr(inv.paymentMethod),
          toStr(inv.createdBy || inv.salesperson)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.supplierPayments)) {
      db.run(`DELETE FROM supplier_payments`);
      const stmt = db.prepare(`
        INSERT INTO supplier_payments (id, supplierId, date, amountPaid, paymentMethod, remarks, receiptUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const sp of data.supplierPayments) {
        if (!sp) continue;
        stmt.run([
          toStr(sp.id),
          toStr(sp.supplierId),
          toStr(sp.date),
          toNum(sp.amountPaid),
          toStr(sp.paymentMethod),
          toStr(sp.remarks),
          toStr(sp.receiptUrl)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.transactions)) {
      db.run(`DELETE FROM supply_transactions`);
      const stmt = db.prepare(`
        INSERT INTO supply_transactions (id, supplierId, date, itemsBought, amountPaid, amountDue, totalAmount, status, invoiceNo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const tx of data.transactions) {
        if (!tx) continue;
        stmt.run([
          toStr(tx.id),
          toStr(tx.supplierId),
          toStr(tx.date),
          toJson(tx.items || []),
          toNum(tx.amountPaid),
          toNum(tx.amountDue),
          toNum(tx.totalAmount),
          toStr(tx.status),
          toStr(tx.invoiceNo)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.letters)) {
      db.run(`DELETE FROM official_letters`);
      const stmt = db.prepare(`
        INSERT INTO official_letters (id, letterNo, subject, recipient, date, content, category, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const l of data.letters) {
        if (!l) continue;
        stmt.run([
          toStr(l.id),
          toStr(l.letterNo),
          toStr(l.subject),
          toStr(l.recipient),
          toStr(l.date),
          toStr(l.content),
          toStr(l.category),
          toStr(l.status)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.attendanceRecords)) {
      db.run(`DELETE FROM attendance_records`);
      const stmt = db.prepare(`
        INSERT INTO attendance_records (id, staffId, date, checkInTime, checkOutTime, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of data.attendanceRecords) {
        if (!a) continue;
        stmt.run([
          toStr(a.id),
          toStr(a.staffId),
          toStr(a.date),
          toStr(a.checkInTime),
          toStr(a.checkOutTime),
          toStr(a.status),
          toStr(a.remarks)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.leaveRequests)) {
      db.run(`DELETE FROM leave_requests`);
      const stmt = db.prepare(`
        INSERT INTO leave_requests (id, staffId, leaveType, startDate, endDate, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const lr of data.leaveRequests) {
        if (!lr) continue;
        stmt.run([
          toStr(lr.id),
          toStr(lr.staffId),
          toStr(lr.leaveType),
          toStr(lr.startDate),
          toStr(lr.endDate),
          toStr(lr.reason),
          toStr(lr.status)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.salaryDistributions)) {
      db.run(`DELETE FROM salary_distributions`);
      const stmt = db.prepare(`
        INSERT INTO salary_distributions (id, staffId, month, baseSalary, bonus, deductions, netSalary, paymentDate, paymentMethod)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const sd of data.salaryDistributions) {
        if (!sd) continue;
        stmt.run([
          toStr(sd.id),
          toStr(sd.staffId),
          toStr(sd.month),
          toNum(sd.baseSalary),
          toNum(sd.bonus),
          toNum(sd.deductions),
          toNum(sd.netSalary),
          toStr(sd.paymentDate),
          toStr(sd.paymentMethod)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.attendanceRequests)) {
      db.run(`DELETE FROM attendance_requests`);
      const stmt = db.prepare(`
        INSERT INTO attendance_requests (id, staffId, date, requestType, reason, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const ar of data.attendanceRequests) {
        if (!ar) continue;
        stmt.run([
          toStr(ar.id),
          toStr(ar.staffId),
          toStr(ar.date),
          toStr(ar.requestType),
          toStr(ar.reason),
          toStr(ar.status)
        ]);
      }
      stmt.free();
    }

    if (data.openingBalances && typeof data.openingBalances === 'object') {
      db.run(`DELETE FROM opening_balances`);
      const stmt = db.prepare(`
        INSERT INTO opening_balances (account, openingBalance, openingBalanceDate, openingBalanceProof)
        VALUES (?, ?, ?, ?)
      `);
      for (const accKey of Object.keys(data.openingBalances)) {
        const item = data.openingBalances[accKey];
        if (!item) continue;
        stmt.run([
          toStr(accKey),
          toNum(item.openingBalance),
          toStr(item.openingBalanceDate),
          toStr(item.openingBalanceProof)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.accountTransfers)) {
      db.run(`DELETE FROM account_transfers`);
      const stmt = db.prepare(`
        INSERT INTO account_transfers (id, date, fromAccount, toAccount, amount, remarks, transferNo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const at of data.accountTransfers) {
        if (!at) continue;
        stmt.run([
          toStr(at.id),
          toStr(at.date),
          toStr(at.fromAccount),
          toStr(at.toAccount),
          toNum(at.amount),
          toStr(at.remarks),
          toStr(at.transferNo)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.assets)) {
      db.run(`DELETE FROM assets`);
      const stmt = db.prepare(`
        INSERT INTO assets (id, assetName, category, purchaseDate, purchasePrice, currentStatus, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const ast of data.assets) {
        if (!ast) continue;
        stmt.run([
          toStr(ast.id),
          toStr(ast.assetName || ast.name),
          toStr(ast.category),
          toStr(ast.purchaseDate),
          toNum(ast.purchasePrice || ast.cost),
          toStr(ast.currentStatus || ast.status),
          toStr(ast.location)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.periodicClosings)) {
      db.run(`DELETE FROM periodic_closings`);
      const stmt = db.prepare(`
        INSERT INTO periodic_closings (id, periodType, startDate, endDate, totalRevenue, totalExpenses, netProfit, meetingNumber, meetingDate, decisionNumber, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const pc of data.periodicClosings) {
        if (!pc) continue;
        stmt.run([
          toStr(pc.id),
          toStr(pc.periodType),
          toStr(pc.startDate),
          toStr(pc.endDate),
          toNum(pc.totalRevenue),
          toNum(pc.totalExpenses),
          toNum(pc.netProfit),
          toStr(pc.meetingNumber),
          toStr(pc.meetingDate),
          toStr(pc.decisionNumber),
          toStr(pc.status)
        ]);
      }
      stmt.free();
    }

    if (Array.isArray(data.meetingNotes)) {
      db.run(`DELETE FROM meeting_notes`);
      const stmt = db.prepare(`
        INSERT INTO meeting_notes (id, meetingDate, meetingNumber, typeOfMeeting, presentMembers, agendas, status, submittedBy, approvedByAdmins, totalAdminsAtSubmission)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const m of data.meetingNotes) {
        if (!m) continue;
        stmt.run([
          toStr(m.id),
          toStr(m.meetingDate),
          toStr(m.meetingNumber),
          toStr(m.typeOfMeeting),
          toJson(m.presentMembers || []),
          toJson(m.agendas || []),
          toStr(m.status),
          toStr(m.submittedBy),
          toJson(m.approvedByAdmins || []),
          toInt(m.totalAdminsAtSubmission || 0)
        ]);
      }
      stmt.free();
    }
  } catch (err) {
    console.error('[SQLite] Error syncing relational tables:', err);
  }

  // 3. Save binary file directly to disk
  saveDatabaseToDisk(db);
}

export interface StoredEmailLog {
  id: string;
  timestamp: number;
  dateFormatted?: string;
  sender: string;
  recipientEmail: string;
  recipientName: string;
  emailType: string;
  subject: string;
  success: boolean;
  error?: string;
  messageId?: string;
}

export async function saveEmailDispatchLogInDB(log: StoredEmailLog): Promise<void> {
  try {
    const db = await getSQLiteDatabase();
    const stmt = db.prepare(`
      INSERT INTO email_dispatch_logs (id, timestamp, dateFormatted, sender, recipientEmail, recipientName, emailType, subject, success, error, messageId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      log.id,
      log.timestamp,
      log.dateFormatted || new Date(log.timestamp).toISOString(),
      log.sender,
      log.recipientEmail,
      log.recipientName || 'Recipient',
      log.emailType || 'General Notification',
      log.subject || 'RTSS Notification',
      log.success ? 1 : 0,
      log.error || '',
      log.messageId || ''
    ]);
    stmt.free();
    saveDatabaseToDisk(db);
  } catch (err) {
    console.error('[SQLite] Failed to persist email dispatch log:', err);
  }
}

export async function getEmailDispatchLogsFromDB(limit: number = 200): Promise<StoredEmailLog[]> {
  try {
    const db = await getSQLiteDatabase();
    const stmt = db.prepare(`SELECT * FROM email_dispatch_logs ORDER BY timestamp DESC LIMIT ?`);
    stmt.bind([limit]);
    const logs: StoredEmailLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      logs.push({
        id: String(row.id || ''),
        timestamp: Number(row.timestamp || 0),
        dateFormatted: String(row.dateFormatted || ''),
        sender: String(row.sender || ''),
        recipientEmail: String(row.recipientEmail || ''),
        recipientName: String(row.recipientName || ''),
        emailType: String(row.emailType || ''),
        subject: String(row.subject || ''),
        success: Boolean(row.success),
        error: row.error ? String(row.error) : undefined,
        messageId: row.messageId ? String(row.messageId) : undefined
      });
    }
    stmt.free();
    return logs;
  } catch (err) {
    console.error('[SQLite] Error reading email logs:', err);
    return [];
  }
}

export async function setKV(key: string, value: string): Promise<void> {
  try {
    const db = await getSQLiteDatabase();
    const stmt = db.prepare(`INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)`);
    stmt.run([key, value]);
    stmt.free();
    saveDatabaseToDisk(db);
  } catch (err) {
    console.error(`[SQLite] Error setting KV key ${key}:`, err);
  }
}

export async function getKV(key: string): Promise<string | null> {
  try {
    const db = await getSQLiteDatabase();
    const stmt = db.prepare(`SELECT value FROM kv_store WHERE key = ?`);
    stmt.bind([key]);
    let value: string | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      value = row.value ? String(row.value) : null;
    }
    stmt.free();
    return value;
  } catch (err) {
    console.error(`[SQLite] Error getting KV key ${key}:`, err);
    return null;
  }
}

// ==========================================
// GMAIL & EMAIL CENTER DATABASE OPERATIONS
// ==========================================

export interface EmailRecord {
  id: string;
  threadId?: string;
  account: string;
  sender: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  cc?: string;
  bcc?: string;
  subject: string;
  snippet?: string;
  body: string;
  htmlContent?: string;
  html?: string;
  folder: 'inbox' | 'sent' | 'starred' | 'trash' | 'drafts' | string;
  tags?: string | string[];
  emailType?: string;
  timestamp?: number;
  date?: string;
  dateFormatted: string;
  bsDate?: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments?: boolean;
  fileAttachments?: any[];
  systemReports?: any[];
  success?: boolean;
  error?: string;
  messageId?: string;
}

function seedInitialEmailsIfEmpty(db: Database) {
  try {
    const stmtCheck = db.prepare("SELECT COUNT(*) as count FROM emails");
    let count = 0;
    if (stmtCheck.step()) {
      count = (stmtCheck.getAsObject().count as number) || 0;
    }
    stmtCheck.free();

    if (count > 0) return; // Already seeded

    console.log("[SQLite] Seeding initial Gmail inboxes & sent emails for both accounts...");

    const now = Date.now();
    const initialEmails: any[] = [
      // === donotreply.rtss@gmail.com (Priority 1 - RTSS Official System) ===
      {
        id: "eml_dnr_001",
        threadId: "th_dnr_001",
        account: "donotreply.rtss@gmail.com",
        sender: "RTSS Official System <donotreply.rtss@gmail.com>",
        senderEmail: "donotreply.rtss@gmail.com",
        senderName: "RTSS Official System",
        recipientEmail: "arpan.khadka@example.com",
        recipientName: "Arpan Khadka",
        subject: "Official Tax Invoice #RTSS-2083-0045 - CCTV & Fiber Network Setup",
        body: `Dear Arpan Khadka,\n\nThank you for choosing ReliableTech Services & Suppliers. Your official Tax Invoice #RTSS-2083-0045 has been generated and dispatched.\n\nWork Summary:\n• 8-Channel Hikvision IP Camera Surveillance Setup\n• Fiber Optic Media Converter & PoE Gigabit Switch\n• Cat6 UTP Cabling & Conduit Routing\n• Total Billed Amount: NPR 45,850.00 (Paid in Full)\n\nPlease find the attached system invoice report for your accounting and warranty records. For technical assistance, please reach out to our service counter at Fikkal Bazar.\n\nBest regards,\nRTSS Billing Department`,
        htmlContent: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #0284c7;">Tax Invoice Dispatch</h2>
          <p>Dear <strong>Arpan Khadka</strong>,</p>
          <p>Thank you for choosing <strong>ReliableTech Services &amp; Suppliers</strong>. Your official Tax Invoice <strong>#RTSS-2083-0045</strong> has been generated and confirmed.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0;"><strong>Invoice Ref:</strong> RTSS-2083-0045</p>
            <p style="margin: 0 0 6px 0;"><strong>Service:</strong> CCTV &amp; Fiber Network Setup</p>
            <p style="margin: 0 0 6px 0;"><strong>Total Amount:</strong> <span style="color: #059669; font-weight: bold;">NPR 45,850.00</span></p>
            <p style="margin: 0;"><strong>Status:</strong> Paid</p>
          </div>
          <p>The formal invoice details are attached below.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">ReliableTech Services &amp; Suppliers • Fikkal Bazar, Ilam, Nepal</p>
        </div>`,
        folder: "sent",
        emailType: "Official Invoice Dispatch",
        timestamp: now - 1000 * 60 * 60 * 2,
        dateFormatted: "Today, 10:45 AM",
        bsDate: "2083-05-18",
        isRead: 1,
        isStarred: 1,
        hasAttachments: 1,
        fileAttachmentsJson: "[]",
        systemReportsJson: JSON.stringify([
          {
            id: "rep_dnr_001",
            type: "invoice",
            category: "Sales Bill / Invoice",
            title: "Tax Invoice #RTSS-2083-0045",
            referenceNo: "RTSS-2083-0045",
            reportDate: "2083-05-18",
            amount: 45850,
            summary: "Hikvision 8CH IP CCTV installation, Cat6 UTP cabling, Gigabit PoE Switch, and Fiber router configuration."
          }
        ]),
        success: 1,
        messageId: "msg_dnr_001@rtss.local"
      },
      {
        id: "eml_dnr_002",
        threadId: "th_dnr_002",
        account: "donotreply.rtss@gmail.com",
        sender: "RTSS Security Guard <security.service@rtss.local>",
        senderEmail: "security.service@rtss.local",
        senderName: "RTSS Security Guard",
        recipientEmail: "donotreply.rtss@gmail.com",
        recipientName: "RTSS Audit & Accounts Team",
        subject: "Automated Daily Closing & Vault Reconciliation Verification (2083-05-17)",
        body: `Attention Management & Audit Committee,\n\nThe automated daily cash ledger and vault reconciliation summary for yesterday has been verified with zero variances across RBB Account, eSewa Merchant gateway, Sahakari credit union, and physical cash drawers.\n\nKey Metrics:\n• Total Cash Collection: Rs. 1,24,500.00\n• Vault Safe Deposit: Rs. 85,000.00\n• Cash In Hand Counter Drawer: Rs. 39,500.00\n• Cash Discrepancy / Mismatch: Rs. 0.00 (Exact Match)\n\nPlease review the attached daily closing audit report for the legal archive.`,
        htmlContent: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #0f172a;">Daily Closing Reconciliation Audit</h2>
          <p>Attention Management &amp; Audit Committee,</p>
          <p>The automated daily cash ledger and vault reconciliation summary has been completed with <strong>Zero Variance</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f1f5f9;"><th style="padding: 8px; text-align: left; border: 1px solid #cbd5e1;">Metric</th><th style="padding: 8px; text-align: right; border: 1px solid #cbd5e1;">Amount (NPR)</th></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1;">Total Daily Revenue</td><td style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; font-weight: bold;">Rs. 1,24,500.00</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1;">Vault Safe Deposit</td><td style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; color: #0284c7;">Rs. 85,000.00</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1;">Physical Drawer Balance</td><td style="padding: 8px; text-align: right; border: 1px solid #cbd5e1;">Rs. 39,500.00</td></tr>
            <tr style="background: #f0fdf4;"><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #16a34a;">Audit Variance</td><td style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; font-weight: bold; color: #16a34a;">Rs. 0.00 (Verified)</td></tr>
          </table>
        </div>`,
        folder: "inbox",
        emailType: "System Audit Notification",
        timestamp: now - 1000 * 60 * 60 * 18,
        dateFormatted: "Yesterday, 7:15 PM",
        bsDate: "2083-05-17",
        isRead: 1,
        isStarred: 0,
        hasAttachments: 1,
        fileAttachmentsJson: "[]",
        systemReportsJson: JSON.stringify([
          {
            id: "rep_dnr_002",
            type: "report",
            category: "Monthly Closing",
            title: "Daily Closing Audit Statement",
            referenceNo: "DC-2083-05-17",
            reportDate: "2083-05-17",
            amount: 124500,
            summary: "Total Cash Collection: Rs. 1,24,500 | Vault Safe Deposit: Rs. 85,000 | Variance: Rs. 0.00"
          }
        ]),
        success: 1,
        messageId: "msg_dnr_002@rtss.local"
      },
      {
        id: "eml_dnr_003",
        threadId: "th_dnr_003",
        account: "donotreply.rtss@gmail.com",
        sender: "RTSS Official System <donotreply.rtss@gmail.com>",
        senderEmail: "donotreply.rtss@gmail.com",
        senderName: "RTSS Official System",
        recipientEmail: "suman.shrestha@example.com",
        recipientName: "Suman Shrestha",
        subject: "RTSS Verification Code: 641829 (Staff Security Authentication)",
        body: `Hello Suman Shrestha,\n\nYour one-time verification code is:\n\n641829\n\nThis code is valid for the next 5 minutes. For security reasons, please do not share this code with anyone.\n\nBest regards,\nRTSS Security Systems`,
        htmlContent: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>RTSS Security Authentication</h2>
          <p>Your one-time verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; margin: 20px 0;">641829</div>
          <p style="color: #dc2626;">Valid for 5 minutes. Do not share with anyone.</p>
        </div>`,
        folder: "sent",
        emailType: "Staff / Admin OTP Login",
        timestamp: now - 1000 * 60 * 60 * 28,
        dateFormatted: "Yesterday, 9:20 AM",
        bsDate: "2083-05-17",
        isRead: 1,
        isStarred: 0,
        hasAttachments: 0,
        fileAttachmentsJson: "[]",
        systemReportsJson: "[]",
        success: 1,
        messageId: "msg_dnr_003@rtss.local"
      },

      // === reliabletechss.fikkal@gmail.com (Priority 2 / Official Enterprise) ===
      {
        id: "eml_rel_001",
        threadId: "th_rel_001",
        account: "reliabletechss.fikkal@gmail.com",
        sender: "Sagarmatha Tech Suppliers <sales@sagarmathatech.com.np>",
        senderEmail: "sales@sagarmathatech.com.np",
        senderName: "Sagarmatha Tech Suppliers (Kathmandu)",
        recipientEmail: "reliabletechss.fikkal@gmail.com",
        recipientName: "ReliableTech Services & Suppliers",
        subject: "Commercial Quotation & Dispatch Schedule: Wholesale IT & Surveillance Hardware (Inv #ST-9821)",
        body: `Dear RTSS Management (Fikkal Bazar),\n\nGreetings from Sagarmatha Tech Suppliers, Putalisadak, Kathmandu.\n\nIn reference to your purchase inquiry, we have finalized and approved wholesale rates for your upcoming shipment:\n\n1. Seagate SkyHawk 2TB Surveillance Hard Drives (20 Units) @ NPR 6,250\n2. TP-Link Archer C6 Gigabit Dual-Band Routers (15 Units) @ NPR 3,850\n3. D-Link Cat6 305m Solid Copper Cable Drum (2 Drums) @ NPR 11,200\n4. Hikvision 8-Port 100M PoE Switch with 2 Gigabit Uplink (5 Units) @ NPR 5,100\n\nTotal Order Value: NPR 230,250.00\n\nThe consignment has been booked with Ilam Super Express Cargo (Truck No. BA 3 KHA 8192) and will arrive at Fikkal Bazar tomorrow morning by 11:00 AM.\n\nPlease find the attached formal PDF quotation for your purchase ledger registration.\n\nWarm regards,\nBikash Maharjan\nSenior Wholesale Operations Manager\nSagarmatha Tech Suppliers, Kathmandu\nPhone: 01-4248899`,
        htmlContent: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #0f172a;">Commercial Quotation &amp; Dispatch Confirmation</h2>
          <p>Dear <strong>ReliableTech Services &amp; Suppliers Team</strong>,</p>
          <p>Greetings from <strong>Sagarmatha Tech Suppliers, Kathmandu</strong>. We are pleased to confirm your wholesale consignment order for IT &amp; surveillance equipment.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0;"><strong>Consignment No:</strong> ST-9821 / Ilam Cargo</p>
            <p style="margin: 0 0 6px 0;"><strong>Total Valuation:</strong> <span style="color: #0284c7; font-weight: bold;">NPR 230,250.00</span></p>
            <p style="margin: 0;"><strong>Delivery ETA:</strong> Tomorrow 11:00 AM at Fikkal Bazar</p>
          </div>
          <p>PDF Invoice and Purchase Order are attached below.</p>
        </div>`,
        folder: "inbox",
        emailType: "Supplier Procurement",
        timestamp: now - 1000 * 60 * 60 * 4,
        dateFormatted: "Today, 8:30 AM",
        bsDate: "2083-05-18",
        isRead: 0,
        isStarred: 1,
        hasAttachments: 1,
        fileAttachmentsJson: JSON.stringify([
          {
            id: "att_st_001",
            name: "Quotation_SagarmathaTech_ST9821.pdf",
            size: 142800,
            type: "application/pdf",
            dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp..."
          }
        ]),
        systemReportsJson: JSON.stringify([
          {
            id: "rep_rel_001",
            type: "report",
            category: "Purchase Order",
            title: "Commercial Hardware Procurement Order",
            referenceNo: "PO-2083-089",
            reportDate: "2083-05-18",
            amount: 230250,
            summary: "20x Seagate 2TB HDD, 15x TP-Link Gigabit Routers, 2x D-Link Cat6 Drums, 5x Hikvision PoE switches."
          }
        ]),
        success: 1,
        messageId: "msg_rel_001@sagarmathatech.com.np"
      },
      {
        id: "eml_rel_002",
        threadId: "th_rel_002",
        account: "reliabletechss.fikkal@gmail.com",
        sender: "ReliableTech Services & Suppliers <reliabletechss.fikkal@gmail.com>",
        senderEmail: "reliabletechss.fikkal@gmail.com",
        senderName: "ReliableTech Services & Suppliers",
        recipientEmail: "management@kanyam-tea.org.np",
        recipientName: "Kanyam Tea Processing Estate",
        subject: "Official Proposal & Technical Audit: Digital Weighbridge Automation & CCTV Integration",
        body: `To The General Manager,\nKanyam Tea Processing Estate,\nKanyam, Ilam, Nepal.\n\nSubject: Submission of Comprehensive Engineering Proposal for Digital Weighbridge Integration and IP Camera Perimeter Surveillance.\n\nRespected Sir/Madam,\n\nFollowing our engineering team's comprehensive on-site survey at your tea leaf collection and processing center in Kanyam, we have finalized the turn-key automation and ledger synchronization project plan.\n\nScope of Implementation:\n1. Digital Weighbridge Load-Cell PC Interface with automated weight ticket issuance and RTSS ledger sync.\n2. 16-Channel 4K Ultra-HD Perimeter Surveillance with optical fiber trunk connecting Weighbridge Station to Administrative Office.\n3. Complete lightning protection and industrial voltage surge suppression units.\n\nProject Budget Estimate: NPR 320,000.00\nEstimated Completion Time: 10 Working Days from date of mobilization.\n\nPlease find the attached Income & Expenditure Ledger Projection and Technical Feasibility Report.\n\nYours sincerely,\nArpan Khadka\nManaging Director\nReliableTech Services & Suppliers, Fikkal Bazar, Ilam`,
        htmlContent: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #0284c7;">Project Proposal: Weighbridge Automation &amp; Surveillance</h2>
          <p>To The General Manager,<br/><strong>Kanyam Tea Processing Estate</strong>, Kanyam, Ilam.</p>
          <p>We are honored to submit our technical proposal and budget analysis for your leaf processing weighbridge automation and fiber CCTV perimeter installation.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0;"><strong>Project Estimate:</strong> <span style="color: #0f172a; font-weight: bold;">NPR 320,000.00</span></p>
            <p style="margin: 0 0 6px 0;"><strong>Lead Time:</strong> 10 Working Days</p>
            <p style="margin: 0;"><strong>Warranty:</strong> 2 Years Full Hardware Replacement</p>
          </div>
          <p>Attached please find the comprehensive engineering and budget projection.</p>
        </div>`,
        folder: "sent",
        emailType: "Official Corporate Proposal",
        timestamp: now - 1000 * 60 * 60 * 32,
        dateFormatted: "2 days ago",
        bsDate: "2083-05-16",
        isRead: 1,
        isStarred: 1,
        hasAttachments: 1,
        fileAttachmentsJson: "[]",
        systemReportsJson: JSON.stringify([
          {
            id: "rep_rel_002",
            type: "report",
            category: "Income and Expenditure Ledger",
            title: "Project Engineering Cost & Margin Projections",
            referenceNo: "PROP-KANYAM-2083",
            reportDate: "2083-05-16",
            amount: 320000,
            summary: "Industrial weighbridge interface, fiber optics backbone, 16x 4K IP cameras, lightning arrestors."
          }
        ]),
        success: 1,
        messageId: "msg_rel_002@rtss.local"
      },
      {
        id: "eml_rel_003",
        threadId: "th_rel_003",
        account: "reliabletechss.fikkal@gmail.com",
        sender: "Ilam Chamber of Commerce <commerce.ilam@gmail.com>",
        senderEmail: "commerce.ilam@gmail.com",
        senderName: "Ilam District Chamber of Commerce",
        recipientEmail: "reliabletechss.fikkal@gmail.com",
        recipientName: "ReliableTech Services & Suppliers",
        subject: "Invitation: District IT & Digital Commerce Entrepreneurship Summit 2083",
        body: `Respected Arpan Khadka & RTSS Team,\n\nIlam District Chamber of Commerce & Industry cordially invites you as a distinguished guest speaker and panelist at the upcoming District IT & Digital Commerce Entrepreneurship Summit 2083, to be held at Fikkal Community Hall on 2083-06-05.\n\nAs a pioneer of technology hardware and computerized bookkeeping solutions in eastern Ilam, your insights on rural SME digitisation and electronic payments will greatly benefit over 200 participating entrepreneurs.\n\nPlease confirm your participation by replying to this email.\n\nWith high regards,\nSurya Prasad Rai\nPresident, Ilam Chamber of Commerce`,
        htmlContent: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #047857;">Official Invitation: District IT &amp; Commerce Summit 2083</h2>
          <p>Respected <strong>Arpan Khadka &amp; ReliableTech Team</strong>,</p>
          <p>The <strong>Ilam District Chamber of Commerce &amp; Industry</strong> warmly invites you to share your journey of rural tech entrepreneurship at the Fikkal Community Hall on <strong>2083-06-05</strong>.</p>
          <p>We look forward to welcoming you.</p>
        </div>`,
        folder: "inbox",
        emailType: "Official Invitation",
        timestamp: now - 1000 * 60 * 60 * 55,
        dateFormatted: "3 days ago",
        bsDate: "2083-05-15",
        isRead: 1,
        isStarred: 0,
        hasAttachments: 0,
        fileAttachmentsJson: "[]",
        systemReportsJson: "[]",
        success: 1,
        messageId: "msg_rel_003@commerce.ilam"
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO emails (
        id, threadId, account, sender, senderEmail, senderName, recipientEmail, recipientName,
        cc, bcc, subject, body, htmlContent, folder, emailType, timestamp, dateFormatted, bsDate,
        isRead, isStarred, hasAttachments, fileAttachmentsJson, systemReportsJson, success, messageId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const eml of initialEmails) {
      insertStmt.run([
        eml.id,
        eml.threadId || eml.id,
        eml.account,
        eml.sender,
        eml.senderEmail,
        eml.senderName,
        eml.recipientEmail,
        eml.recipientName,
        eml.cc || "",
        eml.bcc || "",
        eml.subject,
        eml.body,
        eml.htmlContent || "",
        eml.folder,
        eml.emailType || "General",
        eml.timestamp,
        eml.dateFormatted,
        eml.bsDate || "",
        eml.isRead ? 1 : 0,
        eml.isStarred ? 1 : 0,
        eml.hasAttachments ? 1 : 0,
        eml.fileAttachmentsJson || "[]",
        eml.systemReportsJson || "[]",
        eml.success ? 1 : 0,
        eml.messageId || ""
      ]);
    }
    insertStmt.free();
    saveDatabaseToDisk(db);
    console.log(`[SQLite] Successfully seeded ${initialEmails.length} initial Gmail messages.`);
  } catch (err) {
    console.error("[SQLite] Error in seedInitialEmailsIfEmpty:", err);
  }
}

export async function saveEmailToDB(email: EmailRecord): Promise<void> {
  try {
    const db = await getSQLiteDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO emails (
        id, threadId, account, sender, senderEmail, senderName, recipientEmail, recipientName,
        cc, bcc, subject, body, htmlContent, folder, emailType, timestamp, dateFormatted, bsDate,
        isRead, isStarred, hasAttachments, fileAttachmentsJson, systemReportsJson, success, error, messageId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      email.id,
      email.threadId || email.id,
      email.account,
      email.sender,
      email.senderEmail,
      email.senderName,
      email.recipientEmail,
      email.recipientName,
      email.cc || '',
      email.bcc || '',
      email.subject,
      email.body,
      email.htmlContent || '',
      email.folder || 'sent',
      email.emailType || 'General Notification',
      email.timestamp || Date.now(),
      email.dateFormatted || new Date().toLocaleString(),
      email.bsDate || '',
      email.isRead ? 1 : 0,
      email.isStarred ? 1 : 0,
      email.hasAttachments ? 1 : 0,
      toJson(email.fileAttachments),
      toJson(email.systemReports),
      email.success ? 1 : 0,
      email.error || '',
      email.messageId || ''
    ]);
    stmt.free();
    saveDatabaseToDisk(db);
  } catch (err) {
    console.error('[SQLite] Error saving email to DB:', err);
    throw err;
  }
}

export async function getEmailsFromDB(params?: {
  account?: string;
  folder?: string;
  isStarred?: boolean;
  search?: string;
  limit?: number;
}): Promise<EmailRecord[]> {
  try {
    const db = await getSQLiteDatabase();
    let query = "SELECT * FROM emails WHERE 1=1";
    const bindings: any[] = [];

    if (params?.account && params.account !== 'all') {
      query += " AND account = ?";
      bindings.push(params.account.trim().toLowerCase());
    }

    if (params?.folder && params.folder !== 'all') {
      if (params.folder === 'starred') {
        query += " AND isStarred = 1 AND folder != 'trash'";
      } else {
        query += " AND folder = ?";
        bindings.push(params.folder);
      }
    } else {
      // Default: exclude trash unless specifically requested
      query += " AND folder != 'trash'";
    }

    if (params?.search && params.search.trim()) {
      const s = `%${params.search.trim().toLowerCase()}%`;
      query += " AND (LOWER(subject) LIKE ? OR LOWER(sender) LIKE ? OR LOWER(recipientEmail) LIKE ? OR LOWER(body) LIKE ?)";
      bindings.push(s, s, s, s);
    }

    query += " ORDER BY timestamp DESC";

    if (params?.limit) {
      query += " LIMIT ?";
      bindings.push(params.limit);
    }

    const stmt = db.prepare(query);
    stmt.bind(bindings);

    const emails: EmailRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      let fileAttachments: any[] = [];
      let systemReports: any[] = [];
      try {
        if (row.fileAttachmentsJson) {
          const parsed = JSON.parse(String(row.fileAttachmentsJson));
          if (Array.isArray(parsed)) {
            fileAttachments = parsed.map((f: any, idx: number) => ({
              ...f,
              id: f?.id || `att_${row.id || 'eml'}_${idx}_${f?.name || 'file'}`
            }));
          }
        }
      } catch (e) {}
      try {
        if (row.systemReportsJson) {
          const parsed = JSON.parse(String(row.systemReportsJson));
          if (Array.isArray(parsed)) {
            systemReports = parsed.map((r: any, idx: number) => ({
              ...r,
              id: r?.id || `rep_${row.id || 'eml'}_${idx}_${r?.referenceNo || r?.title || 'doc'}`
            }));
          }
        }
      } catch (e) {}

      emails.push({
        id: String(row.id || ''),
        threadId: row.threadId ? String(row.threadId) : undefined,
        account: String(row.account || ''),
        sender: String(row.sender || ''),
        senderEmail: String(row.senderEmail || ''),
        senderName: String(row.senderName || ''),
        recipientEmail: String(row.recipientEmail || ''),
        recipientName: String(row.recipientName || ''),
        cc: row.cc ? String(row.cc) : undefined,
        bcc: row.bcc ? String(row.bcc) : undefined,
        subject: String(row.subject || ''),
        body: String(row.body || ''),
        htmlContent: row.htmlContent ? String(row.htmlContent) : undefined,
        folder: String(row.folder || 'inbox'),
        emailType: row.emailType ? String(row.emailType) : undefined,
        timestamp: Number(row.timestamp || 0),
        dateFormatted: String(row.dateFormatted || ''),
        bsDate: row.bsDate ? String(row.bsDate) : undefined,
        isRead: Boolean(row.isRead),
        isStarred: Boolean(row.isStarred),
        hasAttachments: Boolean(row.hasAttachments),
        fileAttachments,
        systemReports,
        success: Boolean(row.success),
        error: row.error ? String(row.error) : undefined,
        messageId: row.messageId ? String(row.messageId) : undefined
      });
    }
    stmt.free();
    return emails;
  } catch (err) {
    console.error('[SQLite] Error reading emails:', err);
    return [];
  }
}

export async function updateEmailInDB(id: string, updates: Partial<EmailRecord>): Promise<boolean> {
  try {
    const db = await getSQLiteDatabase();
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.isRead !== undefined) {
      setClauses.push("isRead = ?");
      values.push(updates.isRead ? 1 : 0);
    }
    if (updates.isStarred !== undefined) {
      setClauses.push("isStarred = ?");
      values.push(updates.isStarred ? 1 : 0);
    }
    if (updates.folder !== undefined) {
      setClauses.push("folder = ?");
      values.push(updates.folder);
    }

    if (setClauses.length === 0) return false;

    values.push(id);
    const query = `UPDATE emails SET ${setClauses.join(", ")} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(values);
    stmt.free();
    saveDatabaseToDisk(db);
    return true;
  } catch (err) {
    console.error('[SQLite] Error updating email in DB:', err);
    return false;
  }
}

export async function deleteEmailFromDB(id: string, permanent: boolean = false): Promise<boolean> {
  try {
    const db = await getSQLiteDatabase();
    if (permanent) {
      const stmt = db.prepare("DELETE FROM emails WHERE id = ?");
      stmt.run([id]);
      stmt.free();
    } else {
      const stmt = db.prepare("UPDATE emails SET folder = 'trash' WHERE id = ?");
      stmt.run([id]);
      stmt.free();
    }
    saveDatabaseToDisk(db);
    return true;
  } catch (err) {
    console.error('[SQLite] Error deleting email from DB:', err);
    return false;
  }
}

