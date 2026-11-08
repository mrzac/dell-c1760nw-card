class DellC1760nwCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = Object.assign({
      name: 'Dell C1760nw',
      warning_threshold: 15,
      critical_threshold: 5,
      ip_address: '',
      entity_cyan: '',
      entity_magenta: '',
      entity_yellow: '',
      entity_black: '',
      entity_status: '',
      entity_counter: ''
    }, config);
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  _getValue(entityId) {
    if (!entityId || !this._hass.states[entityId]) return null;
    return this._hass.states[entityId].state;
  }

  _isOffline(status) {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'off' || s === 'offline' || s === 'unavailable' || s === 'unknown' || s === 'hors ligne' || s === 'éteint';
  }

  render() {
    if (!this._config || !this._hass) return;

    const statusVal = this._getValue(this._config.entity_status) || 'Unknown';
    const isOffline = this._isOffline(statusVal);

    const cyanVal = parseFloat(this._getValue(this._config.entity_cyan)) || 0;
    const magentaVal = parseFloat(this._getValue(this._config.entity_magenta)) || 0;
    const yellowVal = parseFloat(this._getValue(this._config.entity_yellow)) || 0;
    const blackVal = parseFloat(this._getValue(this._config.entity_black)) || 0;
    const counterVal = this._getValue(this._config.entity_counter) || 'N/A';

    const toners = [
      { name: 'Cyan', val: cyanVal, color: '#00bcd4' },
      { name: 'Magenta', val: magentaVal, color: '#e91e63' },
      { name: 'Yellow', val: yellowVal, color: '#ffeb3b' },
      { name: 'Black', val: blackVal, color: '#424242' }
    ];

    const getTonerColor = (item) => {
      if (item.val <= this._config.critical_threshold) return 'var(--error-color, #f44336)';
      if (item.val <= this._config.warning_threshold) return 'var(--warning-color, #ff9800)';
      return item.color;
    };

    const webUrl = this._config.ip_address 
      ? (this._config.ip_address.startsWith('http') ? this._config.ip_address : `http://${this._config.ip_address}`)
      : null;

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, none);
          background: var(--ha-card-background, var(--card-background-color, #fff));
          font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
          transition: all 0.3s ease;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: ${isOffline ? '0' : '16px'};
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--secondary-background-color, rgba(0,0,0,0.05));
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${isOffline ? 'var(--disabled-text-color, #9e9e9e)' : 'var(--primary-color, #03a9f4)'};
        }
        .title-container {
          display: flex;
          flex-direction: column;
        }
        .title {
          font-weight: 600;
          font-size: 16px;
          color: var(--primary-text-color);
        }
        .subtitle {
          font-size: 12px;
          color: var(--secondary-text-color);
        }
        .web-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 8px;
          background: var(--secondary-background-color, rgba(0,0,0,0.05));
          color: var(--primary-text-color);
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .web-btn:hover {
          background: var(--divider-color, rgba(0,0,0,0.1));
        }
        .toner-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .toner-item {
          background: var(--secondary-background-color, rgba(0,0,0,0.03));
          padding: 10px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .toner-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 500;
        }
        .toner-bar-bg {
          height: 8px;
          width: 100%;
          background: var(--divider-color, rgba(0,0,0,0.1));
          border-radius: 4px;
          overflow: hidden;
        }
        .toner-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
          font-size: 12px;
          color: var(--secondary-text-color);
        }
      </style>

      <ha-card>
        <div class="header">
          <div class="header-left">
            <div class="icon-container">
              <ha-icon icon="${isOffline ? 'mdi:printer-off' : 'mdi:printer'}"></ha-icon>
            </div>
            <div class="title-container">
              <span class="title">${this._config.name}</span>
              <span class="subtitle">Statut: ${statusVal}</span>
            </div>
          </div>
          ${webUrl ? `
            <a class="web-btn" href="${webUrl}" target="_blank" rel="noopener noreferrer">
              <span>Web UI</span>
              <ha-icon icon="mdi:open-in-new" style="--mdc-icon-size: 14px;"></ha-icon>
            </a>
          ` : ''}
        </div>

        ${!isOffline ? `
          <div class="toner-grid">
            ${toners.map(t => `
              <div class="toner-item">
                <div class="toner-info">
                  <span>${t.name}</span>
                  <span>${t.val}%</span>
                </div>
                <div class="toner-bar-bg">
                  <div class="toner-bar-fill" style="width: ${Math.min(100, Math.max(0, t.val))}%; background-color: ${getTonerColor(t)};"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <span>Pages imprimées</span>
            <strong>${counterVal}</strong>
          </div>
        ` : ''}
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement('dell-c1760nw-card-editor');
  }

  static getStubConfig() {
    return {
      name: 'Dell C1760nw',
      warning_threshold: 15,
      critical_threshold: 5,
      ip_address: '192.168.1.100',
      entity_cyan: '',
      entity_magenta: '',
      entity_yellow: '',
      entity_black: '',
      entity_status: '',
      entity_counter: ''
    };
  }
}

class DellC1760nwCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const configValue = target.configValue;
    const value = target.value;

    if (this._config[configValue] === value) return;

    const newConfig = Object.assign({}, this._config);
    if (value === '') {
      delete newConfig[configValue];
    } else {
      newConfig[configValue] = target.type === 'number' ? parseFloat(value) : value;
    }

    const event = new Event('config-changed', {
      bubbles: true,
      composed: true
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }

  render() {
    if (!this._hass || !this._config) return;

    this.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 8px 0;">
        <paper-input label="Nom de la carte" .value="${this._config.name || ''}" .configValue="${'name'}"></paper-input>
        <paper-input label="Adresse IP (ex: 192.168.1.50)" .value="${this._config.ip_address || ''}" .configValue="${'ip_address'}"></paper-input>
        
        <div style="display: flex; gap: 10px;">
          <paper-input style="flex:1" label="Seuil d'avertissement (%)" type="number" .value="${this._config.warning_threshold ?? 15}" .configValue="${'warning_threshold'}"></paper-input>
          <paper-input style="flex:1" label="Seuil critique (%)" type="number" .value="${this._config.critical_threshold ?? 5}" .configValue="${'critical_threshold'}"></paper-input>
        </div>

        <ha-entity-picker label="Entité Statut Imprimante" .hass="${this._hass}" .value="${this._config.entity_status || ''}" .configValue="${'entity_status'}" allow-custom-entity></ha-entity-picker>
        <ha-entity-picker label="Entité Compteur de Pages" .hass="${this._hass}" .value="${this._config.entity_counter || ''}" .configValue="${'entity_counter'}" allow-custom-entity></ha-entity-picker>
        
        <ha-entity-picker label="Toner Cyan" .hass="${this._hass}" .value="${this._config.entity_cyan || ''}" .configValue="${'entity_cyan'}" allow-custom-entity></ha-entity-picker>
        <ha-entity-picker label="Toner Magenta" .hass="${this._hass}" .value="${this._config.entity_magenta || ''}" .configValue="${'entity_magenta'}" allow-custom-entity></ha-entity-picker>
        <ha-entity-picker label="Toner Yellow" .hass="${this._hass}" .value="${this._config.entity_yellow || ''}" .configValue="${'entity_yellow'}" allow-custom-entity></ha-entity-picker>
        <ha-entity-picker label="Toner Black" .hass="${this._hass}" .value="${this._config.entity_black || ''}" .configValue="${'entity_black'}" allow-custom-entity></ha-entity-picker>
      </div>
    `;

    this.querySelectorAll('paper-input, ha-entity-picker').forEach(element => {
      element.addEventListener('value-changed', this._valueChanged.bind(this));
      element.addEventListener('change', this._valueChanged.bind(this));
    });
  }
}

customElements.define('dell-c1760nw-card-editor', DellC1760nwCardEditor);
customElements.define('dell-c1760nw-card', DellC1760nwCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'dell-c1760nw-card',
  name: 'Dell C1760nw Card',
  description: 'Carte moderne pour imprimante Dell C1760nw (Style Tile/Mushroom avec éditeur visual GUI)'
});