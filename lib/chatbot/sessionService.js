class SessionService {
  constructor(store) {
    this.store = store;
    this.key = 'sessions.json';
    this.sessions = this.store.read(this.key, {});
  }

  get(chatId) {
    return this.sessions[String(chatId)] || {
      searchMode: false,
      preferences: {
        purpose: '',
        location: '',
        bhk: '',
        type: '',
        amenities: [],
        budget: null,
        freeText: ''
      },
      lastResults: [],
      history: []
    };
  }

  update(chatId, patch) {
    const current = this.get(chatId);
    this.sessions[String(chatId)] = {
      ...current,
      ...patch,
      preferences: {
        ...current.preferences,
        ...(patch.preferences || {}),
        amenities: patch.preferences?.amenities || current.preferences.amenities || [],
        budget: patch.preferences?.budget || current.preferences.budget || null
      },
      history: patch.history || current.history || []
    };
    this.store.write(this.key, this.sessions);
    return this.sessions[String(chatId)];
  }

  pushHistory(chatId, role, text) {
    const current = this.get(chatId);
    const history = [...(current.history || []), { role, text, at: new Date().toISOString() }];
    this.update(chatId, { history });
    return history;
  }

  getAll() {
    return this.sessions;
  }

  clear(chatId) {
    delete this.sessions[String(chatId)];
    this.store.write(this.key, this.sessions);
  }
}

module.exports = {
  SessionService
};
