class DellC1760nwCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = Object.assign({
      name: 'Dell C1760nw',
      ip_address: '',
      low_toner_threshold: 15,
    }, config);
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateCard();
  }

  static async getConfigElement() {
    return document.createElement('dell-c1760nw-card-editor');
  }

  static getStubConfig() {
    return {
      name: 'Dell C1760nw',
      ip_address: '192.168.1.50',
      status_entity: 'sensor.dell_c1760nw_status',
      toner_black_entity: 'sensor.dell_c1760nw_black_toner',
      toner_cyan_entity: 'sensor.dell_c1760nw_cyan_toner',
      toner_magenta_entity: 'sensor.dell_c1760nw_magenta_toner',
      toner_yellow_entity: 'sensor.dell_c1760nw_yellow_toner',
      low_toner_threshold: 15,
    };
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0px 2px 4px rgba(0,0,0,0.1));
          background: var(--ha-card-background, var(--card-background-color, #fff));
          font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-container {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(var(--rgb-primary-color, 33, 150, 243), 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color, #2196f3);
        }
        .title {
          font-weight: 600;
          font-size: 16px;
          line-height: 1.2;
        }
        .subtitle {
          font-size: 12px;
          color: var(--secondary-text-color, #727272);
        }
        .web-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 18px;
          background: var(--secondary-background-color, #f4f4f5);
          color: var(--primary-text-color, #212121);
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: background 0.2s ease;
        }
        .web-button:hover {
          background: rgba(var(--rgb-primary-color, 33, 150, 243), 0.15);
          color: var(--primary-color, #2196f3);
        }
        .toner-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .toner-tile {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--secondary-background-color, #f8f9fa);
          border: 1px solid rgba(0,0,0,0.05);
          position: relative;
          overflow: hidden;
        }
        .toner-tile.critical {
          border-color: var(--error-color, #f44336);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(244, 67, 54, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
        }
        .toner-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 500;
        }
        .toner-label {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(0,0,0,0.08);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
      </style>

      <ha-card>
        <div class="header">
          <div class="header-title">
            <div class="icon-container">
              <ha-icon icon="mdi:printer"></ha-icon>
            </div>
            <div>
              <div class="title" id="card-name">Dell C1760nw</div>
              <div class="subtitle" id="printer-status">Inconnu</div>
            </div>
          </div>
          <a id="web-link" href="#" target="_blank" class="web-button" style="display:none;">
            <ha-icon icon="mdi:web" style="--mdc-icon-size: 16px;"></ha-icon>
            <span>Web</span>
          </a>
        </div>

        <div class="toner-grid" id="toner-container">
          <!-- Toners générés dynamiquement -->
        </div>
      </ha-card>
    `;
  }

  updateCard() {
    if (!this._hass || !this._config) return;

    // Nom et IP
    this.shadowRoot.getElementById('card-name').textContent = this._config.name || 'Dell C1760nw';
    const webLink = this.shadowRoot.getElementById('web-link');
    if (this._config.ip_address) {
      webLink.href = this._config.ip_address.startsWith('http') ? this._config.ip_address : `http://${this._config.ip_address}`;
      webLink.style.display = 'inline-flex';
    } else {
      webLink.style.display = 'none';
    }

    // Statut
    const statusEntity = this._hass.states[this._config.status_entity];
    const statusText = statusEntity ? statusEntity.state : 'Hors ligne';
    this.shadowRoot.getElementById('printer-status').textContent = statusText;

    // Configuration des toners (Black, Cyan, Magenta, Yellow)
    const toners = [
      { key: 'black', name: 'Noir', entity: this._config.toner_black_entity, color: '#212121' },
      { key: 'cyan', name: 'Cyan', entity: this._config.toner_cyan_entity, color: '#00bcd4' },
      { key: 'magenta', name: 'Magenta', entity: this._config.toner_magenta_entity, color: '#e91e63' },
      { key: 'yellow', name: 'Jaune', entity: this._config.toner_yellow_entity, color: '#ffeb3b' }
    ];

    const container = this.shadowRoot.getElementById('toner-container');
    container.innerHTML = '';

    toners.forEach(t => {
      const stateObj = this._hass.states[t.entity];
      const level = stateObj ? parseFloat(stateObj.state) || 0 : 0;
      const isCritical = level <= (this._config.low_toner_threshold || 15);
      const fillColor = isCritical ? 'var(--error-color, #f44336)' : t.color;

      const tile = document.createElement('div');
      tile.className = `toner-tile ${isCritical ? 'critical' : ''}`;
      tile.innerHTML = `
        <div class="toner-info">
          <span class="toner-label">
            <span class="color-dot" style="background: ${t.color}"></span>
            ${t.name}
          </span>
          <span>${level}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${level}%; background: ${fillColor};"></div>
        </div>
      `;
      container.appendChild(tile);
    });
  }
}

// -----------------------------------------------------------------------------
// Visual GUI Editor Component (Support complet de l'éditeur graphique Lovelace)
// -----------------------------------------------------------------------------
class DellC1760nwCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this.shadowRoot.querySelector('ha-entity-picker')) {
      const pickers = this.shadowRoot.querySelectorAll('ha-entity-picker');
      pickers.forEach(p => p.hass = hass);
    }
  }

  render() {
    if (this._rendered) return;
    this._rendered = true;
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        .form { display: flex; flex-direction: column; gap: 12px; padding: 10px 0; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        label { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); }
        input {
          padding: 8px; border-radius: 4px;
          border: 1px solid var(--divider-color, #ccc);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
        }
      </style>
      <div class="form">
        <div class="field">
          <label>Titre de la carte</label>
          <input type="text" id="name" value="${this._config.name || ''}" placeholder="Dell C1760nw">
        </div>
        <div class="field">
          <label>Adresse IP (Interface Web)</label>
          <input type="text" id="ip_address" value="${this._config.ip_address || ''}" placeholder="192.168.1.50">
        </div>
        <div class="field">
          <label>Seuil d'alerte Toner Bas (%)</label>
          <input type="number" id="low_toner_threshold" value="${this._config.low_toner_threshold || 15}">
        </div>
        <div class="field">
          <label>Entité Statut Imprimante</label>
          <ha-entity-picker id="status_entity" .value="${this._config.status_entity || ''}" .hass="${this._hass}"></ha-entity-picker>
        </div>
        <div class="field">
          <label>Toner Noir</label>
          <ha-entity-picker id="toner_black_entity" .value="${this._config.toner_black_entity || ''}" .hass="${this._hass}"></ha-entity-picker>
        </div>
        <div class="field">
          <label>Toner Cyan</label>
          <ha-entity-picker id="toner_cyan_entity" .value="${this._config.toner_cyan_entity || ''}" .hass="${this._hass}"></ha-entity-picker>
        </div>
        <div class="field">
          <label>Toner Magenta</label>
          <ha-entity-picker id="toner_magenta_entity" .value="${this._config.toner_magenta_entity || ''}" .hass="${this._hass}"></ha-entity-picker>
        </div>
        <div class="field">
          <label>Toner Jaune</label>
          <ha-entity-picker id="toner_yellow_entity" .value="${this._config.toner_yellow_entity || ''}" .hass="${this._hass}"></ha-entity-picker>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => this._valueChanged(e));
    });
    this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(picker => {
      picker.addEventListener('value-changed', (e) => this._valueChanged(e));
    });
  }

  _valueChanged(ev) {
    if (!this._config) return;
    const target = ev.target;
    const id = target.id;
    const value = ev.detail ? ev.detail.value : target.value;

    if (this._config[id] === value) return;

    const newConfig = { ...this._config, [id]: value };
    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

customElements.define('dell-c1760nw-card-editor', DellC1760nwCardEditor);
customElements.define('dell-c1760nw-card', DellC1760nwCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'dell-c1760nw-card',
  name: 'Dell C1760nw Card',
  description: 'Carte moderne style Tile/Mushroom avec suivi des toners, alertes et lien Web',
  preview: true,
});