/* Dell C1760nw Lovelace Card — standalone Home Assistant custom card.
 * Theme HA, visual editor, SNMP alerts, toner gauges and counters.
 * No external runtime dependencies.
 */
(() => {
  "use strict";

  const VERSION = "1.2.0";
  const DEFAULTS = {
    title: "Dell C1760nw",
    low_level: 15,
    show_alerts: true,
    show_toners: true,
    show_counters: true,
    show_device: true,
    show_refresh: true,
    entities: {
      status: "sensor.dell_c1760nw_statut",
      alert: "sensor.dell_c1760nw_alerte_actuelle",
      alert_code: "sensor.dell_c1760nw_code_d_erreur",
      toner_black: "sensor.dell_c1760nw_toner_noir",
      toner_cyan: "sensor.dell_c1760nw_toner_cyan",
      toner_magenta: "sensor.dell_c1760nw_toner_magenta",
      toner_yellow: "sensor.dell_c1760nw_toner_jaune",
      toner_status_black: "sensor.dell_c1760nw_etat_toner_noir",
      toner_status_cyan: "sensor.dell_c1760nw_etat_toner_cyan",
      toner_status_magenta: "sensor.dell_c1760nw_etat_toner_magenta",
      toner_status_yellow: "sensor.dell_c1760nw_etat_toner_jaune",
      pages_total: "sensor.dell_c1760nw_compteur_de_pages_total",
      pages_mono: "sensor.dell_c1760nw_pages_noir_blanc",
      pages_color: "sensor.dell_c1760nw_pages_couleur",
      jam: "binary_sensor.dell_c1760nw_bourrage_papier",
      cover: "binary_sensor.dell_c1760nw_capot_ouvert",
      paper_empty: "binary_sensor.dell_c1760nw_bac_a_papier_vide",
      waste_toner: "binary_sensor.dell_c1760nw_bac_recepteur_toner_plein",
      ip: "sensor.dell_c1760nw_adresse_ip",
      firmware: "sensor.dell_c1760nw_version_firmware",
      serial: "sensor.dell_c1760nw_numero_de_serie",
      refresh: "button.dell_c1760nw_rafraichir_l_etat"
    }
  };

  const ENTITY_FIELDS = [
    ["status", "Statut de l'imprimante"],
    ["alert", "Alerte actuelle"],
    ["alert_code", "Code d'erreur"],
    ["toner_black", "Toner noir (%)"],
    ["toner_cyan", "Toner cyan (%)"],
    ["toner_magenta", "Toner magenta (%)"],
    ["toner_yellow", "Toner jaune (%)"],
    ["toner_status_black", "État toner noir (texte)"],
    ["toner_status_cyan", "État toner cyan (texte)"],
    ["toner_status_magenta", "État toner magenta (texte)"],
    ["toner_status_yellow", "État toner jaune (texte)"],
    ["pages_total", "Compteur de pages total"],
    ["pages_mono", "Pages noir et blanc"],
    ["pages_color", "Pages couleur"],
    ["jam", "Bourrage papier"],
    ["cover", "Capot ouvert"],
    ["paper_empty", "Bac à papier vide"],
    ["waste_toner", "Bac récepteur toner plein"],
    ["ip", "Adresse IP"],
    ["firmware", "Version firmware"],
    ["serial", "Numéro de série"],
    ["refresh", "Bouton de rafraîchissement"]
  ];

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, ch =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
  const unavailable = s => !s || ["unknown", "unavailable", "", "none"].includes(String(s.state).toLowerCase());
  const valid = s => !unavailable(s);
  const fmt = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString("fr-FR") : "—";
  };
  const active = s => !!s && ["on", "true", "1", "problem", "open"].includes(String(s.state).toLowerCase());
  const noAlertText = s => !s || /^(aucune|aucun|none|no alert|ok|0)$/i.test(String(s).trim());

  const EDITOR_SCHEMA = [
    { name: "title", selector: { text: {} } },
    { name: "low_level", selector: { number: { min: 1, max: 50, step: 1, mode: "box" } } },
    { name: "show_alerts", selector: { boolean: {} } },
    { name: "show_toners", selector: { boolean: {} } },
    { name: "show_counters", selector: { boolean: {} } },
    { name: "show_device", selector: { boolean: {} } },
    { name: "show_refresh", selector: { boolean: {} } },
    ...ENTITY_FIELDS.map(([name]) => ({
      name: `entity_${name}`,
      selector: { entity: {} }
    }))
  ];
  const EDITOR_LABELS = {
    title: "Titre de la carte",
    low_level: "Seuil d'alerte toner (%)",
    show_alerts: "Afficher les alertes et défauts",
    show_toners: "Afficher les niveaux de toner",
    show_counters: "Afficher les compteurs de pages",
    show_device: "Afficher les informations de l'appareil",
    show_refresh: "Afficher le bouton d'actualisation"
  };
  for (const [key, label] of ENTITY_FIELDS) EDITOR_LABELS[`entity_${key}`] = label;

  class DellC1760nwCard extends HTMLElement {
    static getConfigElement() {
      return document.createElement("dell-c1760nw-card-editor");
    }
    static getStubConfig() {
      return { ...DEFAULTS, entities: { ...DEFAULTS.entities } };
    }

    setConfig(config) {
      if (!config || typeof config !== "object") throw new Error("Configuration Dell C1760nw invalide.");
      this._config = {
        ...DEFAULTS, ...config,
        entities: { ...DEFAULTS.entities, ...(config.entities || {}) }
      };
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      if (!this._eventsBound) {
        this._eventsBound = true;
        this.shadowRoot.addEventListener("click", ev => {
          const detailsToggle = ev.target.closest("[data-details-toggle]");
          if (detailsToggle) {
            this._detailsOpen = !this._detailsOpen;
            this._render();
            return;
          }
          const refresh = ev.target.closest("[data-refresh]");
          if (refresh) {
            const id = this._config.entities.refresh;
            if (id && this._hass?.states?.[id]) {
              this._hass.callService("button", "press", { entity_id: id });
            }
            return;
          }
          const target = ev.target.closest("[data-entity]");
          if (target?.dataset.entity) {
            const event = new Event("hass-more-info", { bubbles: true, composed: true });
            event.detail = { entityId: target.dataset.entity };
            this.dispatchEvent(event);
          }
        });
      }
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    getCardSize() { return 6; }

    _state(key) {
      const id = this._config?.entities?.[key];
      return id ? this._hass?.states?.[id] : undefined;
    }
    _value(key) {
      const s = this._state(key);
      return valid(s) ? s.state : null;
    }
    _number(key) {
      const v = this._value(key);
      if (v === null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    _status() {
      const raw = String(this._value("status") ?? "").toLowerCase();
      if (/offline|disconnected|hors ligne|unavailable/.test(raw)) return ["Hors ligne", "off", "mdi:lan-disconnect"];
      if (/error|erreur|fault|jam|bourrage|attention/.test(raw)) return ["À vérifier", "bad", "mdi:alert-circle"];
      if (/print|impression|busy|processing/.test(raw)) return ["Impression en cours", "printing", "mdi:printer"];
      if (/sleep|veille|standby/.test(raw)) return ["En veille", "sleep", "mdi:power-sleep"];
      if (/ready|prêt|prete|idle|normal|ok/.test(raw)) return ["Prête", "ok", "mdi:printer-check"];
      return [this._value("status") || "État inconnu", "neutral", "mdi:printer"];
    }

    _render() {
      if (!this._config || !this._hass || !this.shadowRoot) return;
      const c = this._config, e = c.entities;
      const rawStatusState = String(this._state("status")?.state ?? "").toLowerCase();
      const statusUnavailable = rawStatusState === "unavailable";
      if (this._detailsOpen === undefined) this._detailsOpen = false;
      const alertDefs = [
        ["jam", "Bourrage papier", "mdi:alert-octagon"],
        ["cover", "Capot ouvert", "mdi:door-open"],
        ["paper_empty", "Bac à papier vide", "mdi:tray-alert"],
        ["waste_toner", "Bac récepteur toner plein", "mdi:delete-alert"]
      ];
      const binaryAvailable = alertDefs.filter(([key]) => valid(this._state(key)));
      const activeAlerts = alertDefs.filter(([key]) => active(this._state(key)));
      const alertText = this._value("alert");
      const hasAlertText = !noAlertText(alertText);
      const alertCode = this._value("alert_code");
      const toners = [
        ["toner_black", "Noir", "#343b45", "toner_status_black"],
        ["toner_cyan", "Cyan", "#00a6d6", "toner_status_cyan"],
        ["toner_magenta", "Magenta", "#df4b91", "toner_status_magenta"],
        ["toner_yellow", "Jaune", "#e2b92e", "toner_status_yellow"]
      ].map(([key, label, color, textKey]) => ({
        key, label, color, textKey, value: this._number(key), text: this._value(textKey)
      })).filter(t => t.value !== null);
      const threshold = Number(c.low_level ?? 15);
      const lowToners = toners.filter(t => t.value <= threshold);
      const hasAlert = activeAlerts.length > 0 || hasAlertText || lowToners.length > 0;
      let [statusLabel, statusClass, statusIcon] = this._status();
      if (hasAlert && statusClass === "ok") {
        statusLabel = "À surveiller";
        statusClass = "warning";
        statusIcon = "mdi:alert-circle-outline";
      }
      const pages = [
        ["pages_total", "Pages imprimées", "mdi:file-document-multiple-outline"],
        ["pages_mono", "Noir et blanc", "mdi:file-document-outline"],
        ["pages_color", "Couleur", "mdi:palette-outline"]
      ].map(([key, label, icon]) => ({ key, label, icon, value: this._number(key) }))
        .filter(x => x.value !== null);
      const info = [
        ["ip", "Adresse IP"],
        ["firmware", "Firmware"],
        ["serial", "N° de série"]
      ].map(([key, label]) => ({ key, label, value: this._value(key) })).filter(x => x.value);
      const model = "Dell C1760nw · Imprimante laser couleur";
      const alertRows = activeAlerts.map(([key, label, icon]) => `
        <button class="alert-badge danger" data-entity="${esc(e[key])}">
          <ha-icon icon="${icon}"></ha-icon><span>${label}</span>
        </button>`).join("");
      const alertSummary = hasAlertText ? `
        <button class="message-row" data-entity="${esc(e.alert)}">
          <span>Alerte imprimante</span><b>${esc(alertText)}</b>
        </button>` : "";
      const codeSummary = alertCode ? `
        <button class="message-row" data-entity="${esc(e.alert_code)}">
          <span>Code Dell</span><b class="code">${esc(alertCode)}</b>
        </button>` : "";
      const alertHtml = c.show_alerts === false ? "" : `
        <section class="section">
          <div class="section-heading"><ha-icon icon="mdi:shield-alert-outline"></ha-icon><span>Alertes et surveillance</span>
            <span class="heading-spacer"></span><span class="section-meta">${hasAlert ? "Action requise" : "Tout est normal"}</span>
          </div>
          ${alertRows ? `<div class="alert-badges">${alertRows}</div>` : (binaryAvailable.length ? `
            <div class="all-clear"><ha-icon icon="mdi:check-circle-outline"></ha-icon><span>Aucun défaut matériel détecté</span></div>` : `
            <div class="empty">Capteurs d'alerte non disponibles</div>`)}
          ${lowToners.length ? `<div class="alert-badges">${lowToners.map(t => `<button class="alert-badge warning-badge" data-entity="${esc(e[t.key])}"><ha-icon icon="mdi:water-alert"></ha-icon><span>Toner ${t.label} faible · ${fmt(t.value)} %</span></button>`).join("")}</div>` : ""}
          ${alertSummary}${codeSummary}
        </section>`;

      const tonerHtml = c.show_toners === false ? "" : `
        <section class="section">
          <div class="section-heading"><ha-icon icon="mdi:water-outline"></ha-icon><span>Niveaux de toner</span>
            <span class="heading-spacer"></span><span class="section-meta">${lowToners.length ? `${lowToners.length} faible(s)` : "Consommables"}</span>
          </div>
          ${toners.length ? `<div class="toner-grid">${toners.map(t => `
            <button class="toner ${t.value <= threshold ? "low" : ""}" data-entity="${esc(e[t.key])}" title="Afficher ${t.label}">
              <span class="tank"><i style="height:${Math.max(0, Math.min(100, t.value))}%;background:${t.color}"></i></span>
              <b>${fmt(t.value)} %</b><span class="toner-name">${t.label}</span>
              ${t.value <= threshold ? `<em>${t.value <= 2 ? "À remplacer" : "Niveau bas"}</em>` : ""}
              ${t.text ? `<small>${esc(t.text)}</small>` : ""}
            </button>`).join("")}</div>` : `<div class="empty">Aucune mesure de toner disponible</div>`}
        </section>`;

      const counterHtml = c.show_counters === false ? "" : `
        <section class="section">
          <div class="section-heading"><ha-icon icon="mdi:counter"></ha-icon><span>Compteurs</span></div>
          ${pages.length ? `<div class="counter-grid">${pages.map(p => `
            <button class="counter" data-entity="${esc(e[p.key])}">
              <ha-icon icon="${p.icon}"></ha-icon><b>${fmt(p.value)}</b><span>${p.label}</span>
            </button>`).join("")}</div>` : `<div class="empty">Compteurs indisponibles</div>`}
        </section>`;

      const deviceDetails = info.length ? `<div class="device-grid">${info.map(item => {
        if (item.key === "ip") {
          const raw = String(item.value).trim();
          const href = /^https?:\/\//i.test(raw) ? raw : (/^[a-z0-9.-]+(?::\d+)?$/i.test(raw) ? `http://${raw}` : "");
          return `<div class="device-item"><span>${item.label}</span>${href ? `<a class="ip-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(item.value)} <ha-icon icon="mdi:open-in-new"></ha-icon></a>` : `<b>${esc(item.value)}</b>`}</div>`;
        }
        return `<div class="device-item"><span>${item.label}</span><b>${esc(item.value)}</b></div>`;
      }).join("")}</div>` : `<div class="empty">Informations complémentaires indisponibles</div>`;
      const deviceHtml = c.show_device === false ? "" : `
        <section class="device-section">
          <button class="details-toggle" data-details-toggle aria-expanded="${this._detailsOpen ? "true" : "false"}">
            <span><ha-icon icon="mdi:information-outline"></ha-icon>Plus d’informations</span>
            <ha-icon class="chevron ${this._detailsOpen ? "expanded" : ""}" icon="mdi:chevron-down"></ha-icon>
          </button>
          ${this._detailsOpen ? `<div class="device-details">${deviceDetails}</div>` : ""}
        </section>`;
      const compactHtml = statusUnavailable ? `
        <div class="compact-state">
          <div class="compact-icon"><ha-icon icon="mdi:printer-off"></ha-icon></div>
          <div class="compact-copy"><b>Imprimante indisponible</b><span>Le capteur de statut indique « ${esc(rawStatusState)} ». Les niveaux de toner et compteurs sont masqués jusqu’au retour de la connexion.</span></div>
        </div>
        ${info.find(item => item.key === "ip") ? `<div class="compact-ip"><span>Interface imprimante</span><a class="ip-link" href="${esc((/^https?:\/\//i.test(String(info.find(item => item.key === "ip").value).trim()) ? String(info.find(item => item.key === "ip").value).trim() : `http://${String(info.find(item => item.key === "ip").value).trim()}`))}" target="_blank" rel="noopener noreferrer">${esc(info.find(item => item.key === "ip").value)} <ha-icon icon="mdi:open-in-new"></ha-icon></a></div>` : ""}
      ` : `${tonerHtml}${alertHtml}${counterHtml}${deviceHtml}`;

      const statusHtml = statusUnavailable ? "" : `
        <div class="status-wrap">
          <button class="status ${statusClass}" data-entity="${esc(e.status)}">
            <span class="status-icon"><ha-icon icon="${statusIcon}"></ha-icon></span>
            <span class="status-main"><b>${esc(statusLabel)}</b><small>${hasAlert ? "Une vérification est recommandée" : (this._value("status") || "État général de l'imprimante")}</small></span>
          </button>
        </div>`;

      this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;color:var(--primary-text-color);font-family:var(--paper-font-body,Roboto,Arial,sans-serif)}
        *{box-sizing:border-box}
        ha-card{overflow:hidden;color:var(--primary-text-color);background:var(--ha-card-background,var(--card-background-color));border:1px solid var(--ha-card-border-color,var(--divider-color));border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none)}
        button{font:inherit;color:inherit}
        .header{display:flex;align-items:center;gap:13px;padding:18px 18px 15px;border-bottom:1px solid var(--divider-color)}
        .printer-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-color);flex:none}
        .printer-icon ha-icon{--mdc-icon-size:25px}
        .heading{font-size:1.02rem;font-weight:700;line-height:1.3}
        .subtitle{font-size:.76rem;color:var(--secondary-text-color);margin-top:3px}
        .header-right{margin-left:auto;color:var(--secondary-text-color);font-size:.68rem;white-space:nowrap}
        .header-state{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;background:var(--secondary-background-color);font-size:.68rem;font-weight:650;white-space:nowrap}
        .header-state i{width:7px;height:7px;border-radius:50%;background:var(--secondary-text-color)}
        .header-state.ok i{background:var(--success-color,#299d69)}.header-state.warning i{background:var(--warning-color,#d99b27)}.header-state.bad i{background:var(--error-color)}.header-state.printing i{background:var(--info-color,var(--primary-color))}
        .status-wrap{padding:14px 16px 0}
        .status{width:100%;display:flex;align-items:center;gap:11px;padding:12px;border:1px solid var(--divider-color);border-radius:12px;background:var(--secondary-background-color);text-align:left;cursor:pointer}
        .status-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:var(--success-color,var(--primary-color));color:white;flex:none}
        .status-icon ha-icon{--mdc-icon-size:21px}
        .status-main{min-width:0}.status-main b{display:block;font-size:.9rem}.status-main small{display:block;color:var(--secondary-text-color);font-size:.73rem;margin-top:3px;overflow-wrap:anywhere}
        .status.warning .status-icon{background:var(--warning-color,#d99b27)}
        .status.bad{border-color:var(--error-color)}.status.bad .status-icon{background:var(--error-color)}
        .status.off .status-icon,.status.neutral .status-icon,.status.sleep .status-icon{background:var(--secondary-text-color)}
        .status.printing .status-icon{background:var(--info-color,var(--primary-color))}
        .section{padding:16px 16px 0}
        .section-heading{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:.8rem;font-weight:700}
        .section-heading ha-icon{color:var(--state-icon-color,var(--primary-color));--mdc-icon-size:18px}
        .heading-spacer{flex:1}.section-meta{font-size:.68rem;font-weight:500;color:var(--secondary-text-color)}
        .toner-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
        .toner{display:flex;min-width:0;flex-direction:column;align-items:center;gap:4px;padding:9px 3px 8px;border:1px solid var(--divider-color);border-radius:11px;background:var(--secondary-background-color);cursor:pointer}
        .toner.low{border-color:var(--warning-color,#d99b27)}
        .tank{height:58px;width:24px;display:flex;align-items:flex-end;overflow:hidden;border-radius:6px;background:var(--divider-color)}
        .tank i{display:block;width:100%;border-radius:0 0 5px 5px}
        .toner b{font-size:.87rem;font-variant-numeric:tabular-nums}
        .toner-name{font-size:.7rem;color:var(--secondary-text-color)}
        .toner em{font-size:.59rem;font-style:normal;font-weight:700;color:var(--warning-color,#d99b27);text-transform:uppercase}
        .toner small{max-width:100%;font-size:.6rem;color:var(--secondary-text-color);overflow-wrap:anywhere}
        .alert-badges{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:7px}
        .alert-badge{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid var(--divider-color);border-radius:999px;background:var(--secondary-background-color);font-size:.7rem;font-weight:600;text-align:left;cursor:pointer}
        .alert-badge ha-icon{--mdc-icon-size:15px}.alert-badge.danger{border-color:var(--error-color);color:var(--error-color)}
        .alert-badge.warning-badge{border-color:var(--warning-color,#d99b27);color:var(--warning-color,#d99b27)}
        .all-clear{display:flex;align-items:center;gap:7px;color:var(--success-color,#299d69);font-size:.73rem;padding:7px 1px}
        .all-clear ha-icon{--mdc-icon-size:17px}
        .message-row{width:100%;display:flex;align-items:center;gap:9px;margin:0 0 6px;padding:9px 10px;border:1px solid var(--divider-color);border-radius:9px;background:var(--secondary-background-color);text-align:left}
        .message-row span{flex:1;font-size:.75rem}
        .message-row{justify-content:space-between}.message-row b{font-size:.73rem;text-align:right;overflow-wrap:anywhere}
        .message-row .code{font-family:monospace;color:var(--warning-color,#d99b27)}
        .warning-row{border-color:var(--warning-color,#d99b27)}
        .counter-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
        .counter{display:flex;min-width:0;flex-direction:column;align-items:flex-start;gap:5px;padding:10px;border:1px solid var(--divider-color);border-radius:10px;background:var(--secondary-background-color);text-align:left;cursor:pointer}
        .counter ha-icon{--mdc-icon-size:18px;color:var(--primary-color)}
        .counter b{font-size:1rem;font-variant-numeric:tabular-nums}
        .counter span{font-size:.65rem;color:var(--secondary-text-color);line-height:1.25}
        .device-section{margin:16px 16px 0;padding:0 12px;border:1px solid var(--divider-color);border-radius:11px;background:var(--secondary-background-color)}
        .details-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border:0;background:none;text-align:left;font-size:.76rem;font-weight:700;cursor:pointer}
        .details-toggle span{display:flex;align-items:center;gap:8px}.details-toggle ha-icon{--mdc-icon-size:18px;color:var(--primary-color)}
        .details-toggle .chevron{color:var(--secondary-text-color);transition:transform .18s ease}.details-toggle .chevron.expanded{transform:rotate(180deg)}
        .device-details{padding:0 0 11px}.device-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px}
        .device-item{display:flex;min-width:0;flex-direction:column;align-items:flex-start;gap:3px;padding:3px 0}
        .device-item span,.compact-ip span{font-size:.66rem;color:var(--secondary-text-color)}
        .device-item b{font-size:.73rem;overflow-wrap:anywhere}
        .ip-link{display:inline-flex;align-items:center;gap:4px;max-width:100%;color:var(--primary-color);font-size:.73rem;font-weight:650;text-decoration:underline;text-underline-offset:2px;overflow-wrap:anywhere}
        .ip-link ha-icon{--mdc-icon-size:13px;flex:none}
        .compact-state{display:flex;align-items:center;gap:12px;margin:15px 16px 0;padding:13px;border:1px solid var(--divider-color);border-radius:11px;background:var(--secondary-background-color)}
        .compact-icon{width:40px;height:40px;display:grid;place-items:center;flex:none;border-radius:11px;background:var(--secondary-text-color);color:white}
        .compact-icon ha-icon{--mdc-icon-size:23px}.compact-copy{display:flex;min-width:0;flex-direction:column;gap:4px}.compact-copy b{font-size:.83rem}.compact-copy span{font-size:.7rem;color:var(--secondary-text-color);line-height:1.4}
        .compact-ip{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 16px 0;padding:0 1px 2px}
        .empty{padding:8px 2px;color:var(--secondary-text-color);font-size:.74rem}
        .footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding:12px 16px 15px;border-top:1px solid var(--divider-color)}
        .footer-note{font-size:.67rem;color:var(--secondary-text-color)}
        .refresh{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid var(--divider-color);border-radius:9px;background:var(--secondary-background-color);color:var(--primary-color);font-size:.72rem;font-weight:650;cursor:pointer}
        .refresh ha-icon{--mdc-icon-size:16px}
        @media(max-width:360px){.header{padding:14px;gap:9px}.header-state{font-size:.61rem;padding:4px 6px}.status-wrap{padding:12px 12px 0}.section{padding:13px 12px 0}.device-section{margin:13px 12px 0}.compact-state{margin:13px 12px 0}.compact-ip{margin:9px 12px 0}.footer{padding:11px 12px 13px}.toner-grid{gap:4px}.toner{padding-left:1px;padding-right:1px}.counter{padding:7px}.counter b{font-size:.88rem}}
        button:focus-visible,a:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
        @media(prefers-reduced-motion:no-preference){button:active{filter:brightness(.96)}}
      </style>
      <ha-card>
        <div class="header">
          <div class="printer-icon"><ha-icon icon="mdi:printer"></ha-icon></div>
          <div><div class="heading">${esc(c.title || "Dell C1760nw")}</div><div class="subtitle">${model}</div></div>
          <span class="header-state ${statusUnavailable ? "off" : statusClass}"><i></i>${statusUnavailable ? "Indisponible" : esc(statusLabel)}</span>
        </div>
        ${statusHtml}
        ${compactHtml}
        <div class="footer">
          <span class="footer-note">${statusUnavailable ? "Connexion SNMP indisponible" : (hasAlert ? "Surveillance : anomalie détectée" : "Surveillance de l'imprimante")}</span>
          ${c.show_refresh === false ? "" : `<button class="refresh" data-refresh><ha-icon icon="mdi:refresh"></ha-icon>Actualiser</button>`}
        </div>
      </ha-card>`;
    }
  }

  class DellC1760nwCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = {
        ...DEFAULTS, ...config,
        entities: { ...DEFAULTS.entities, ...(config.entities || {}) }
      };
      this._render();
    }
    set hass(hass) { this._hass = hass; this._render(); }

    _render() {
      if (!this._config || !this._hass) return;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = schema => EDITOR_LABELS[schema.name] || schema.name;
        this._form.addEventListener("value-changed", ev => {
          const values = ev.detail.value || {};
          const entities = { ...this._config.entities };
          for (const [key] of ENTITY_FIELDS) {
            const value = values[`entity_${key}`];
            if (value !== undefined) entities[key] = value;
          }
          const next = {
            ...this._config,
            title: values.title ?? this._config.title,
            low_level: values.low_level ?? this._config.low_level,
            show_alerts: values.show_alerts ?? this._config.show_alerts,
            show_toners: values.show_toners ?? this._config.show_toners,
            show_counters: values.show_counters ?? this._config.show_counters,
            show_device: values.show_device ?? this._config.show_device,
            show_refresh: values.show_refresh ?? this._config.show_refresh,
            entities
          };
          this._config = next;
          this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: next }, bubbles: true, composed: true
          }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      this._form.schema = EDITOR_SCHEMA;
      const data = {
        title: this._config.title,
        low_level: this._config.low_level,
        show_alerts: this._config.show_alerts,
        show_toners: this._config.show_toners,
        show_counters: this._config.show_counters,
        show_device: this._config.show_device,
        show_refresh: this._config.show_refresh
      };
      for (const [key] of ENTITY_FIELDS) data[`entity_${key}`] = this._config.entities[key] || "";
      this._form.data = data;
    }
  }

  if (!customElements.get("dell-c1760nw-card")) customElements.define("dell-c1760nw-card", DellC1760nwCard);
  if (!customElements.get("dell-c1760nw-card-editor")) customElements.define("dell-c1760nw-card-editor", DellC1760nwCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some(card => card.type === "dell-c1760nw-card")) {
    window.customCards.push({
      type: "dell-c1760nw-card",
      name: "Dell C1760nw",
      description: "État SNMP, alertes, toners et compteurs de l'imprimante Dell C1760nw.",
      preview: true,
      documentationURL: "https://github.com/mrzac/hass-dell-c1760nw"
    });
  }
  console.info(`%c DELL C1760NW CARD %c ${VERSION}`,
    "background:#03a9f4;color:#fff;font-weight:700",
    "background:#455a64;color:#fff");
})();
