const { isValidPhone } = require('./utils');

class LeadService {
  constructor(store) {
    this.store = store;
    this.activeKey = 'active-leads.json';
    this.leadsKey = 'leads.json';
    this.active = new Map(Object.entries(this.store.read(this.activeKey, {})));
    this.leads = this.store.read(this.leadsKey, []);
  }

  persistActive() {
    this.store.write(this.activeKey, Object.fromEntries(this.active.entries()));
  }

  persistLeads() {
    this.store.write(this.leadsKey, this.leads);
  }

  start(chatId, context = {}) {
    this.active.set(String(chatId), { step: 'name', createdAt: new Date().toISOString(), context });
    this.persistActive();
  }

  get(chatId) {
    return this.active.get(String(chatId));
  }

  clear(chatId) {
    this.active.delete(String(chatId));
    this.persistActive();
  }

  handle(chatId, text) {
    const lead = this.get(chatId);
    if (!lead) {
      return null;
    }

    if (lead.step === 'name') {
      lead.name = text;
      lead.step = 'phone';
      this.active.set(String(chatId), lead);
      this.persistActive();
      return { done: false, reply: 'Please share your phone number with country code if possible.' };
    }

    if (lead.step === 'phone') {
      if (!isValidPhone(text)) {
        return { done: false, reply: 'That phone number looks invalid. Please send a valid number, for example +919876543210.' };
      }
      lead.phone = text;
      lead.step = 'interest';
      this.active.set(String(chatId), lead);
      this.persistActive();
      return { done: false, reply: 'Great. Which property, location, or requirement are you interested in?' };
    }

    if (lead.step === 'interest') {
      lead.interest = text;
      lead.completedAt = new Date().toISOString();
      this.leads.push(lead);
      this.persistLeads();
      this.clear(chatId);
      return { done: true, lead };
    }

    return null;
  }
}

module.exports = {
  LeadService
};
