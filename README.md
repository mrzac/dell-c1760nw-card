# Dell C1760nw Card

Carte Lovelace personnalisée pour l'intégration [hass-dell-c1760nw](https://github.com/mrzac/hass-dell-c1760nw).

## Fonctionnalités

- Thème natif Home Assistant (clair/sombre).
- Éditeur visuel intégré pour choisir les entités et régler le seuil toner.
- Indicateur d'état dans l'en-tête avec code couleur.
- **Mode compact automatique** lorsque le capteur de statut est `unavailable` : les jauges, alertes et compteurs sont masqués jusqu'au retour des données. Le bouton d'actualisation reste disponible.
- Alertes actives présentées sous forme de badges : bourrage, capot, bac papier et bac récepteur toner ; les alertes inactives ne prennent pas de place.
- Badges de toner faible selon le seuil configuré.
- Jauges des toners noir, cyan, magenta et jaune.
- Compteurs total, noir & blanc et couleur.
- **Informations techniques repliables** : adresse IP, firmware et numéro de série. L'adresse IP ouvre l'interface Web de l'imprimante.
- Bouton d'actualisation SNMP.

## Installation HACS

1. Ouvrir **HACS → ⋮ → Dépôts personnalisés**.
2. Ajouter l'URL de ce dépôt GitHub et choisir le type **Dashboard**.
3. Installer **Dell C1760nw Card**.
4. Recharger le navigateur (Ctrl+F5).
5. Ajouter la carte depuis le sélecteur de cartes : **Dell C1760nw**.

La ressource est normalement ajoutée automatiquement par HACS. Si nécessaire, ajouter `/hacsfiles/dell-c1760nw-card/dell-c1760nw-card.js` comme ressource de type **JavaScript module**.

## Installation manuelle

Copier `dell-c1760nw-card.js` dans `/config/www/`, puis ajouter la ressource `/local/dell-c1760nw-card.js` de type **JavaScript module**.

## Configuration YAML

```yaml
type: custom:dell-c1760nw-card
title: Dell C1760nw
low_level: 15
show_alerts: true
show_toners: true
show_counters: true
show_device: true
show_refresh: true
```

Les entités par défaut sont construites à partir des noms français de l'intégration. Si Home Assistant a conservé un ancien `entity_id`, utilise l'éditeur visuel pour sélectionner les bonnes entités. Les champs d'entité peuvent rester vides si une entité optionnelle n'existe pas.

## Entités prises en charge

| Fonction | Entité par défaut |
|---|---|
| Statut | `sensor.dell_c1760nw_statut` |
| Alerte actuelle | `sensor.dell_c1760nw_alerte_actuelle` |
| Code d'erreur | `sensor.dell_c1760nw_code_d_erreur` |
| Toners | `sensor.dell_c1760nw_toner_noir`, `..._cyan`, `..._magenta`, `..._jaune` |
| Compteurs | `sensor.dell_c1760nw_compteur_de_pages_total`, `..._pages_noir_blanc`, `..._pages_couleur` |
| Alertes binaires | `binary_sensor.dell_c1760nw_bourrage_papier`, `..._capot_ouvert`, `..._bac_a_papier_vide`, `..._bac_recepteur_toner_plein` |
| Actualisation | `button.dell_c1760nw_rafraichir_l_etat` |

Les noms d'entités Home Assistant peuvent différer si un identifiant existant a été conservé ou renommé. L'éditeur permet de corriger ces correspondances sans modifier le YAML.

## Notes

- Le mode compact est déclenché par l'état `unavailable` du capteur de statut ; il ne dépend pas de la valeur d'un capteur de toner.
- Le seuil toner est de 15 % par défaut et se règle dans l'éditeur.
- Les alertes binaires indisponibles ne sont pas considérées comme des défauts actifs.
- Le lien IP utilise `http://` si le capteur fournit uniquement une adresse ou un nom d'hôte. Si une URL `http://` ou `https://` complète est fournie, elle est conservée.
- Le bouton Actualiser appelle le service `button.press` sur l'entité de rafraîchissement.
- La carte ne modifie pas l'intégration ni les données SNMP ; elle affiche les états fournis par Home Assistant.

## Licence

MIT.
