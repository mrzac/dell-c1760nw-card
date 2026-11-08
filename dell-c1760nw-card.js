class DellC1760nwCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this.innerHTML = `<ha-card></ha-card>`;
      this.content = this.querySelector('ha-card');
    }

    this.render();
  }

  setConfig(config) {
    if (!config.ip_address && !config.entity_status) {
      throw new Error('Veuillez définir ip_address ou entity_status.');
    }
    this.config = {
      name: 'Dell C1760nw',
      warning_threshold: 15,
      critical_threshold: 5,
      ...config
    };
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement("dell-c1760nw-card-editor");
  }

  static getStubConfig() {
    return {
      name: "Dell C1760nw",
      ip_address: "192.168.1.50",
      entity_status: "sensor.dell_c1760nw_status",
      entity_cyan: "sensor.dell_c1760nw_cyan_toner",
      entity_magenta: "sensor.dell_c1760nw_magenta_toner",
      entity_yellow: "sensor.dell_c1760nw_yellow_toner",
      entity_black: "sensor.dell_c1760nw_black_toner",
      entity_counter: "sensor.dell_c1760nw_page_counter",
      warning_threshold: 15,
      critical_threshold: 5
    };
  }

  render() {
    if (!this._hass || !this.config) return;

    const getVal = (entityId) => {
      if (!entityId || !this._hass.states[entityId]) return null;
      return this._hass.states[entityId].state;
    };

    const statusVal = getVal(this.config.entity_status);
    const isOffline = !statusVal || 
                      ['unavailable', 'unknown', 'off', 'offline', 'hors ligne', 'eteint', 'éteint'].includes(statusVal.toLowerCase());

    const name = this.config.name || 'Dell C1760nw';
    const ip = this.config.ip_address;
    const webUrl = ip ? (ip.startsWith('http') ? ip : `http://${ip}`) : null;

    const cyan = parseInt(getVal(this.config.entity_cyan)) || 0;
    const magenta = parseInt(getVal(this.config.entity_magenta)) || 0;
    const yellow = parseInt(getVal(this.config.entity_yellow)) || 0;
    const black = parseInt(getVal(this.config.entity_black)) || 0;
    const counter = getVal(this.config.entity_counter) || '—';

    const getTonerStatusClass = (level) => {
      if (level <= (this.config.critical_threshold || 5)) return 'critical';
      if (level <= (this.config.warning_threshold || 15)) return 'warning';
      return 'normal';
    };

    this.content.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
          box-sizing: border-box;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--secondary-background-color, #f4f5f7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--state-icon-color, #44739e);
        }
        .icon-avatar.offline {
          color: var(--disabled-text-color, #9e9e9e);
          background: var(--divider-color, #e0e0e0);
        }
        .title-container {
          display: flex;
          flex-direction: column;
        }
        .title {
          font-weight: 600;
          font-size: 15px;
          color: var(--primary-text-color);
          line-height: 1.2;
        }
        .subtitle {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 2px;
        }
        .badge-status {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }
        .badge-status.online {
          background: rgba(76, 175, 80, 0.15);
          color: #2e7d32;
        }
        .badge-status.offline {
          background: rgba(158, 158, 158, 0.15);
          color: #616161;
        }
        .web-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          color: var(--primary-text-color);
          background: var(--secondary-background-color, #f0f0f0);
          text-decoration: none;
          transition: background 0.2s ease;
        }
        .web-btn:hover {
          background: var(--divider-color, #e0e0e0);
        }
        
        /* Dynamic Content */
        .toners-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        .toner-card {
          background: var(--secondary-background-color, #f9f9f9);
          padding: 10px 12px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border: 1px solid transparent;
        }
        .toner-card.warning {
          border-color: #ffa726;
          background: rgba(255, 167, 38, 0.08);
        }
        .toner-card.critical {
          border-color: #ef5350;
          background: rgba(239, 83, 80, 0.12);
        }
        .toner-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        .toner-val.critical {
          color: #d32f2f;
          font-weight: 700;
        }
        .toner-val.warning {
          color: #f57c00;
          font-weight: 700;
        }
        .progress-bar-bg {
          height: 8px;
          width: 100%;
          background: var(--divider-color, #e0e0e0);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .footer-info {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid var(--divider-color, #eee);
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--secondary-text-color);
        }
      </style>

      <div class="header">
        <div class="header-left">
          <div class="icon-avatar ${isOffline ? 'offline' : ''}">
            <ha-icon icon="mdi:printer"></ha-icon>
          </div>
          <div class="title-container">
            <span class="title">${name}</span>
            <span class="subtitle">
              <span class="badge-status ${isOffline ? 'offline' : 'online'}">
                ${isOffline ? 'Hors Ligne' : (statusVal || 'En Ligne')}
              </span>
            </span>
          </div>
        </div>

        ${webUrl ? `
          <a href="${webUrl}" target="_blank" rel="noreferrer" class="web-btn" title="Ouvrir l'interface Web">
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
        ` : ''}
      </div>

      ${!isOffline ? `
        <div class="toners-grid">
          ${this._renderToner('Cyan', cyan, '#00bcd4', getTonerStatusClass(cyan))}
          ${this._renderToner('Magenta', magenta, '#e91e63', getTonerStatusClass(magenta))}
          ${this._renderToner('Yellow', yellow, '#fbc02d', getTonerStatusClass(yellow))}
          ${this._renderToner('Black', black, '#212121', getTonerStatusClass(black))}
        </div>

        <div class="footer-info">
          <span>Pages imprimées</span>
          <strong>${counter}</strong>
        </div>
      ` : ''}
    `;
  }

  _renderToner(label, value, color, statusClass) {
    return `
      <div class="toner-card ${statusClass}">
        <div class="toner-header">
          <span>${label}</span>
          <span class="toner-val ${statusClass}">${value}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${value}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }
}

// -------------------------------------------------------------------
// Éditeur Visuel Lovelace (Visual GUI Editor)
// -------------------------------------------------------------------
class DellC1760nwCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.rendered) {
      this.render();
    }
  }

  render() {
    if (!this._hass) return;
    this.rendered = true;

    this.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 8px 0;">
        <ha-textfield label="Nom de la carte" .value="${this._config.name || ''}" data-config="name"></ha-textfield>
        <ha-textfield label="Adresse IP (ex: 192.168.1.50)" .value="${this._config.ip_address || ''}" data-config="ip_address"></ha-textfield>
        
        <ha-entity-picker .hass="${this._hass}" .value="${this._config.entity_status || ''}" label="Entité Statut" data-config="entity_status"></ha-entity-picker>
        <ha-entity-picker .hass="${this._hass}" .value="${this._config.entity_cyan || ''}" label="Toner Cyan (%)" data-config="entity_cyan"></ha-entity-picker>
        <ha-entity-picker .hass="${this._hass}" .value="${this._config.entity_magenta || ''}" label="Toner Magenta (%)" data-config="entity_magenta"></ha-entity-picker>
        <ha-entity-picker .hass="${this._hass}" .value="${this._config.entity_yellow || ''}" label="Toner Yellow (%)" data-config="entity_yellow"></ha-entity-picker>
        <ha-entity-picker .hass="${this._hass}" .value="${this._config.entity_black || ''}" label="Toner Black (%)" data-config="entity_black"></ha-entity-picker>
        <ha-entity-picker .hass="${this._hass}" .value="${this._config.entity_counter || ''}" label="Compteur de pages" data-config="entity_counter"></ha-entity-picker>
        
        <div style="display: flex; gap: 12px;">
          <ha-textfield type="number" label="Seuil Avertissement (%)" .value="${this._config.warning_threshold ?? 15}" data-config="warning_threshold"></ha-textfield>
          <ha-textfield type="number" label="Seuil Critique (%)" .value="${this._config.critical_threshold ?? 5}" data-config="critical_threshold"></ha-textfield>
        </div>
      </div>
    `;

    this.querySelectorAll('ha-textfield, ha-entity-picker').forEach(input => {
      input.addEventListener('change', this._valueChanged.bind(this));
      input.addEventListener('value-changed', this._valueChanged.bind(this));
    });
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const configKey = target.getAttribute('data-config');
    let value = ev.detail?.value !== undefined ? ev.detail.value : target.value;

    if (configKey === 'warning_threshold' || configKey === 'critical_threshold') {
      value = parseInt(value, 10);
    }

    if (this._config[configKey] === value) return;

    this._config = {
      ...this._config,
      [configKey]: value
    };

    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

customElements.define("dell-c1760nw-card-editor", DellC1760nwCardEditor);
customElements.define("dell-c1760nw-card", DellC1760nwCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "dell-c1760nw-card",
  name: "Dell C1760nw Card",
  description: "Carte sur-mesure d'inspiration Mushroom/Tile pour imprimante Dell C1760nw.",
  preview: true
});