/** Core type definitions for ApnaKhata */

export interface Business {
    id: string;
    phone: string;
    name?: string;
    ownerName?: string;
    type?: string;
    language: string;
    gstin?: string;
    createdAt: string;
}

export interface Customer {
    id: string;
    businessId: string;
    name: string;
    phone?: string;
    totalUdhar: number;
    createdAt: string;
    lastTransaction?: string;
    transactionCount?: number;
    transactions?: Transaction[];
}

export type TransactionType = 'credit' | 'cash' | 'expense' | 'udhar_payment' | 'unknown';
export type SourceType = 'ocr' | 'voice' | 'manual' | 'whatsapp';

export interface Transaction {
    id: string;
    businessId: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    itemName?: string;
    quantity?: number;
    unit?: string;
    price: number;
    type: TransactionType;
    date: string;
    aiConfidence?: number;
    confidence?: number; // For OCR response compatibility
    sourceType?: SourceType;
    sourceImageUrl?: string;
    rawText?: string;
    isConfirmed: boolean;
    createdAt: string;
}

export interface ParsedTransaction {
    customer_name: string | null;
    item_name: string | null;
    quantity: number | null;
    unit: string | null;
    price: number | null;
    transaction_type: TransactionType;
    date: string | null;
    confidence: number;
    raw_text: string;
}

export interface DashboardStats {
    todaySales: number;
    totalUdhar: number;
    thisWeek: number;
}

export interface TopItem {
    name: string;
    units: number;
    revenue: number;
}

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    itemName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    businessId: string;
    business?: Business | null;
    customerName: string;
    customerPhone?: string | null;
    customerAddress?: string | null;
    items: InvoiceItem[];
    subtotal: number;
    gstRate: number;
    gstAmount: number;
    totalAmount: number;
    notes?: string | null;
    invoiceDate: string;
    createdAt: string;
}

export type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    LanguageSelect: undefined;
    OTPLogin: undefined;
    MainTabs: undefined;
    VoiceInput: undefined;
    CameraScan: undefined;
    ReviewOCR: { receiptData?: any; imageUrl?: string; transcript?: string };
    ManualEntry: { prefilledData?: { customerName: string; itemName: string; price: number; type: 'cash' | 'credit' | 'expense' } };
    CustomerDetail: { customerId: string; customerName?: string; customerPhone?: string };
    EditTransaction: { transaction: Transaction };
    UdharPayment: undefined;
    BusinessProfile: undefined;
    Subscription: undefined;
    Upgrade: undefined;
    NotificationSettings: undefined;
    Purchases: undefined;
    AddPurchase: undefined;
    PurchaseSummary: undefined;
    UnitConversions: undefined;
    WholesaleList: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Customers: undefined;
    Purchases: undefined;
    Invoices: undefined;
    Reports: undefined;
    Settings: undefined;
};

export type InvoiceStackParamList = {
    InvoiceList: undefined;
    CreateInvoice: undefined;
    InvoiceDetail: { invoiceId: string };
};

