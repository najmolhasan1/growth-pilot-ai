/**
 * GrowthPilot 2.0 / Markopolo Data Persistence Layer
 * Hybrid Client LocalStorage & Server Sync Engine
 */

export interface GP2Lead {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  productName: string;
  cartTotal: number;
  intentScore: number;
  status: 'Pending' | 'Contacted' | 'Confirmed' | 'Cancelled';
  createdAt: string;
  courierRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface GP2CatalogItem {
  id: string;
  sku: string;
  name: string;
  cost: number;
  price: number;
  margin: number;
  stock: number;
  category?: string;
}

export interface GP2SavedCampaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok';
  productName: string;
  dailyBudget: number;
  currency: string;
  status: 'Draft' | 'Active' | 'Paused';
  createdAt: string;
  adSetsCount: number;
  data: any;
}

export interface GP2TrackingEvent {
  id: string;
  eventName: string;
  eventSourceUrl: string;
  timestamp: string;
  emqScore: number;
  message: string;
  userDataPreview: string;
  rawPayload?: any;
}

export interface GP2IntegrationsConfig {
  metaPixelId?: string;
  metaAccessToken?: string;
  metaTestEventCode?: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  pathaoApiKey?: string;
  steadfastApiKey?: string;
  shopifyStoreUrl?: string;
}

const STORAGE_KEYS = {
  LEADS: 'gp2_leads_data',
  CATALOG: 'gp2_catalog_data',
  CAMPAIGNS: 'gp2_campaigns_data',
  EVENTS: 'gp2_events_data',
  CONFIG: 'gp2_integrations_config',
};

// Initial default seed leads
const DEFAULT_LEADS: GP2Lead[] = [
  {
    id: 'lead_101',
    customerName: 'Tanvir Ahmed',
    phone: '01711223344',
    city: 'Mirpur, Dhaka',
    productName: 'Ultra AMOLED Smartwatch',
    cartTotal: 2450,
    intentScore: 92,
    status: 'Pending',
    createdAt: '12 mins ago',
    courierRisk: 'LOW',
  },
  {
    id: 'lead_102',
    customerName: 'Nusrat Jahan',
    phone: '01822334455',
    city: 'Nasirabad, Chittagong',
    productName: 'ANC Wireless Earbuds Pro',
    cartTotal: 1890,
    intentScore: 78,
    status: 'Contacted',
    createdAt: '35 mins ago',
    courierRisk: 'LOW',
  },
  {
    id: 'lead_103',
    customerName: 'Rafiqul Islam',
    phone: '01933445566',
    city: 'Kazir Dewri, Sylhet',
    productName: '20000mAh 65W Fast Powerbank',
    cartTotal: 2600,
    intentScore: 64,
    status: 'Pending',
    createdAt: '1 hour ago',
    courierRisk: 'MEDIUM',
  },
];

// Initial default catalog SKUs
const DEFAULT_CATALOG: GP2CatalogItem[] = [
  {
    id: 'sku_1',
    sku: 'WAT-01',
    name: 'Ultra AMOLED Smartwatch',
    cost: 1200,
    price: 2450,
    margin: 51,
    stock: 45,
    category: 'Wearables',
  },
  {
    id: 'sku_2',
    sku: 'AUD-02',
    name: 'ANC Wireless Earbuds Pro',
    cost: 850,
    price: 1890,
    margin: 55,
    stock: 80,
    category: 'Audio',
  },
  {
    id: 'sku_3',
    sku: 'PWR-03',
    name: '20000mAh 65W Fast Powerbank',
    cost: 1400,
    price: 2600,
    margin: 46,
    stock: 22,
    category: 'Accessories',
  },
];

export const GP2Storage = {
  // Leads Management
  getLeads(): GP2Lead[] {
    if (typeof window === 'undefined') return DEFAULT_LEADS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADS);
      return data ? JSON.parse(data) : DEFAULT_LEADS;
    } catch {
      return DEFAULT_LEADS;
    }
  },
  saveLead(lead: GP2Lead) {
    if (typeof window === 'undefined') return;
    const current = this.getLeads();
    const existingIndex = current.findIndex(l => l.id === lead.id);
    let updated: GP2Lead[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = lead;
    } else {
      updated = [lead, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updated));
  },
  updateLeadStatus(leadId: string, status: GP2Lead['status']) {
    if (typeof window === 'undefined') return;
    const current = this.getLeads().map(l => (l.id === leadId ? { ...l, status } : l));
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(current));
  },
  deleteLead(leadId: string) {
    if (typeof window === 'undefined') return;
    const filtered = this.getLeads().filter(l => l.id !== leadId);
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(filtered));
  },

  // Catalog Management
  getCatalog(): GP2CatalogItem[] {
    if (typeof window === 'undefined') return DEFAULT_CATALOG;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATALOG);
      return data ? JSON.parse(data) : DEFAULT_CATALOG;
    } catch {
      return DEFAULT_CATALOG;
    }
  },
  saveCatalogItem(item: GP2CatalogItem) {
    if (typeof window === 'undefined') return;
    const current = this.getCatalog();
    const existingIndex = current.findIndex(c => c.id === item.id);
    let updated: GP2CatalogItem[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = item;
    } else {
      updated = [item, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(updated));
  },
  deleteCatalogItem(itemId: string) {
    if (typeof window === 'undefined') return;
    const filtered = this.getCatalog().filter(c => c.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(filtered));
  },

  // Campaigns Management
  getCampaigns(): GP2SavedCampaign[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveCampaign(campaign: GP2SavedCampaign) {
    if (typeof window === 'undefined') return;
    const current = this.getCampaigns();
    const updated = [campaign, ...current.filter(c => c.id !== campaign.id)];
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(updated));
  },
  deleteCampaign(campaignId: string) {
    if (typeof window === 'undefined') return;
    const filtered = this.getCampaigns().filter(c => c.id !== campaignId);
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(filtered));
  },

  // Events Log
  getEvents(): GP2TrackingEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  recordEvent(evt: GP2TrackingEvent) {
    if (typeof window === 'undefined') return;
    const current = this.getEvents();
    const updated = [evt, ...current].slice(0, 50); // keep latest 50 events
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
  },
  clearEvents() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
  },

  // Integrations Config
  getConfig(): GP2IntegrationsConfig {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  saveConfig(cfg: GP2IntegrationsConfig) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
  },
};
