class DellC1760nwCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this.innerHTML = `<ha-card></ha-card>`;
      this.content = this.querySelector('ha-card');
    }
    this.updateView();
  }

  setConfig(config) {
    this.config = {
      title: 'Dell C1760nw',
      warning_threshold: 15,
      critical_threshold: 5,
      ...config
    };
  }

  getCardSize() {
    return 3;
  }

  static async getConfigElement() {
    return document.createElement('dell-c1760nw-card-editor');
  }

  static getStubConfig() {
    return {
      title: 'Dell C1760nw',
      ip_address: '192.168.1.50',
      status_entity: '',
      cyan_entity: '',
      magenta_entity: '',
      yellow_entity: '',
      black_entity: '',
      warning_threshold: 15,
      critical_threshold: 5
    };
  }

  updateView() {
    if (!this._hass || !this.config) return;

    const statusState = this.config.status_entity ? this._hass.states[this.config.status_entity] : null;
    const statusText = statusState ? statusState.state : 'Inconnu';
    const isOnline = statusState && !['unavailable', 'offline', 'off'].includes(statusState.state.toLowerCase());

    const toners = [
      { name: 'Cyan', color: '#00bcd4', entity: this.config.cyan_entity },
      { name: 'Magenta', color: '#e91e63', entity: this.config.magenta_entity },
      { name: 'Jaune', color: '#ffeb3b', entity: this.config.yellow_entity },
      { name: 'Noir', color: '#333333', entity: this.config.black_entity }
    ];

    let tonersHtml = '';

    toners.forEach(toner => {
      const stateObj = toner.entity ? this._hass.states[toner.entity] : null;
      const level = stateObj ? parseInt(stateObj.state, 10) || 0 : 0;
      
      let alertClass = '';
      if (level <= this.config.critical_threshold) {
        alertClass = 'critical';
      } else if (level <= this.config.warning_threshold) {
        alertClass = 'warning';
      }

      tonersHtml += `
        <div class="toner-item ${alertClass}">
          <div class="toner-header">
            <span class="toner-name">
              <span class="toner-dot" style="background-color: ${toner.color};"></span>
              ${toner.name}
            </span>
            <span class="toner-value">${level}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${level}%; background-color: ${toner.color};"></div>
          </div>
        </div>
      `;
    });

    const webButtonHtml = this.config.ip_address ? `
      <a class="web-btn" href="http://${this.config.ip_address.replace(/^https?:\/\//, '')}" target="_blank" rel="noopener noreferrer" title="Ouvrir l'interface Web">
        <ha-icon icon="mdi:open-in-new"></ha-icon>
      </a>
    ` : '';

    this.content.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
          font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
        }
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-shape {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background-color: var(--primary-color-light, rgba(3, 169, 244, 0.12));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color, #03a9f4);
        }
        .icon-shape.offline {
          background-color: rgba(244, 67, 54, 0.12);
          color: var(--error-color, #f44336);
        }
        .title-group {
          display: flex;
          flex-direction: column;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-text-color);
          line-height: 1.2;
        }
        .status-subtitle {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 2px;
        }
        .web-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--secondary-background-color, #f5f5f5);
          color: var(--primary-text-color);
          text-decoration: none;
          transition: background 0.2s;
        }
        .web-btn:hover {
          background: var(--divider-color, #e0e0e0);
        }
        .toners-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .toner-item {
          background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
          padding: 10px;
          border-radius: 10px;
          border: 1px solid transparent;
          transition: border-color 0.3s;
        }
        .toner-item.warning {
          border-color: var(--warning-color, #ff9800);
          background: rgba(255, 152, 0, 0.08);
        }
        .toner-item.critical {
          border-color: var(--error-color, #f44336);
          background: rgba(244, 67, 54, 0.08);
          animation: pulse 2s infinite;
        }
        .toner-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .toner-name {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--primary-text-color);
        }
        .toner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .toner-value {
          color: var(--secondary-text-color);
        }
        .progress-bar-bg {
          height: 8px;
          background: var(--divider-color, rgba(0, 0, 0, 0.1));
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(244, 67, 54, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
        }
      </style>

      <div class="header-container">
        <div class="header-left">
          <div class="icon-shape ${isOnline ? '' : 'offline'}">
            <ha-icon icon="${isOnline ? 'mdi:printer' : 'mdi:printer-off'}"></ha-icon>
          </div>
          <div class="title-group">
            <span class="card-title">${this.config.title}</span>
            <span class="status-subtitle">${statusText}</span>
          </div>
        </div>
        ${webButtonHtml}
      </div>

      <div class="toners-grid">
        ${tonersHtml}
      </div>
    `;
  }
}

// -------------------------------------------------------------
// ÉDITEUR GRAPHIQUE VISUEL (VISUAL GUI EDITOR)
// -------------------------------------------------------------
class DellC1760nwCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass || !this._config) return;

    this.innerHTML = `
      <div class="card-config" style="display: flex; flex-direction: column; gap: 12px;">
        <ha-textfield
          label="Titre de la carte"
          .value="${this._config.title || ''}"
          .configValue="${'title'}"
          @input="${this._valueChanged}">
        </ha-textfield>

        <ha-textfield
          label="Adresse IP Imprimante (ex: 192.168.1.50)"
          .value="${this._config.ip_address || ''}"
          .configValue="${'ip_address'}"
          @input="${this._valueChanged}">
        </ha-textfield>

        <ha-entity-picker
          label="Entité Statut / État"
          .hass="${this._hass}"
          .value="${this._config.status_entity || ''}"
          .configValue="${'status_entity'}"
          @value-changed="${this._valueChanged}">
        </ha-entity-picker>

        <ha-entity-picker
          label="Entité Toner Cyan (%)"
          .hass="${this._hass}"
          .value="${this._config.cyan_entity || ''}"
          .configValue="${'cyan_entity'}"
          @value-changed="${this._valueChanged}">
        </ha-entity-picker>

        <ha-entity-picker
          label="Entité Toner Magenta (%)"
          .hass="${this._hass}"
          .value="${this._config.magenta_entity || ''}"
          .configValue="${'magenta_entity'}"
          @value-changed="${this._valueChanged}">
        </ha-entity-picker>

        <ha-entity-picker
          label="Entité Toner Jaune (%)"
          .hass="${this._hass}"
          .value="${this._config.yellow_entity || ''}"
          .configValue="${'yellow_entity'}"
          @value-changed="${this._valueChanged}">
        </ha-entity-picker>

        <ha-entity-picker
          label="Entité Toner Noir (%)"
          .hass="${this._hass}"
          .value="${this._config.black_entity || ''}"
          .configValue="${'black_entity'}"
          @value-changed="${this._valueChanged}">
        </ha-entity-picker>

        <div style="display: flex; gap: 12px;">
          <ha-textfield
            type="number"
            label="Seuil d'avertissement (%)"
            .value="${this._config.warning_threshold ?? 15}"
            .configValue="${'warning_threshold'}"
            @input="${this._valueChanged}"
            style="flex: 1;">
          </ha-textfield>

          <ha-textfield
            type="number"
            label="Seuil critique (%)"
            .value="${this._config.critical_threshold ?? 5}"
            .configValue="${'critical_threshold'}"
            @input="${this._valueChanged}"
            style="flex: 1;">
          </ha-textfield>
        </div>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const value = ev.detail?.value !== undefined ? ev.detail.value : target.value;
    const configValue = target.configValue;

    if (this._config[configValue] === value) return;

    this._config = {
      ...this._config,
      [configValue]: configValue.includes('threshold') ? Number(value) : value
    };

    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

customElements.define('dell-c1760nw-card', DellC1760nwCard);
customElements.define('dell-c1760nw-card-editor', DellC1760nwCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'dell-c1760nw-card',
  name: 'Dell C1760nw Printer Card',
  description: 'Une carte moderne style Mushroom avec jauges et alertes pour imprimante Dell C1760nw.'
});