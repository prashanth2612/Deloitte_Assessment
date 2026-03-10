require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { globSync } = require('glob');
const fs = require('fs');
const { generate: uniqueId } = require('shortid');
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE);

async function setupApp() {
  try {
    // ── Admin ──────────────────────────────────────────────────────────────────
    const Admin        = require('../models/coreModels/Admin');
    const AdminPassword= require('../models/coreModels/AdminPassword');
    const newPwd       = new AdminPassword();
    const salt         = uniqueId();
    const passwordHash = newPwd.generateHash(salt, 'admin123');

    const adminResult  = await new Admin({
      email: 'admin@demo.com', name: 'Prashanth', surname: 'Admin',
      enabled: true, role: 'owner',
    }).save();

    await new AdminPassword({
      password: passwordHash, emailVerified: true, salt, user: adminResult._id,
    }).save();
    console.log('👍 Admin created');

    // ── Settings ───────────────────────────────────────────────────────────────
    const Setting = require('../models/coreModels/Setting');
    const settingFiles = [];
    for (const fp of globSync('./src/setup/defaultSettings/**/*.json')) {
      settingFiles.push(...JSON.parse(fs.readFileSync(fp, 'utf-8')));
    }
    await Setting.insertMany(settingFiles);
    console.log('👍 Settings created');

    // ── Taxes ──────────────────────────────────────────────────────────────────
    const Taxes = require('../models/appModels/Taxes');
    const tax0  = await new Taxes({ taxName: 'No Tax (0%)',  taxValue: '0',  isDefault: true }).save();
    const tax5  = await new Taxes({ taxName: 'GST 5%',       taxValue: '5'  }).save();
    const tax12 = await new Taxes({ taxName: 'GST 12%',      taxValue: '12' }).save();
    const tax18 = await new Taxes({ taxName: 'GST 18%',      taxValue: '18' }).save();
    const tax28 = await new Taxes({ taxName: 'GST 28%',      taxValue: '28' }).save();
    console.log('👍 Taxes created');

    // ── Payment Modes ──────────────────────────────────────────────────────────
    const PaymentMode = require('../models/appModels/PaymentMode');
    const pmBank = await new PaymentMode({ name: 'Bank Transfer',   description: 'Direct NEFT / RTGS wire', isDefault: true }).save();
    const pmCash = await new PaymentMode({ name: 'Cash',            description: 'Cash on delivery' }).save();
    const pmUPI  = await new PaymentMode({ name: 'UPI / Razorpay',  description: 'Instant UPI payment' }).save();
    const pmCard = await new PaymentMode({ name: 'Credit / Debit Card', description: 'Visa, Mastercard, Rupay' }).save();
    const pmCheq = await new PaymentMode({ name: 'Cheque',          description: 'Account payee cheque' }).save();
    console.log('👍 Payment modes created');

    // ── Product Categories ─────────────────────────────────────────────────────
    const ProductCategory = require('../models/appModels/ProductCategory');
    const catBrew  = await new ProductCategory({ name: 'Brewing Equipment', description: 'Machines & hardware for brewing coffee', color: '#6F4E37', enabled: true }).save();
    const catBean  = await new ProductCategory({ name: 'Coffee Beans',      description: 'Single-origin and blended coffee beans',   color: '#C9853A', enabled: true }).save();
    const catMilk  = await new ProductCategory({ name: 'Milk & Dairy',      description: 'Fresh and plant-based milks',              color: '#f0e6d3', enabled: true }).save();
    const catPkg   = await new ProductCategory({ name: 'Packaging',         description: 'Cups, lids, sleeves and bags',             color: '#4a7c59', enabled: true }).save();
    const catSup   = await new ProductCategory({ name: 'Supplies',          description: 'Syrups, sugar, consumables',               color: '#2563eb', enabled: true }).save();
    console.log('👍 Product categories created');

    // ── Products ───────────────────────────────────────────────────────────────
    const Product = require('../models/appModels/Product');
    await Product.insertMany([
      { productCategory: catBrew._id, name: 'La Marzocco Linea Mini',     description: 'Professional single-group espresso machine', price: 45000, currency: 'INR', enabled: true },
      { productCategory: catBrew._id, name: 'Baratza Encore Grinder',     description: 'Entry-level conical burr coffee grinder',     price: 8500,  currency: 'INR', enabled: true },
      { productCategory: catBrew._id, name: 'Hario V60 Dripper',          description: 'Pour-over glass dripper, size 02',            price: 1200,  currency: 'INR', enabled: true },
      { productCategory: catBrew._id, name: 'AeroPress Coffee Maker',     description: 'Portable pressure brewer',                    price: 2800,  currency: 'INR', enabled: true },
      { productCategory: catBean._id, name: 'Coorg Single Origin (250g)', description: 'Medium roast, notes of citrus and nuts',      price: 550,   currency: 'INR', enabled: true },
      { productCategory: catBean._id, name: 'House Blend (500g)',         description: 'Dark roast blend, full body',                 price: 850,   currency: 'INR', enabled: true },
      { productCategory: catBean._id, name: 'Ethiopian Yirgacheffe (250g)',description: 'Light roast, floral and fruity',             price: 780,   currency: 'INR', enabled: true },
      { productCategory: catMilk._id, name: 'Whole Milk (1L)',            description: 'Fresh pasteurised cow milk',                  price: 68,    currency: 'INR', enabled: true },
      { productCategory: catMilk._id, name: 'Oat Milk (1L)',              description: 'Barista-grade oat milk',                      price: 145,   currency: 'INR', enabled: true },
      { productCategory: catPkg._id,  name: 'Double-Wall Cups 12oz (50)', description: 'Kraft paper double-wall cups',                price: 320,   currency: 'INR', enabled: true },
      { productCategory: catPkg._id,  name: 'Flat Lids (100)',            description: 'Sipper flat lids, 12–16oz',                   price: 180,   currency: 'INR', enabled: true },
      { productCategory: catSup._id,  name: 'Vanilla Syrup (750ml)',      description: 'Premium vanilla flavour syrup',               price: 420,   currency: 'INR', enabled: true },
      { productCategory: catSup._id,  name: 'Caramel Syrup (750ml)',      description: 'Smooth caramel flavour syrup',                price: 420,   currency: 'INR', enabled: true },
    ]);
    console.log('👍 Products created');

    // ── Expense Categories ─────────────────────────────────────────────────────
    const ExpenseCategory = require('../models/appModels/ExpenseCategory');
    const ecRent  = await new ExpenseCategory({ name: 'Rent & Utilities',  description: 'Monthly venue, power, internet',     color: '#6F4E37', enabled: true }).save();
    const ecPay   = await new ExpenseCategory({ name: 'Payroll',           description: 'Staff salaries and wages',           color: '#C9853A', enabled: true }).save();
    const ecRaw   = await new ExpenseCategory({ name: 'Raw Materials',     description: 'Beans, milk, supplies purchases',    color: '#4a7c59', enabled: true }).save();
    const ecMkt   = await new ExpenseCategory({ name: 'Marketing',         description: 'Ads, promotions, events',            color: '#2563eb', enabled: true }).save();
    const ecMaint = await new ExpenseCategory({ name: 'Maintenance',       description: 'Machine servicing, repairs',         color: '#dc2626', enabled: true }).save();
    const ecMisc  = await new ExpenseCategory({ name: 'Miscellaneous',     description: 'Other business expenses',            color: '#6b7280', enabled: true }).save();
    console.log('👍 Expense categories created');

    // ── Companies ──────────────────────────────────────────────────────────────
    const Company = require('../models/appModels/Company');
    const companies = await Company.insertMany([
      { name: 'Tata Consultancy Services', email: 'billing@tcs.com',     phone: '+91-22-6778-9999', website: 'https://tcs.com',     country: 'IN', enabled: true },
      { name: 'Infosys Limited',           email: 'accounts@infosys.com',phone: '+91-80-2852-0261', website: 'https://infosys.com', country: 'IN', enabled: true },
      { name: 'Wipro Technologies',        email: 'finance@wipro.com',   phone: '+91-80-2844-0011', website: 'https://wipro.com',   country: 'IN', enabled: true },
      { name: 'HCL Technologies',          email: 'contact@hcl.com',     phone: '+91-120-676-6000', website: 'https://hcl.com',    country: 'IN', enabled: true },
      { name: 'Freshworks',                email: 'accounts@freshworks.com', phone: '+91-44-4710-0000', country: 'IN', enabled: true },
    ]);
    console.log('👍 Companies created');

    // ── People ─────────────────────────────────────────────────────────────────
    const People = require('../models/appModels/People');
    const people = await People.insertMany([
      { firstname: 'Aisha',  lastname: 'Patel',  email: 'aisha.patel@tcs.com',       phone: '+91-98765-43210', country: 'IN', company: companies[0]._id, enabled: true },
      { firstname: 'Rohan',  lastname: 'Sharma', email: 'rohan.sharma@infosys.com',   phone: '+91-99999-12345', country: 'IN', company: companies[1]._id, enabled: true },
      { firstname: 'Priya',  lastname: 'Nair',   email: 'priya.nair@wipro.com',       phone: '+91-91234-56789', country: 'IN', company: companies[2]._id, enabled: true },
      { firstname: 'Vikram', lastname: 'Singh',  email: 'vikram.singh@hcl.com',       phone: '+91-88888-77777', country: 'IN', company: companies[3]._id, enabled: true },
      { firstname: 'Kavya',  lastname: 'Reddy',  email: 'kavya.reddy@freshworks.com', phone: '+91-77777-55555', country: 'IN', company: companies[4]._id, enabled: true },
      { firstname: 'Arjun',  lastname: 'Mehta',  email: 'arjun.mehta@startup.io',     phone: '+91-90000-11111', country: 'IN', enabled: true },
    ]);
    console.log('👍 People created');

    // ── Clients ────────────────────────────────────────────────────────────────
    const Client = require('../models/appModels/Client');
    const clients = await Client.insertMany([
      { type: 'company', name: 'Tata Consultancy Services', email: 'billing@tcs.com',      phone: '+91-22-6778-9999', address: 'TCS House, Fort, Mumbai 400001',       country: 'India', status: 'active',   createdBy: adminResult._id },
      { type: 'company', name: 'Infosys Limited',           email: 'accounts@infosys.com', phone: '+91-80-2852-0261', address: 'Electronics City, Bengaluru 560100',   country: 'India', status: 'active',   createdBy: adminResult._id },
      { type: 'company', name: 'Wipro Technologies',        email: 'finance@wipro.com',    phone: '+91-80-2844-0011', address: 'Sarjapur Road, Bengaluru 560035',      country: 'India', status: 'premium',  createdBy: adminResult._id },
      { type: 'company', name: 'HCL Technologies',          email: 'contact@hcl.com',      phone: '+91-120-676-6000', address: 'Sector 126, Noida 201304',             country: 'India', status: 'active',   createdBy: adminResult._id },
      { type: 'people',  name: 'Aisha Patel',               email: 'aisha.patel@gmail.com',phone: '+91-98765-43210', address: 'Banjara Hills, Hyderabad 500034',       country: 'India', status: 'new',      createdBy: adminResult._id },
      { type: 'people',  name: 'Rohan Sharma',              email: 'rohan@startup.io',     phone: '+91-99999-12345', address: 'Koramangala, Bengaluru 560095',         country: 'India', status: 'active',   createdBy: adminResult._id },
      { type: 'company', name: 'Freshworks',                email: 'accounts@freshworks.com', phone: '+91-44-4710-0000', address: 'Rajiv Gandhi IT Park, Chennai 603103', country: 'India', status: 'active', createdBy: adminResult._id },
    ]);
    console.log('👍 Clients created');

    // ── Leads ──────────────────────────────────────────────────────────────────
    const Lead = require('../models/appModels/Lead');
    const leads = await Lead.insertMany([
      { name: 'Reliance Industries',  source: 'linkedin',         status: 'qualified',   budget: 50000, description: 'Large-scale ERP deployment',        createdBy: adminResult._id },
      { name: 'Mahindra & Mahindra', source: 'recommendation',    status: 'new',         budget: 15000, description: 'Fleet management ERP',              createdBy: adminResult._id },
      { name: 'Nikhil Mehta',        source: 'self checking',     status: 'in-progress', budget: 8000,  description: 'Startup invoicing + CRM',           createdBy: adminResult._id },
      { name: 'Bajaj Finserv',       source: 'facebook',          status: 'qualified',   budget: 35000, description: 'CRM for loan officers',             createdBy: adminResult._id },
      { name: 'Zomato',              source: 'instagram',         status: 'new',         budget: 12000, description: 'Corporate coffee ordering portal',  createdBy: adminResult._id },
      { name: 'Swiggy Corporate',    source: 'linkedin',          status: 'lost',        budget: 9000,  description: 'Bulk order management',             createdBy: adminResult._id },
      { name: 'PhonePe',             source: 'recommendation',    status: 'in-progress', budget: 22000, description: 'Internal cafe management app',      createdBy: adminResult._id },
    ]);
    console.log('👍 Leads created');

    // ── Invoices ───────────────────────────────────────────────────────────────
    const Invoice = require('../models/appModels/Invoice');
    const now = new Date();
    const m = (offset) => new Date(now.getFullYear(), now.getMonth() + offset, 1 + Math.abs(offset) * 3);
    const invoices = await Invoice.insertMany([
      { number: 1001, year: now.getFullYear(), date: m(-1), expiredDate: m(0),  client: clients[0]._id, currency: 'INR', taxRate: 18, subTotal: 125000, taxTotal: 22500, total: 147500, discount: 0, status: 'sent',    paymentStatus: 'unpaid',    notes: 'Net 30 payment terms', items: [{ itemName: 'ERP Consulting Q1', quantity: 50, price: 2500, total: 125000 }], pdf: 'invoice-1001.pdf', createdBy: adminResult._id },
      { number: 1002, year: now.getFullYear(), date: m(-1), expiredDate: m(1),  client: clients[1]._id, currency: 'INR', taxRate: 18, subTotal: 80000,  taxTotal: 14400, total: 94400,  discount: 0, status: 'pending', paymentStatus: 'paid',      notes: 'CRM Phase 1 complete', items: [{ itemName: 'CRM Implementation Phase 1', quantity: 40, price: 2000, total: 80000 }], pdf: 'invoice-1002.pdf', createdBy: adminResult._id },
      { number: 1003, year: now.getFullYear(), date: m(-2), expiredDate: m(-1), client: clients[2]._id, currency: 'INR', taxRate: 0,  subTotal: 55000,  taxTotal: 0,     total: 55000,  discount: 5000, status: 'sent', paymentStatus: 'partially', items: [{ itemName: 'Annual Support Contract', quantity: 1, price: 55000, total: 55000 }], pdf: 'invoice-1003.pdf', createdBy: adminResult._id },
      { number: 1004, year: now.getFullYear(), date: m(0),  expiredDate: m(1),  client: clients[4]._id, currency: 'INR', taxRate: 0,  subTotal: 32000,  taxTotal: 0,     total: 32000,  discount: 0, status: 'draft',   paymentStatus: 'unpaid',    items: [{ itemName: 'Brand Strategy Workshop', quantity: 8, price: 4000, total: 32000 }], pdf: 'invoice-1004.pdf', createdBy: adminResult._id },
      { number: 1005, year: now.getFullYear(), date: m(0),  expiredDate: m(1),  client: clients[5]._id, currency: 'INR', taxRate: 18, subTotal: 68000,  taxTotal: 12240, total: 80240,  discount: 0, status: 'sent',    paymentStatus: 'paid',      items: [{ itemName: 'Custom Dashboard Development', quantity: 1, price: 68000, total: 68000 }], pdf: 'invoice-1005.pdf', createdBy: adminResult._id },
      { number: 1006, year: now.getFullYear(), date: m(-3), expiredDate: m(-2), client: clients[3]._id, currency: 'INR', taxRate: 12, subTotal: 45000,  taxTotal: 5400,  total: 50400,  discount: 0, status: 'sent',    paymentStatus: 'unpaid',    notes: 'Overdue — follow up required', items: [{ itemName: 'IT Infrastructure Audit', quantity: 3, price: 15000, total: 45000 }], pdf: 'invoice-1006.pdf', createdBy: adminResult._id },
      { number: 1007, year: now.getFullYear(), date: m(0),  expiredDate: m(2),  client: clients[6]._id, currency: 'INR', taxRate: 18, subTotal: 96000,  taxTotal: 17280, total: 113280, discount: 0, status: 'draft',   paymentStatus: 'unpaid',    items: [{ itemName: 'Coffee App Integration', quantity: 1, price: 96000, total: 96000 }], pdf: 'invoice-1007.pdf', createdBy: adminResult._id },
    ]);
    console.log('👍 Invoices created');

    // ── Quotes ─────────────────────────────────────────────────────────────────
    const Quote = require('../models/appModels/Quote');
    const quotes = await Quote.insertMany([
      { number: 2001, year: now.getFullYear(), date: m(0), expiredDate: m(2), client: clients[0]._id, currency: 'INR', taxRate: 18, subTotal: 180000, taxTotal: 32400, total: 212400, status: 'sent',     notes: 'Valid 60 days', items: [{ itemName: 'Full ERP Implementation', quantity: 1, price: 180000, total: 180000 }], createdBy: adminResult._id },
      { number: 2002, year: now.getFullYear(), date: m(0), expiredDate: m(1), client: clients[1]._id, currency: 'INR', taxRate: 18, subTotal: 45000,  taxTotal: 8100,  total: 53100,  status: 'accepted', items: [{ itemName: 'Data Migration Services', quantity: 1, price: 45000, total: 45000 }], createdBy: adminResult._id },
      { number: 2003, year: now.getFullYear(), date: m(-1), expiredDate: m(0), client: clients[2]._id, currency: 'INR', taxRate: 0, subTotal: 72000,  taxTotal: 0,     total: 72000,  status: 'declined', items: [{ itemName: 'Mobile App Development', quantity: 1, price: 72000, total: 72000 }], createdBy: adminResult._id },
      { number: 2004, year: now.getFullYear(), date: m(0), expiredDate: m(2), client: clients[3]._id, currency: 'INR', taxRate: 18, subTotal: 35000,  taxTotal: 6300,  total: 41300,  status: 'draft',    items: [{ itemName: 'Cloud Migration Assessment', quantity: 5, price: 7000, total: 35000 }], createdBy: adminResult._id },
      { number: 2005, year: now.getFullYear(), date: m(0), expiredDate: m(1), client: clients[6]._id, currency: 'INR', taxRate: 18, subTotal: 58000,  taxTotal: 10440, total: 68440,  status: 'sent',     items: [{ itemName: 'API Integration Package', quantity: 1, price: 58000, total: 58000 }], createdBy: adminResult._id },
    ]);
    console.log('👍 Quotes created');

    // ── Payments ───────────────────────────────────────────────────────────────
    const Payment = require('../models/appModels/Payment');
    await Payment.insertMany([
      { number: 3001, invoice: invoices[1]._id, client: clients[1]._id, date: m(0),  amount: 94400,  currency: 'INR', paymentMode: pmBank._id, ref: 'NEFT/INF/2025/001', notes: 'Full payment received',              createdBy: adminResult._id },
      { number: 3002, invoice: invoices[4]._id, client: clients[5]._id, date: m(0),  amount: 80240,  currency: 'INR', paymentMode: pmUPI._id,  ref: 'UPI/ROHAN/2025/002', notes: 'UPI cleared',                       createdBy: adminResult._id },
      { number: 3003, invoice: invoices[2]._id, client: clients[2]._id, date: m(-1), amount: 27500,  currency: 'INR', paymentMode: pmCheq._id, ref: 'CHQ/WIPRO/2025/003', notes: 'Partial payment – first instalment', createdBy: adminResult._id },
      { number: 3004, invoice: invoices[0]._id, client: clients[0]._id, date: m(0),  amount: 50000,  currency: 'INR', paymentMode: pmCard._id, ref: 'CARD/TCS/2025/004',  notes: 'Advance payment',                   createdBy: adminResult._id },
    ]);
    console.log('👍 Payments created');

    // ── Offers ─────────────────────────────────────────────────────────────────
    const Offer = require('../models/appModels/Offer');
    await Offer.insertMany([
      { number: 4001, year: now.getFullYear(), date: m(0), expiredDate: m(2), lead: leads[0]._id, currency: 'INR', taxRate: 18, subTotal: 320000, taxTotal: 57600, total: 377600, status: 'sent',     items: [{ itemName: 'Enterprise ERP Package', quantity: 1, price: 320000, total: 320000 }], createdBy: adminResult._id },
      { number: 4002, year: now.getFullYear(), date: m(0), expiredDate: m(1), lead: leads[1]._id, currency: 'INR', taxRate: 18, subTotal: 95000,  taxTotal: 17100, total: 112100, status: 'pending',  items: [{ itemName: 'Fleet CRM Module',  quantity: 1, price: 95000, total: 95000  }], createdBy: adminResult._id },
      { number: 4003, year: now.getFullYear(), date: m(-1), expiredDate: m(1), lead: leads[2]._id, currency: 'INR', taxRate: 0, subTotal: 48000,  taxTotal: 0,     total: 48000,  status: 'accepted', items: [{ itemName: 'Startup CRM Starter', quantity: 1, price: 48000, total: 48000  }], createdBy: adminResult._id },
      { number: 4004, year: now.getFullYear(), date: m(-2), expiredDate: m(0), lead: leads[3]._id, currency: 'INR', taxRate: 18, subTotal: 175000, taxTotal: 31500, total: 206500, status: 'draft',    items: [{ itemName: 'FinServ CRM Platform', quantity: 1, price: 175000, total: 175000 }], createdBy: adminResult._id },
      { number: 4005, year: now.getFullYear(), date: m(0), expiredDate: m(1), lead: leads[6]._id, currency: 'INR', taxRate: 18, subTotal: 62000,  taxTotal: 11160, total: 73160,  status: 'sent',     items: [{ itemName: 'Cafe Management App',  quantity: 1, price: 62000, total: 62000  }], createdBy: adminResult._id },
    ]);
    console.log('👍 Offers created');

    // ── Expenses ───────────────────────────────────────────────────────────────
    const Expense = require('../models/appModels/Expense');
    await Expense.insertMany([
      { name: 'Office Rent – Feb',           expenseCategory: ecRent._id,  total: 45000,  currency: 'INR', date: m(-1), ref: 'RENT/FEB/25' },
      { name: 'Staff Salaries – Feb',        expenseCategory: ecPay._id,   total: 180000, currency: 'INR', date: m(-1), ref: 'SAL/FEB/25' },
      { name: 'Coorg Coffee Beans – Bulk',   expenseCategory: ecRaw._id,   total: 22000,  currency: 'INR', date: m(0),  ref: 'RM/BEAN/001' },
      { name: 'Instagram Ads Campaign',      expenseCategory: ecMkt._id,   total: 12000,  currency: 'INR', date: m(0),  ref: 'MKT/IG/001' },
      { name: 'Espresso Machine Service',    expenseCategory: ecMaint._id, total: 8500,   currency: 'INR', date: m(-1), ref: 'MAINT/001' },
      { name: 'Oat Milk Stock',              expenseCategory: ecRaw._id,   total: 6800,   currency: 'INR', date: m(0),  ref: 'RM/MILK/001' },
      { name: 'Office Supplies',             expenseCategory: ecMisc._id,  total: 3200,   currency: 'INR', date: m(0),  ref: 'MISC/001' },
      { name: 'Google Ads – March',          expenseCategory: ecMkt._id,   total: 9500,   currency: 'INR', date: m(0),  ref: 'MKT/GA/001' },
      { name: 'Office Rent – Mar',           expenseCategory: ecRent._id,  total: 45000,  currency: 'INR', date: m(0),  ref: 'RENT/MAR/25' },
      { name: 'Staff Salaries – Mar',        expenseCategory: ecPay._id,   total: 185000, currency: 'INR', date: m(0),  ref: 'SAL/MAR/25' },
    ]);
    console.log('👍 Expenses created');

    // ── Employees ──────────────────────────────────────────────────────────────
    const Employee = require('../models/appModels/Employee');
    await Employee.insertMany([
      { name: 'Prashanth', surname: 'Reddy',   position: 'CEO & Founder',       department: 'Management',   email: 'prashanth@coffeewithcorporates.com', phone: '+91-98765-00001', country: 'IN', status: 'active' },
      { name: 'Sneha',     surname: 'Kulkarni', position: 'Head Barista',        department: 'Operations',   email: 'sneha@coffeewithcorporates.com',     phone: '+91-98765-00002', country: 'IN', status: 'active' },
      { name: 'Kiran',     surname: 'Rao',      position: 'Sales Manager',       department: 'Sales',        email: 'kiran@coffeewithcorporates.com',     phone: '+91-98765-00003', country: 'IN', status: 'active' },
      { name: 'Meera',     surname: 'Iyer',     position: 'Finance Manager',     department: 'Finance',      email: 'meera@coffeewithcorporates.com',     phone: '+91-98765-00004', country: 'IN', status: 'active' },
      { name: 'Rahul',     surname: 'Gupta',    position: 'Marketing Lead',      department: 'Marketing',    email: 'rahul@coffeewithcorporates.com',     phone: '+91-98765-00005', country: 'IN', status: 'active' },
      { name: 'Divya',     surname: 'Sharma',   position: 'Barista',             department: 'Operations',   email: 'divya@coffeewithcorporates.com',     phone: '+91-98765-00006', country: 'IN', status: 'active' },
      { name: 'Suresh',    surname: 'Pillai',   position: 'IT Support',          department: 'Technology',   email: 'suresh@coffeewithcorporates.com',    phone: '+91-98765-00007', country: 'IN', status: 'active' },
      { name: 'Lakshmi',   surname: 'Nair',     position: 'Customer Success',    department: 'Sales',        email: 'lakshmi@coffeewithcorporates.com',   phone: '+91-98765-00008', country: 'IN', status: 'active' },
    ]);
    console.log('👍 Employees created');

    // ── Inventory ──────────────────────────────────────────────────────────────
    const Inventory = require('../models/appModels/Inventory');
    await Inventory.insertMany([
      { product: 'La Marzocco Linea Mini',    quantity: 3,   unitPrice: 45000, sku: 'EQP-LM-001', category: 'Brewing Equipment', location: 'Warehouse A', notes: 'For corporate installs' },
      { product: 'Baratza Encore Grinder',    quantity: 8,   unitPrice: 8500,  sku: 'EQP-BG-001', category: 'Brewing Equipment', location: 'Warehouse A' },
      { product: 'Hario V60 Dripper',         quantity: 25,  unitPrice: 1200,  sku: 'EQP-HV-001', category: 'Brewing Equipment', location: 'Shelf B1' },
      { product: 'AeroPress Coffee Maker',    quantity: 15,  unitPrice: 2800,  sku: 'EQP-AP-001', category: 'Brewing Equipment', location: 'Shelf B2' },
      { product: 'Coorg Single Origin 250g',  quantity: 150, unitPrice: 550,   sku: 'BEA-CSO-001', category: 'Coffee Beans',    location: 'Cold Store' },
      { product: 'House Blend 500g',          quantity: 200, unitPrice: 850,   sku: 'BEA-HB-001',  category: 'Coffee Beans',    location: 'Cold Store' },
      { product: 'Ethiopian Yirgacheffe 250g',quantity: 80,  unitPrice: 780,   sku: 'BEA-EY-001',  category: 'Coffee Beans',    location: 'Cold Store', notes: 'Limited seasonal stock' },
      { product: 'Whole Milk 1L',             quantity: 500, unitPrice: 68,    sku: 'MLK-WM-001',  category: 'Milk & Dairy',    location: 'Refrigerator 1' },
      { product: 'Oat Milk 1L',              quantity: 300, unitPrice: 145,   sku: 'MLK-OM-001',  category: 'Milk & Dairy',    location: 'Refrigerator 2' },
      { product: 'Double-Wall Cups 12oz (50)',quantity: 40,  unitPrice: 320,   sku: 'PKG-DW-001',  category: 'Packaging',       location: 'Shelf C1' },
      { product: 'Flat Lids 100',             quantity: 30,  unitPrice: 180,   sku: 'PKG-FL-001',  category: 'Packaging',       location: 'Shelf C1' },
      { product: 'Vanilla Syrup 750ml',       quantity: 60,  unitPrice: 420,   sku: 'SYR-VAN-001', category: 'Supplies',        location: 'Shelf D1' },
      { product: 'Caramel Syrup 750ml',       quantity: 55,  unitPrice: 420,   sku: 'SYR-CAR-001', category: 'Supplies',        location: 'Shelf D1' },
    ]);
    console.log('👍 Inventory created');

    // ── Orders ─────────────────────────────────────────────────────────────────
    const Order = require('../models/appModels/Order');
    await Order.insertMany([
      { orderId: 'ORD-2025-001', products: 'La Marzocco Linea Mini x2', quantity: 2, price: 90000,  status: 'delivered',   client: clients[0]._id, date: m(-1), createdBy: adminResult._id },
      { orderId: 'ORD-2025-002', products: 'Coffee Beans Bulk Pack',    quantity: 5, price: 4250,   status: 'shipped',     client: clients[1]._id, date: m(0),  createdBy: adminResult._id },
      { orderId: 'ORD-2025-003', products: 'AeroPress + Grinder Bundle',quantity: 3, price: 11300,  status: 'in progress', client: clients[2]._id, date: m(0),  createdBy: adminResult._id },
      { orderId: 'ORD-2025-004', products: 'Oat Milk Monthly Supply',   quantity: 50, price: 7250,  status: 'pending',     client: clients[3]._id, date: m(0),  createdBy: adminResult._id },
      { orderId: 'ORD-2025-005', products: 'Starter Kit – V60 + Beans', quantity: 10, price: 17500, status: 'completed',   client: clients[4]._id, date: m(-1), createdBy: adminResult._id },
      { orderId: 'ORD-2025-006', products: 'Syrup Variety Pack',        quantity: 20, price: 8400,  status: 'pending',     client: clients[5]._id, date: m(0),  createdBy: adminResult._id },
      { orderId: 'ORD-2025-007', products: 'Corporate Espresso Package', quantity: 1, price: 52000, status: 'in progress', client: clients[6]._id, date: m(0),  createdBy: adminResult._id },
    ]);
    console.log('👍 Orders created');

    // ── Done ───────────────────────────────────────────────────────────────────
    console.log('');
    console.log('🥳 Setup complete!');
    console.log('────────────────────────────────');
    console.log('  Email:    admin@demo.com');
    console.log('  Password: admin123');
    console.log('────────────────────────────────');
    process.exit(0);
  } catch (e) {
    console.error('\n🚫 Setup failed:', e.message || e);
    console.error(e);
    process.exit(1);
  }
}

setupApp();
