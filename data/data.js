/* Purza shared data: collected 20–21 Nov 2026 from public Mumbai web pages (sources on every row).
   Prices are listed prices seen online (retail, marketplace or trade), not quotes from Purza shops.
   Demo shops are invented and clearly labelled; public listings are real businesses that are NOT Purza partners. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.PurzaData = data;
})(typeof self !== 'undefined' ? self : this, function () {
  const COLLECTED_ON = '2026-11-21';

  const CATEGORIES = {
    ac: 'AC', fan: 'Fan', mixer: 'Mixer grinder', washer: 'Washing machine', geyser: 'Geyser', fridge: 'Refrigerator'
  };

  // kind: genuine = branded / original listing; compatible = generic or multi-brand; trade = wholesale or trade price
  const PARTS = [
    {
      id: 'ac-capacitor', name: 'AC dual run capacitor (e.g. 35 + 2.5 µF, 440 V)', short: 'AC capacitor', cat: 'ac',
      local: 'capacitor · कैपेसिटर', appliance: 'Split AC outdoor unit, 1–2 ton',
      check: 'Match both values on the label (compressor µF + fan µF) and the 440 V rating.',
      keywords: ['capacitor', 'condenser', 'mfd', 'µf', 'uf', 'ac not starting', 'ac not cooling', 'outdoor fan', 'compressor not starting', '35+2.5', '36+2.5'],
      obs: [
        { what: 'Havells 36/2.5 MFD AC capacitor (list price)', price: 238, kind: 'genuine', where: 'Havells capacitor price list', url: 'https://havells.com/HavellsProductImages/HavellsIndia/pdf/Experience-zone/Brochures-Price-Lists/Havells_MFD_Capacitors.pdf' },
        { what: 'Totaline AC capacitor, 50 MFD', price: 220, kind: 'genuine', where: 'IndiaMART, Shree Punrasar Enterprises, Andheri', url: 'https://www.indiamart.com/proddetail/totaline-ac-capacitor-2850570505691.html' },
        { what: 'Totaline 450 VAC AC capacitor', price: 450, kind: 'genuine', where: 'IndiaMART, Shree Punrasar Enterprises, Andheri', url: 'https://www.indiamart.com/shreepunrasarenterprises/totaline-capacitor.html' },
        { what: 'Tibcon AC capacitor (typical Mumbai price)', price: 400, kind: 'genuine', where: 'IndiaMART, Mumbai directory', url: 'https://dir.indiamart.com/mumbai/ac-capacitor.html' },
        { what: 'AC capacitor (generic)', price: 300, kind: 'compatible', where: 'IndiaMART, Shree Punrasar Enterprises, Andheri', url: 'https://www.indiamart.com/shreepunrasarenterprises/totaline-capacitor.html' },
        { what: 'AC capacitor', price: 250, kind: 'compatible', where: 'IndiaMART, Hari Om Electronics, Govandi', url: 'https://dir.indiamart.com/mumbai/ac-capacitor.html?biz=10' },
        { what: '20/5 µF polypropylene AC capacitor', price: 140, kind: 'compatible', where: 'IndiaMART, Vedika Refrigeration, Mumbai', url: 'https://www.indiamart.com/vedikarefrigeration/ac-capacitor.html' }
      ]
    },
    {
      id: 'fan-capacitor', name: 'Ceiling fan capacitor 2.5 µF', short: 'Fan capacitor', cat: 'fan',
      local: 'fan condenser · कंडेंसर', appliance: 'Ceiling / table fan',
      check: 'Match the µF value (usually 2.5 or 3.15) and 440 V.',
      keywords: ['fan capacitor', 'ceiling fan', 'fan slow', 'fan not running', 'fan condenser', '2.5 mfd', '3.15'],
      obs: [
        { what: 'Havells 2.5 µF fan capacitor (MRP ₹49)', price: 30, kind: 'genuine', where: 'havells.com', url: 'https://havells.com/home-electricals/mfd-capacitor/fan-mfd-capacitors.html' },
        { what: 'Havells 2.5 MFD, pack of 2 at ₹152 (per piece)', price: 76, kind: 'genuine', where: 'Flipkart', url: 'https://www.flipkart.com/havells-2-5-mfd-fan-capacitor-ceiling-original-electrolytic/p/itm3ef7db2c0bf8b' },
        { what: 'Lumenx 2.5 MFD 440 V fan capacitor', price: 33, kind: 'compatible', where: 'IndiaMART, Lumenx Electrical, Mumbai', url: 'https://www.indiamart.com/proddetail/lumenx-2-50-mfd-fan-capacitor-2848940911230.html' },
        { what: 'Ceiling fan capacitor 2.5 MFD', price: 35, kind: 'compatible', where: 'IndiaMART, Dilson Enterprises, Bhayandar West', url: 'https://www.indiamart.com/proddetail/icar-capacitors-2895371048.html' },
        { what: 'Worldtek 2.5 MFD (trade)', price: 17, kind: 'trade', where: 'IndiaMART, Mahesh Chheda & Co., Grant Road', url: 'https://www.indiamart.com/proddetail/power-factor-capacitor-26162437288.html' },
        { what: 'Ceiling fan capacitor 2 MFD (trade)', price: 16, kind: 'trade', where: 'IndiaMART, Rishabh Enterprises, Mumbai', url: 'https://dir.indiamart.com/mumbai/fan-capacitor.html' }
      ]
    },
    {
      id: 'mixer-coupler', name: 'Mixer grinder coupler', short: 'Mixer coupler', cat: 'mixer',
      local: 'coupler · कपलर', appliance: 'Mixer grinder, 500–750 W',
      check: 'Match the tooth count and the shaft hole; jar and motor couplers differ.',
      keywords: ['coupler', 'coupling', 'mixer', 'mixie', 'grinder', 'jar not rotating', 'teeth'],
      obs: [
        { what: 'Bajaj coupler for JX5 mixer (original)', price: 70, kind: 'genuine', where: 'Aalap', url: 'https://aalap.com/products/bajaj-coupler-for-motor-jar-compatible-with-bajaj-jx5-mixer-grinder' },
        { what: 'Bajaj universal jar coupler', price: 250, kind: 'genuine', where: 'Aalap', url: 'https://aalap.com/products/bajaj-jar-coupler-universal-replacement-for-all-bajaj-mixer-grinders' },
        { what: 'Sujata original motor coupler', price: 333, kind: 'genuine', where: 'Flipkart', url: 'https://www.flipkart.com/pmw-sujatha-teeth-mixer-grinder-coupler/p/itmf59bc03f580c4' },
        { what: 'Multi-brand motor couplers (Preethi, Bajaj, Usha…)', price: 220, kind: 'compatible', where: 'Flipkart', url: 'https://www.flipkart.com/pmw-sujatha-teeth-mixer-grinder-coupler/p/itmf59bc03f580c4' },
        { what: 'Sujata-type coupler teeth, 2 pcs', price: 200, kind: 'compatible', where: 'Flipkart', url: 'https://www.flipkart.com/pmw-sujatha-teeth-mixer-grinder-coupler/p/itmf59bc03f580c4' }
      ]
    },
    {
      id: 'mixer-jar', name: 'Mixer grinder chutney jar (400 ml)', short: 'Mixer jar', cat: 'mixer',
      local: 'chutney jar', appliance: 'Mixer grinder',
      check: 'Match the coupler type on the jar base and the jar size.',
      keywords: ['jar', 'chutney jar', 'mixer jar', 'blade', 'jar leaking'],
      obs: [
        { what: 'Bajaj original 400 ml chutney jar (MRP ₹699)', price: 483, kind: 'genuine', where: 'Flipkart', url: 'https://www.flipkart.com/bajaj-original-chutney-jar-assembly-genuine-mixer-grinder-spare-juicer/p/itma6520d84c88da' },
        { what: 'Mixer grinder jar (trade)', price: 110, kind: 'trade', where: 'IndiaMART, Rajendra Home Appliances, Mumbai', url: 'https://www.indiamart.com/rajendra-home-appliances/mixer-grinder-spare-parts.html' },
        { what: 'Mixer grinder jar, larger (trade)', price: 122, kind: 'trade', where: 'IndiaMART, Rajendra Home Appliances, Mumbai', url: 'https://www.indiamart.com/rajendra-home-appliances/mixer-grinder-spare-parts.html' }
      ]
    },
    {
      id: 'wm-drain-pump', name: 'Front-load washing machine drain pump', short: 'Drain pump (front load)', cat: 'washer',
      local: 'drain pump · ड्रेन पंप', appliance: 'Front-load washing machine',
      check: 'Match the outlet angle, mounting and the connector.',
      keywords: ['drain pump', 'not draining', 'water not draining', 'front load', 'pump', 'pani nahi nikal', 'error oe', 'drain error'],
      obs: [
        { what: 'LG front-load drain pump', price: 2899, kind: 'compatible', where: 'IndiaMART, Bhoomi Electricals, Mumbai', url: 'https://www.indiamart.com/bhoomi-electricals-mumbai/washing-machine-spare-parts.html' },
        { what: 'IFB washing machine drain motor', price: 2200, kind: 'compatible', where: 'IndiaMART, Wash Mech, Dahisar East', url: 'https://www.indiamart.com/washmech-mumbai/washing-machine-spare-parts.html' },
        { what: 'Drain pump for Voltas front load', price: 2800, kind: 'compatible', where: 'IndiaMART, Just Repair LLP, Kandivali West', url: 'https://www.indiamart.com/proddetail/lg-drain-motor-2858463431362.html' },
        { what: 'Front-load drain motor 230 V 25 W', price: 900, kind: 'compatible', where: 'IndiaMART, Spydertech India, Borivali West', url: 'https://dir.indiamart.com/impcat/washing-machine-drain-motor.html?biz=30' },
        { what: 'Bosch front-load drain pump (trade, 20 pcs)', price: 1000, kind: 'trade', where: 'IndiaMART, Quick Services, Kurla West', url: 'https://www.indiamart.com/quickservices-maharastra/industrial-pump.html' }
      ]
    },
    {
      id: 'wm-drain-motor', name: 'Top-load washing machine drain motor', short: 'Drain motor (top load)', cat: 'washer',
      local: 'drain motor', appliance: 'Top-load washing machine',
      check: 'Match the brand and the 2-pin connector.',
      keywords: ['drain motor', 'torque motor', 'top load', 'not draining'],
      obs: [
        { what: 'LG drain motor, DC, original', price: 875, kind: 'genuine', where: 'IndiaMART, Rohit Enterprises, Vashi', url: 'https://dir.indiamart.com/thane/washing-machine-spare-parts.html?biz=40' },
        { what: 'LG drain motor', price: 625, kind: 'compatible', where: 'IndiaMART, Rohit Enterprises, Vashi', url: 'https://dir.indiamart.com/impcat/washing-machine-drain-motor.html?biz=40' },
        { what: 'Top-load drain motor 25 W, all brands', price: 350, kind: 'compatible', where: 'IndiaMART, Spydertech India, Borivali West', url: 'https://www.indiamart.com/proddetail/washing-machine-drum-support-bracket-15302219112.html' },
        { what: 'Washing machine drain motor', price: 550, kind: 'compatible', where: 'IndiaMART, Zee Service Centre, Mumbai', url: 'https://www.indiamart.com/zeeservicecenter/washing-machine-motor.html' },
        { what: 'Single-phase drain motor', price: 800, kind: 'compatible', where: 'IndiaMART, Mahindra Refrigeration, Bhayandar', url: 'https://www.indiamart.com/proddetail/washing-machine-drain-motor-22098390148.html' },
        { what: 'Single-phase drain motor (trade)', price: 325, kind: 'trade', where: 'IndiaMART, Times Enterprises, Mumbai', url: 'https://dir.indiamart.com/impcat/washing-machine-drain-motor.html?biz=30' }
      ]
    },
    {
      id: 'wm-inlet-valve', name: 'Washing machine water inlet valve', short: 'Inlet valve', cat: 'washer',
      local: 'inlet valve', appliance: 'Washing machine (top or front load)',
      check: 'Match the number of ways (1-in/2-out etc.), voltage and connector.',
      keywords: ['inlet valve', 'not filling', 'water not coming', 'no water', 'water inlet', 'filling'],
      obs: [
        { what: 'Samsung inlet feed valve (typical Mumbai price, Oct 2026)', price: 400, kind: 'compatible', where: 'IndiaMART, Mumbai directory', url: 'https://dir.indiamart.com/mumbai/washing-machine-components.html' },
        { what: 'LG top-load inlet valve (typical Thane price, Oct 2026)', price: 600, kind: 'compatible', where: 'IndiaMART, Thane directory', url: 'https://dir.indiamart.com/thane/washing-machine-spare-parts.html' },
        { what: '3-way front-load inlet valve', price: 1500, kind: 'compatible', where: 'IndiaMART, Mumbai directory', url: 'https://dir.indiamart.com/mumbai/washing-machine-spare-parts.html' }
      ]
    },
    {
      id: 'wm-timer', name: 'Semi-automatic washing machine wash timer', short: 'Wash timer', cat: 'washer',
      local: 'timer', appliance: 'Semi-automatic washing machine',
      check: 'Match single or double shaft and the brand.',
      keywords: ['timer', 'wash timer', 'semi automatic', 'knob', 'spin timer'],
      obs: [
        { what: 'LG wash timer', price: 175, kind: 'compatible', where: 'IndiaMART, Rohit Enterprises, Vashi', url: 'https://www.indiamart.com/proddetail/godrej-7002-semi-automatic-washing-machine-wash-timer-2852808390862.html' },
        { what: 'Washing machine timer, 12 V', price: 145, kind: 'compatible', where: 'IndiaMART, Times Enterprises, Mumbai', url: 'https://www.indiamart.com/proddetail/godrej-7002-semi-automatic-washing-machine-wash-timer-2852808390862.html' },
        { what: 'ADN 42-min twin wash timer for LG', price: 550, kind: 'compatible', where: 'IndiaMART, The Spare Hub, Bhiwandi', url: 'https://www.indiamart.com/proddetail/adn-42m-twin-ss-6w-washing-machine-timer-2855365088730.html' }
      ]
    },
    {
      id: 'geyser-element', name: 'Geyser heating element 2000 W', short: 'Geyser element', cat: 'geyser',
      local: 'element · हीटिंग एलिमेंट', appliance: 'Storage geyser',
      check: 'Match wattage, flange shape (round / triangle) and length.',
      keywords: ['element', 'heating element', 'geyser not heating', 'no hot water', 'garam pani nahi', 'heater'],
      obs: [
        { what: 'Sunhot 2000 W triangle element with thermostat', price: 527, kind: 'genuine', where: 'Moglix', url: 'https://www.moglix.com/sunhot-2000w-triangle-type-water-geyser-heating-element-with-thermostat/mp/msnm9xyz7rgdkj' },
        { what: 'Copper element 2 kW, 11 inch', price: 150, kind: 'compatible', where: 'IndiaMART, M & Z Imports, Lamington Road', url: 'https://www.indiamart.com/proddetail/copper-heating-elements-12654589230.html' },
        { what: 'Copper element 11 inch, boxed (typical Mumbai price)', price: 200, kind: 'compatible', where: 'IndiaMART, Mumbai directory', url: 'https://dir.indiamart.com/mumbai/water-heater-elements.html' },
        { what: 'S-type 2000 W horizontal element', price: 690, kind: 'compatible', where: 'IndiaMART, Simro Industrial Heater, Mumbai', url: 'https://dir.indiamart.com/mumbai/water-heater-elements.html' },
        { what: 'Triangle-flange copper element, 11 inch', price: 780, kind: 'compatible', where: 'IndiaMART, M & Z Imports, Lamington Road', url: 'https://www.indiamart.com/proddetail/copper-heating-elements-12654589230.html' }
      ]
    },
    {
      id: 'geyser-thermostat', name: 'Geyser thermostat (stem / rod type)', short: 'Geyser thermostat', cat: 'geyser',
      local: 'thermostat · थर्मोस्टेट', appliance: 'Storage geyser',
      check: 'Match the stem length (7" or 11") and the cut-off type.',
      keywords: ['thermostat', 'geyser', 'water too hot', 'geyser tripping', 'cut off', 'cutoff'],
      obs: [
        { what: 'Expo 7" stem thermostat (MRP ₹499)', price: 366, kind: 'genuine', where: 'Flipkart', url: 'https://www.flipkart.com/expo-geyser-thermostat-electric-water-heater-thermostat-7-7-inches-175-mm-temperature-sensor-controller-electronic-hobby-kit/p/itmb4256c86f55b7' },
        { what: 'Expo 7" reset / cut-off thermostat', price: 285, kind: 'genuine', where: 'Flipkart', url: 'https://www.flipkart.com/expo-geyser-thermostat-reset-cut-off-electric-water-heater-reset-cut-off-7-7-inches-175-mm-temperature-sensor-controller-electronic-hobby-kit/p/itm7fceaac3b9868' },
        { what: 'Racold 11" stem thermostat, copper', price: 625, kind: 'genuine', where: 'IndiaMART, M & Z Imports, Lamington Road', url: 'https://www.indiamart.com/proddetail/girish-ego-stem-thermal-cut-out-thermo-stat-11787710433.html' },
        { what: 'Geyser thermostat with brass stem', price: 150, kind: 'compatible', where: 'IndiaMART, Bohra Engineering, Mumbai', url: 'https://www.indiamart.com/proddetail/girish-ego-stem-thermal-cut-out-thermo-stat-11787710433.html' },
        { what: 'Girish Ego 20 A stem thermal cut-out', price: 125, kind: 'compatible', where: 'IndiaMART, Girish Ego Controls, Mumbai', url: 'https://www.indiamart.com/proddetail/girish-ego-stem-thermal-cut-out-thermo-stat-11787710433.html' },
        { what: '11" geyser thermostat (trade)', price: 100, kind: 'trade', where: 'IndiaMART, M & Z Imports, Lamington Road', url: 'https://www.indiamart.com/proddetail/geyser-thermostat-14078726897.html' }
      ]
    },
    {
      id: 'fridge-defrost-timer', name: 'Refrigerator defrost timer', short: 'Defrost timer', cat: 'fridge',
      local: 'defrost timer', appliance: 'Frost-free refrigerator',
      check: 'Match the brand, the hours (e.g. 8 h) and the pin layout.',
      keywords: ['defrost', 'defrost timer', 'ice in freezer', 'fridge not cooling', 'frost'],
      obs: [
        { what: 'Godrej refrigerator defrost timer', price: 500, kind: 'genuine', where: 'Flipkart', url: 'https://www.flipkart.com/godrej-refrigerator-defrost-timer/p/itmffbpjkf5fycdn' },
        { what: 'Whirlpool refrigerator defrost timer', price: 500, kind: 'genuine', where: 'Flipkart', url: 'https://flipkart.com/whirlpool-refrigerator-defrost-timer/p/itmfex5hwbqnyz6e' },
        { what: 'Refrigeration FF timer (trade)', price: 200, kind: 'trade', where: 'IndiaMART, Anand Refrigeration, Mumbai', url: 'https://www.indiamart.com/anand-refrigeration-mumbai/refrigerator-spare-parts.html' }
      ]
    },
    {
      id: 'fridge-thermostat', name: 'Refrigerator thermostat', short: 'Fridge thermostat', cat: 'fridge',
      local: 'thermostat', appliance: 'Direct-cool or frost-free refrigerator',
      check: 'Match single or double door and the capillary length.',
      keywords: ['fridge thermostat', 'refrigerator thermostat', 'fridge too cold', 'fridge not cooling', 'single door'],
      obs: [
        { what: 'Godrej Smart Care refrigerator thermostat', price: 650, kind: 'genuine', where: 'IndiaMART, A.R Engineering, Mumbai', url: 'https://www.indiamart.com/proddetail/godrej-smart-care-refrigerator-thermostat-2852880433533.html' },
        { what: 'WDF18-L freezer / fridge thermostat', price: 300, kind: 'compatible', where: 'IndiaMART, Bhoomi Electricals, Mumbai', url: 'https://www.indiamart.com/bhoomi-electricals-mumbai/refrigerator-spare-parts.html' },
        { what: 'Refrigerator thermostat', price: 200, kind: 'compatible', where: 'IndiaMART, Bhoomi Electricals, Mumbai', url: 'https://www.indiamart.com/bhoomi-electricals-mumbai/refrigerator-spare-parts.html' },
        { what: 'Godrej refrigerator thermostat', price: 100, kind: 'compatible', where: 'IndiaMART, Times Enterprises, Mumbai', url: 'https://www.indiamart.com/proddetail/godrej-refrigerator-thermostat-22865751588.html' }
      ]
    },
    {
      id: 'fridge-olp', name: 'Refrigerator compressor relay / OLP', short: 'Relay / OLP', cat: 'fridge',
      local: 'relay · OLP', appliance: 'Refrigerator compressor',
      check: 'Match the compressor make and the relay pin type.',
      keywords: ['relay', 'olp', 'overload', 'compressor clicking', 'tik tik', 'fridge not starting'],
      obs: [
        { what: 'Relay + OLP for Godrej single-door fridge', price: 165, kind: 'compatible', where: 'IndiaMART, Mumbai directory', url: 'https://dir.indiamart.com/mumbai/refrigerator-spare-parts.html' },
        { what: 'Godrej relay', price: 108, kind: 'compatible', where: 'IndiaMART, Mumbai directory', url: 'https://dir.indiamart.com/mumbai/refrigeration-relays.html' },
        { what: 'Refrigeration relay (trade)', price: 45, kind: 'trade', where: 'IndiaMART, Mumbai directory', url: 'https://dir.indiamart.com/mumbai/refrigeration-relays.html' }
      ]
    },
    {
      id: 'ac-outdoor-motor', name: 'Split AC outdoor fan motor', short: 'AC outdoor motor', cat: 'ac',
      local: 'outdoor motor', appliance: 'Split AC outdoor unit',
      check: 'Match wattage, shaft size, rotation and mounting.',
      keywords: ['outdoor motor', 'outdoor fan not running', 'fan motor', 'ac fan motor'],
      obs: [
        { what: 'LG outdoor AC motor', price: 4250, kind: 'genuine', where: 'IndiaMART, Shree Punrasar Enterprises, Andheri', url: 'https://www.indiamart.com/shreepunrasarenterprises/air-conditioner-motor.html' },
        { what: 'Samsung outdoor unit motor', price: 1550, kind: 'genuine', where: 'IndiaMART, Shree Punrasar Enterprises, Andheri', url: 'https://www.indiamart.com/shreepunrasarenterprises/air-conditioner-motor.html' },
        { what: 'Split AC outdoor motor 25 W (for Voltas)', price: 2150, kind: 'compatible', where: 'IndiaMART, Z. Cool Technology, Dharavi', url: 'https://www.indiamart.com/proddetail/air-conditioner-outdoor-motor-26248521948.html' },
        { what: 'Split outdoor fan motor, 1.5 ton (typical Mumbai price)', price: 1200, kind: 'compatible', where: 'IndiaMART, Mumbai directory', url: 'https://dir.indiamart.com/mumbai/ac-fan-motor.html' },
        { what: 'AC outdoor fan motor, 220 V', price: 900, kind: 'compatible', where: 'IndiaMART, Mahavir Enterprises, Jogeshwari East', url: 'https://dir.indiamart.com/impcat/split-phase-motor.html?biz=30' },
        { what: 'Hitachi-fit outdoor motor 1.5 ton (trade, 100 pcs)', price: 650, kind: 'trade', where: 'IndiaMART, Sana Electrical, Sion', url: 'https://www.indiamart.com/proddetail/hitachi-ac-outdoor-motor-2851934474812.html' }
      ]
    },
    {
      id: 'ac-blower', name: 'Split AC indoor blower (1.5 ton)', short: 'AC blower', cat: 'ac',
      local: 'blower', appliance: 'Split AC indoor unit',
      check: 'Match length, diameter and shaft hole.',
      keywords: ['blower', 'indoor fan', 'ac noise', 'cross flow fan'],
      obs: [
        { what: 'Split AC indoor blower', price: 800, kind: 'compatible', where: 'IndiaMART, Succes Cooling Centre, Mumbai', url: 'https://www.indiamart.com/proddetail/split-air-conditioner-blower-19400485512.html' },
        { what: 'Split AC blower, 2 ton', price: 1000, kind: 'compatible', where: 'IndiaMART, Fusion Aircon, Navi Mumbai', url: 'https://www.indiamart.com/proddetail/split-air-conditioner-blower-19400485512.html' }
      ]
    }
  ];

  // Invented demo shops: they show how the market answers. Clearly labelled on every screen.
  const DEMO_SHOPS = [
    { id: 'demo-ganesh', name: 'Shree Ganesh Appliance Spares', shopNo: 'Shop 14', market: 'Lohar Chawl', cats: ['mixer', 'geyser', 'fan'] },
    { id: 'demo-noor', name: 'Noor Electricals & Spares', shopNo: 'Shop 3B', market: 'Lohar Chawl', cats: ['ac', 'fan'] },
    { id: 'demo-mehta', name: 'Mehta Washing Machine Parts', shopNo: 'Shop 22', market: 'Lohar Chawl', cats: ['washer'] },
    { id: 'demo-kamdar', name: 'Kamdar Refrigeration Stores', shopNo: 'Shop 7', market: 'Lohar Chawl', cats: ['fridge', 'ac', 'geyser'] },
    { id: 'demo-newbharat', name: 'New Bharat Spares', shopNo: 'Shop 31', market: 'Lohar Chawl', cats: ['mixer'] },
    { id: 'demo-royal', name: 'Royal Cool Parts', shopNo: 'Shop 9A', market: 'Lamington Road', cats: ['ac'] },
    { id: 'demo-jaiambe', name: 'Jai Ambe Electric', shopNo: 'Shop 18', market: 'Kurla', cats: ['geyser', 'fan'] },
    { id: 'demo-patel', name: 'Patel Brothers Spares', shopNo: 'Shop 2', market: 'Dadar', cats: ['washer', 'mixer'] },
    { id: 'demo-alhabib', name: 'Al-Habib Motor Winding', shopNo: 'Shop 27', market: 'Vashi', cats: ['washer', 'fan', 'ac'] },
    { id: 'demo-saikrupa', name: 'Sai Krupa Electronics', shopNo: 'Shop 11', market: 'Andheri', cats: ['ac', 'fridge'] },
    { id: 'demo-vardhman', name: 'Vardhman Appliance Hub', shopNo: 'Shop 40', market: 'Lohar Chawl', cats: ['mixer', 'geyser'] },
    { id: 'demo-omsai', name: 'Om Sai Spares', shopNo: 'Shop 5', market: 'Thane', cats: ['mixer', 'ac', 'fan'] },
    { id: 'demo-classic', name: 'Classic Geyser Centre', shopNo: 'Shop 16', market: 'Borivali', cats: ['geyser'] },
    { id: 'demo-fine', name: 'Fine Washer Spares', shopNo: 'Shop 35', market: 'Kandivali', cats: ['washer', 'fridge'] }
  ];

  // Mumbai areas, grouped by zone. Used for the buyer's area, shop sign-up and the market filter.
  const ZONES = ['South Mumbai', 'Central Mumbai', 'Western Suburbs', 'Eastern Suburbs', 'Thane & beyond', 'Navi Mumbai'];
  const AREAS = [
    // South Mumbai
    { id: 'colaba', name: 'Colaba', zone: 'South Mumbai' },
    { id: 'fort', name: 'Fort', zone: 'South Mumbai', aka: ['cst', 'vt'] },
    { id: 'churchgate', name: 'Churchgate', zone: 'South Mumbai' },
    { id: 'crawford-market', name: 'Crawford Market', zone: 'South Mumbai', aka: ['crawford', 'masjid bunder', 'masjid'] },
    { id: 'lohar-chawl', name: 'Lohar Chawl', zone: 'South Mumbai', aka: ['kalbadevi', 'lohar chal'] },
    { id: 'pydhonie', name: 'Pydhonie', zone: 'South Mumbai' },
    { id: 'girgaon', name: 'Girgaon', zone: 'South Mumbai', aka: ['girgaum', 'charni road'] },
    { id: 'grant-road', name: 'Grant Road', zone: 'South Mumbai', aka: ['nana chowk'] },
    { id: 'lamington-road', name: 'Lamington Road', zone: 'South Mumbai', aka: ['lamington'] },
    { id: 'mumbai-central', name: 'Mumbai Central', zone: 'South Mumbai', aka: ['bombay central'] },
    { id: 'tardeo', name: 'Tardeo', zone: 'South Mumbai' },
    { id: 'byculla', name: 'Byculla', zone: 'South Mumbai' },
    { id: 'mazgaon', name: 'Mazgaon', zone: 'South Mumbai' },
    // Central Mumbai
    { id: 'worli', name: 'Worli', zone: 'Central Mumbai' },
    { id: 'lower-parel', name: 'Lower Parel', zone: 'Central Mumbai', aka: ['parel west'] },
    { id: 'prabhadevi', name: 'Prabhadevi', zone: 'Central Mumbai' },
    { id: 'parel', name: 'Parel', zone: 'Central Mumbai' },
    { id: 'dadar', name: 'Dadar', zone: 'Central Mumbai' },
    { id: 'matunga', name: 'Matunga', zone: 'Central Mumbai', aka: ['kings circle'] },
    { id: 'wadala', name: 'Wadala', zone: 'Central Mumbai' },
    { id: 'mahim', name: 'Mahim', zone: 'Central Mumbai' },
    { id: 'dharavi', name: 'Dharavi', zone: 'Central Mumbai' },
    { id: 'sion', name: 'Sion', zone: 'Central Mumbai', aka: ['sion koliwada'] },
    // Western Suburbs
    { id: 'bandra', name: 'Bandra', zone: 'Western Suburbs' },
    { id: 'khar', name: 'Khar', zone: 'Western Suburbs' },
    { id: 'santacruz', name: 'Santacruz', zone: 'Western Suburbs', aka: ['santa cruz'] },
    { id: 'vile-parle', name: 'Vile Parle', zone: 'Western Suburbs', aka: ['parle', 'vileparle'] },
    { id: 'juhu', name: 'Juhu', zone: 'Western Suburbs' },
    { id: 'andheri', name: 'Andheri', zone: 'Western Suburbs', aka: ['marol', 'chakala', 'versova', 'lokhandwala', 'mahakali'] },
    { id: 'jogeshwari', name: 'Jogeshwari', zone: 'Western Suburbs', aka: ['jogeshwary'] },
    { id: 'goregaon', name: 'Goregaon', zone: 'Western Suburbs' },
    { id: 'malad', name: 'Malad', zone: 'Western Suburbs', aka: ['kurar', 'malvani'] },
    { id: 'kandivali', name: 'Kandivali', zone: 'Western Suburbs', aka: ['kandivli', 'kandhivali', 'kandivili', 'charkop'] },
    { id: 'borivali', name: 'Borivali', zone: 'Western Suburbs', aka: ['borivli', 'gorai'] },
    { id: 'dahisar', name: 'Dahisar', zone: 'Western Suburbs' },
    { id: 'mira-road', name: 'Mira Road', zone: 'Western Suburbs', aka: ['mira bhayandar', 'mira'] },
    { id: 'bhayandar', name: 'Bhayandar', zone: 'Western Suburbs', aka: ['bhayander', 'bhayendar'] },
    // Eastern Suburbs
    { id: 'kurla', name: 'Kurla', zone: 'Eastern Suburbs' },
    { id: 'sakinaka', name: 'Sakinaka', zone: 'Eastern Suburbs', aka: ['saki naka', 'asalpha'] },
    { id: 'powai', name: 'Powai', zone: 'Eastern Suburbs' },
    { id: 'ghatkopar', name: 'Ghatkopar', zone: 'Eastern Suburbs', aka: ['pant nagar'] },
    { id: 'vikhroli', name: 'Vikhroli', zone: 'Eastern Suburbs' },
    { id: 'kanjurmarg', name: 'Kanjurmarg', zone: 'Eastern Suburbs' },
    { id: 'bhandup', name: 'Bhandup', zone: 'Eastern Suburbs' },
    { id: 'mulund', name: 'Mulund', zone: 'Eastern Suburbs' },
    { id: 'chembur', name: 'Chembur', zone: 'Eastern Suburbs', aka: ['tilak nagar'] },
    { id: 'govandi', name: 'Govandi', zone: 'Eastern Suburbs' },
    { id: 'mankhurd', name: 'Mankhurd', zone: 'Eastern Suburbs' },
    // Thane & beyond
    { id: 'thane', name: 'Thane', zone: 'Thane & beyond', aka: ['thana'] },
    { id: 'kalwa', name: 'Kalwa', zone: 'Thane & beyond' },
    { id: 'dombivli', name: 'Dombivli', zone: 'Thane & beyond', aka: ['dombivali'] },
    { id: 'kalyan', name: 'Kalyan', zone: 'Thane & beyond' },
    { id: 'bhiwandi', name: 'Bhiwandi', zone: 'Thane & beyond' },
    { id: 'vasai-virar', name: 'Vasai-Virar', zone: 'Thane & beyond', aka: ['vasai', 'virar', 'nalasopara'] },
    // Navi Mumbai
    { id: 'airoli', name: 'Airoli', zone: 'Navi Mumbai' },
    { id: 'ghansoli', name: 'Ghansoli', zone: 'Navi Mumbai' },
    { id: 'vashi', name: 'Vashi', zone: 'Navi Mumbai', aka: ['juhugaon'] },
    { id: 'turbhe', name: 'Turbhe', zone: 'Navi Mumbai' },
    { id: 'sanpada', name: 'Sanpada', zone: 'Navi Mumbai' },
    { id: 'nerul', name: 'Nerul', zone: 'Navi Mumbai' },
    { id: 'belapur', name: 'Belapur', zone: 'Navi Mumbai', aka: ['cbd belapur'] },
    { id: 'kharghar', name: 'Kharghar', zone: 'Navi Mumbai' },
    { id: 'panvel', name: 'Panvel', zone: 'Navi Mumbai' }
  ];
  const AREA_BY_NAME = Object.fromEntries(AREAS.map(a => [a.name.toLowerCase(), a]));
  const NO_AREA = 'Area not listed';

  // Real businesses from public listings, by Mumbai area. NOT Purza partners; shown so the team knows who to sign up first.
  const PUBLIC_LISTINGS = [
    { name: 'Shree NM Electricals Ltd', area: 'Lohar Chawl', address: '45/47 Lohar Chawl', sells: 'Electrical supplies for electricians and contractors', source: 'Explurger', url: 'https://www.explurger.com/pd/gp1c88aqc0nnrp0vg' },
    { name: 'Havells Galaxy – B C Appliances', area: 'Lohar Chawl', address: 'No 71, Kerawalla Bldg, KM Sharma Marg, Lohar Chawl, Kalbadevi', sells: 'Havells home appliances and electricals', source: 'Havells store locator', url: 'https://partners.havells.com/near-me/mumbai/kalbadevi/havells-galaxy-b-c-appliances-in-kalbadevi-mumbai--3ih4rI/home' },
    { name: 'Kirtikumar Electric Corporation', area: 'Lohar Chawl', address: 'Shop 12, Tavawala Building, Lohar Chawl, Kalbadevi', sells: 'Havells authorised partner: appliances and electricals', source: 'Havells store locator', url: 'https://partners.havells.com/near-me/mumbai/kalbadevi/havells-authorised-partner-kirtikumar-electric-corporation-in-kalbadevi-mumbai--4vVZDB/articles/havells-rangmanch-collection-brings-together-art-c--938fb0d1-0211-4f87-b7f2-c572a81d8972' },
    { name: 'Legrand Zip – Industrial Engineers', area: 'Lohar Chawl', address: 'No 178, Ground Floor, Gopal Niwas, Lohar Chawl', sells: 'Legrand switches and electrical equipment', source: 'Legrand store locator', url: 'https://zip.legrand.co.in/legrand-zip-industrial-engineers-electrical-equipment-manufacturer-lohar-chawl-mumbai-306870/Home' },
    { name: 'Sony Electrics', area: 'Lohar Chawl', address: 'Shop 9B, Jay Mahal Bldg, 20/48 Lohar Chawl', sells: 'Electrical store', source: 'Yappe', url: 'https://yappe.in/maharashtra/mumbai/sony-electrics/1410762' },
    { name: 'Sambhaji Electric Stores', area: 'Lohar Chawl', address: '133 Shamaldas Gandhi Marg, Lohar Chawl, Kalbadevi', sells: 'Electrical supplies', source: 'WorldOrgs directory', url: 'https://in.worldorgs.com/catalog/mumbai/electrical-supply-store/electrical-components' },
    { name: 'Karan Electrical', area: 'Lohar Chawl', address: '33/5 Pathakwadi, Ismail Building, Lohar Chawl, Kalbadevi', sells: 'Electrical supplies', source: 'WorldOrgs directory', url: 'https://in.worldorgs.com/catalog/mumbai/electrical-supply-store/electrical-components' },
    { name: 'Neha Electricals', area: 'Lohar Chawl', address: 'Shop 9, 1/A Tavawala Building, Pathakwadi, Lohar Chawl', sells: 'Electricals', source: 'IndiaMART', url: 'https://m.indiamart.com/nehaelectricals-mumbai' },
    { name: 'Lyon Copper Alloys', area: 'Pydhonie', address: '35/37 Bapu Khote X Lane, Kika Street, Gulalwadi, Pydhonie', sells: 'AC copper pipe', source: 'IndiaMART', url: 'https://dir.indiamart.com/vasai/air-conditioner-parts.html' },
    { name: 'Snatronics', area: 'Lamington Road', address: 'Shop 11, Popular Complex, Abid House, Lamington Road', sells: 'Electronic components incl. capacitors, ICs, diodes', source: 'IndiaMART', url: 'https://m.indiamart.com/snatronics/alcon-capacitor.html' },
    { name: 'DC Electronics', area: 'Lamington Road', address: '8 Ramnivas Building, Tara Temple Lane, Lamington Road', sells: 'Electronic components (resistors and more)', source: 'IndiaMART', url: 'https://m.indiamart.com/dcelectronics/about-us.html' },
    { name: 'Vinita Electronics', area: 'Lamington Road', address: '59 New Hanuman Building, Shamrao Vithal Marg, off Lamington Road', sells: 'Industrial electronic components', source: 'IndiaMART', url: 'https://m.indiamart.com/vinita-electronics' },
    { name: 'Visha Electronics', area: 'Lamington Road', address: 'Lamington Road (opposite the police station, per forum posts)', sells: 'Capacitors and components', source: 'HiFiVision forum', url: 'https://www.hifivision.com/threads/dealers-shops-for-capacitors.50133' },
    { name: 'Pearl Electronics', area: 'Lamington Road', address: '9 Mandodari Building, Shamrao Vithal Marg, off Lamington Road', sells: 'Fan and AC capacitors', source: 'IndiaMART', url: 'https://dir.indiamart.com/impcat/fan-capacitor.html' },
    { name: 'M & Z Imports', area: 'Lamington Road', address: 'Navjivan Commercial Premises, Lamington Road, Mumbai Central', sells: 'Geyser heating elements and thermostats', source: 'IndiaMART', url: 'https://www.indiamart.com/mzimports/industrial-thermostat.html' },
    { name: 'Janta Automobiles', area: 'Lamington Road', address: 'Saraswati Bhavan, Lamington Rd, near Minerva Talkies', sells: 'Auto parts (for the car phase)', source: 'Carchhe', url: 'https://www.carchhe.com/auto-parts-store/mumbai/janta-automobiles' },
    { name: 'Marudhar Auto Parts', area: 'Lamington Road', address: 'Lamington Rd, Grant Road East', sells: 'Auto parts (for the car phase)', source: 'Carchhe', url: 'https://www.carchhe.com/auto-parts-store/mumbai/marudhar-auto-parts' },
    { name: 'Central Auto India Pvt Ltd', area: 'Grant Road', address: 'Jyoti Studio Compound, Kennedy Bridge, Nana Chowk, Grant Road', sells: 'Air-conditioner parts (listed under HSN 8415)', source: 'IndiaMART', url: 'https://m.indiamart.com/centralautoindia' },
    { name: 'Mahesh Chheda & Co.', area: 'Grant Road', address: 'Grant Road', sells: 'Fan capacitors', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/fan-capacitor.html' },
    { name: 'R R Assembles', area: 'Prabhadevi', address: '164 Kaliandas Udyog Bhavan, Sadanand Tandel Marg, Prabhadevi', sells: 'Plastic refrigerator fittings', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/refrigerator-components.html' },
    { name: 'Bhairav Plastic', area: 'Dadar', address: 'Dadar', sells: 'Mixer grinder bodies and jar lids', source: 'IndiaMART', url: 'https://www.indiamart.com/proddetail/mixer-grinder-body-futura-14627550162.html' },
    { name: 'Z. Cool Technology', area: 'Dharavi', address: 'Dharavi', sells: 'AC outdoor motors and parts', source: 'IndiaMART', url: 'https://m.indiamart.com/proddetail/air-conditioner-outdoor-motor-2852874477262.html' },
    { name: 'Air-O-Tech Enterprises', area: 'Dharavi', address: 'Shop 4, Plot 501, Rajiv Darshan, Dharavi Loop Road', sells: 'Split AC fan motors', source: 'IndiaMART', url: 'https://dir.indiamart.com/impcat/split-phase-motor.html?biz=30' },
    { name: 'Sana Electrical', area: 'Sion', address: 'Sunder Kamla Nagar, Laxmibai Kelkar Marg, Sion', sells: 'Split AC outdoor motors', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/air-conditioner-motor.html' },
    { name: 'Mega Cool (India)', area: 'Andheri', address: 'Link Road, Andheri West', sells: 'AC spare parts, motors, remotes', source: 'IndiaMART', url: 'https://m.indiamart.com/mega-cool-india/profile.html' },
    { name: 'Shree Punrasar Enterprises', area: 'Andheri', address: 'Andheri', sells: 'AC motors, capacitors and parts; fridge door locks', source: 'IndiaMART', url: 'https://www.indiamart.com/shreepunrasarenterprises/air-conditioner-motor.html' },
    { name: 'Airconditioning Spares Centre', area: 'Andheri', address: 'Andheri East', sells: 'AC compressors, condensing units, copper fittings', source: 'IndiaMART', url: 'https://www.indiamart.com/airconditioning-spares-centre/profile.html' },
    { name: 'Galaxy Aircon', area: 'Andheri', address: 'Andheri East', sells: 'AC units and AC parts', source: 'IndiaMART', url: 'https://www.indiamart.com/galaxyaircon/profile.html' },
    { name: 'Evercool', area: 'Andheri', address: 'Andheri East', sells: 'AC parts and window ACs', source: 'IndiaMART', url: 'https://www.indiamart.com/evercool-air-conditiong/aboutus.html' },
    { name: 'Star Refrigeration Systems', area: 'Andheri', address: 'Shop 03, opp. Mirage Hotel, Marol Naka, Andheri–Kurla Road, Andheri East', sells: 'Refrigeration compressor oil and AC spares', source: 'IndiaMART', url: 'https://dir.indiamart.com/vasai/air-conditioner-parts.html' },
    { name: 'Elmech Industries', area: 'Andheri', address: '32 Madhuban Industrial Estate, Mahakali Caves Road, Andheri East', sells: 'Geyser stem thermostats, thermal fuses, overload protectors (maker)', source: 'IndiaMART', url: 'https://m.indiamart.com/elmech-inds/testimonial.html' },
    { name: 'Mahavir Enterprises', area: 'Jogeshwari', address: 'No. 3, Ushakal, H. F. Society Road, Jogeshwari East', sells: 'Fridge timers and defrost sensors, AC fan motors and capacitors, cooler parts', source: 'IndiaMART', url: 'https://www.indiamart.com/proddetail/refrigerator-defrost-sensor-23504331788.html' },
    { name: 'Refrigeration Spare Centre', area: 'Goregaon', address: 'Goregaon West', sells: 'Refrigerant gas, compressor oil, AC copper pipe, drain pumps', source: 'IndiaMART', url: 'https://www.indiamart.com/arhamelectric/profile.html' },
    { name: 'Jagdumm Refrigeration Company', area: 'Goregaon', address: 'Unit 110, Vasupujya Industrial Estate, Goregaon East', sells: 'Refrigeration and HVAC compressor spares', source: 'IndiaMART', url: 'https://www.indiamart.com/proddetail/compressor-spare-parts-6256988762.html' },
    { name: 'Mamta Mobile & Electronics', area: 'Malad', address: 'Malad East', sells: 'Washing machine spare parts and PCBs', source: 'IndiaMART', url: 'https://m.indiamart.com/mamta-mobile-electronics/testimonial.html' },
    { name: 'Just Repair LLP', area: 'Kandivali', address: 'D-08, Plot 610, Vishwa Parijat, Sector 6, Kandivali West', sells: 'Washing machine, refrigerator and IFB dryer spare parts', source: 'IndiaMART', url: 'https://www.indiamart.com/justrepairllp/profile.html' },
    { name: 'Rudra Enterprises', area: 'Kandivali', address: 'Kandivali West', sells: 'Washing machine parts incl. LG drain motors', source: 'IndiaMART', url: 'https://www.indiamart.com/proddetail/lg-drain-motor-2858463431362.html' },
    { name: 'Premier Consultancy & Sales Agency', area: 'Kandivali', address: '303 V Mall, Thakur Complex, Kandivali East', sells: 'Refrigeration compressor spares (commercial)', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/refrigeration-spares.html' },
    { name: 'Spydertech India', area: 'Borivali', address: 'IC Colony, Borivali West', sells: 'Washing machine spare parts, drain motors (maker)', source: 'IndiaMART', url: 'https://m.indiamart.com/spydertechindia' },
    { name: 'Bralcom (India)', area: 'Borivali', address: '302 Kuber Bhavan, SVP Road, near Ram Mandir, Borivali West', sells: 'Refrigeration compressor spares', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/refrigeration-compressor-spares.html?biz=10' },
    { name: 'Aadil Trading Co.', area: 'Dahisar', address: 'Dahisar East', sells: 'Washing machine parts, PCBs, doors', source: 'IndiaMART', url: 'https://m.indiamart.com/aadiltradingco/washing-machine.html' },
    { name: 'Wash Mech', area: 'Dahisar', address: 'Dahisar East', sells: 'Washing machine bodies, drums, spiders, IFB drain motors', source: 'IndiaMART', url: 'https://www.indiamart.com/washmech-mumbai/washing-machine-spare-parts.html' },
    { name: 'Shetrapal Sales & Services', area: 'Mira Road', address: 'Shop 15, Gagan Deep Bldg, Pleasant Park, Mira Road East', sells: 'Samsung and LG washing machine spare parts', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/washing-machine-components.html' },
    { name: 'MP Electronics', area: 'Mira Road', address: 'Shop 10, MIDC Road, Mira Road East', sells: 'Washing machine parts', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/washing-machine-components.html' },
    { name: 'Amit Enterprises', area: 'Mira Road', address: 'Mira Road East', sells: 'AC brackets, washing machine and fridge stands', source: 'IndiaMART', url: 'https://www.indiamart.com/amit-entps-thane/aboutus.html' },
    { name: 'Dilson Enterprises', area: 'Bhayandar', address: 'Bhayandar West', sells: 'Ceiling fan capacitors', source: 'IndiaMART', url: 'https://www.indiamart.com/proddetail/icar-capacitors-2895371048.html' },
    { name: 'Mahindra Refrigeration', area: 'Bhayandar', address: 'Bhayandar', sells: 'Washing machine drain motors', source: 'IndiaMART', url: 'https://www.indiamart.com/proddetail/washing-machine-drain-motor-22098390148.html' },
    { name: 'Universal Gears', area: 'Bhayandar', address: 'Bhayandar East', sells: 'Washing machine filters, pulsators, stands', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/washing-machine-spare-parts.html?biz=10' },
    { name: 'Quick Services', area: 'Kurla', address: '1st Floor, R No 22, Iqbal Chawl, Kherani Road, Kurla West', sells: 'Washing machine PCBs, drain pumps, door hinges', source: 'IndiaMART', url: 'https://www.indiamart.com/quickservices-maharastra/industrial-pump.html' },
    { name: 'Ifaa Air Cool', area: 'Sakinaka', address: '13 Uday Narayan Gupta Chawl, Kherani Road, Sakinaka', sells: 'AC and refrigeration spares', source: 'IndiaMART', url: 'https://m.indiamart.com/ifaaaircool/testimonial.html' },
    { name: 'Falcon Refrigeration', area: 'Ghatkopar', address: 'Gala 6, Pant Nagar, Sant Dyaneshwar Marg, Ghatkopar East', sells: 'Refrigerator components', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/refrigerator-components.html' },
    { name: 'Ultracool Systems', area: 'Ghatkopar', address: '18 Sagar Bonanza, Khot Lane, near the station, Ghatkopar West', sells: 'Refrigerator spares and equipment', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/refrigerator-spare-parts.html?biz=40' },
    { name: 'S S Engineering', area: 'Vikhroli', address: 'Gala B-6, Hariyali Industrial Estate, Vikhroli West', sells: 'Refrigeration compressor spares (commercial)', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/refrigeration-compressor-spares.html?biz=10' },
    { name: 'Sanjay Enterprises', area: 'Mulund', address: 'Shop 1, Sobha Apartment, S.N. Road, near Tambe Nagar, Mulund West', sells: 'Refrigerator timers', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/defrost-timers.html' },
    { name: 'A R Enterprises', area: 'Chembur', address: 'Shop 5, Mukti Nagar, Chembur', sells: 'AC, refrigeration, water-cooler and deep-freezer spares; refrigerant gas', source: 'IndiaMART', url: 'https://www.indiamart.com/arent-mumbai/' },
    { name: 'United Hvac Pvt Ltd', area: 'Chembur', address: 'Shop 11, Shell Colony Road, near Tilak Nagar station, Chembur', sells: 'Refrigeration spares', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/refrigeration-spares.html' },
    { name: 'Hari Om Electronics', area: 'Govandi', address: 'Kamat Bungalow, Govandi Station Road', sells: 'AC capacitors', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/ac-capacitor.html?biz=10' },
    { name: 'Vihana Electronic', area: 'Thane', address: 'Thane', sells: 'LG washing machine spare parts', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/washing-machine-components.html' },
    { name: 'Acme Cool', area: 'Thane', address: 'Thane', sells: 'Washing machine buffers and parts', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/washing-machine-components.html' },
    { name: 'Summer Cool Refrigeration', area: 'Thane', address: 'Thane', sells: 'Washing machine pulsators', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/washing-machine-spare-parts.html' },
    { name: 'The Spare Hub', area: 'Bhiwandi', address: 'Bhiwandi', sells: 'Washing machine timers and drain motors', source: 'IndiaMART', url: 'https://www.indiamart.com/proddetail/adn-42m-twin-ss-6w-washing-machine-timer-2855365088730.html' },
    { name: 'Pradeep Refrigeration', area: 'Vasai-Virar', address: 'Vasai–Virar', sells: 'LG washing machine gearboxes', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/washing-machine-spare-parts.html' },
    { name: 'Rohit Enterprises', area: 'Vashi', address: 'Shop 27, Landmark CHS, Sector 14, Vashi', sells: 'LG washing machine PCBs, drain motors, pulsators; fridge motors and shelves', source: 'IndiaMART', url: 'https://www.indiamart.com/rohitenterprisesmumbaimaharashtra/refrigerator-trays.html' },
    { name: 'Airmax Corporation', area: 'Vashi', address: 'Shop 1, Kamble Niwas, Juhugaon, Sector 11, Vashi', sells: 'Refrigerator condensers', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/refrigerator-spare-parts.html' },
    { name: 'Pushkar Trading Co.', area: 'Turbhe', address: 'Shop 5, A-128, near ICL School, Sector 21, Turbhe', sells: 'Refrigeration charging lines', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/refrigerator-spare-parts.html' },
    { name: 'Simran Refrigeration', area: 'Nerul', address: 'Shanti Sadan, Plot C/9, Shop 8, Nerul West', sells: 'Refrigerator pipes', source: 'IndiaMART', url: 'https://dir.indiamart.com/thane/refrigerator-spare-parts.html' },
    { name: 'Electrofix Services.Com', area: 'Area not listed', address: 'Mumbai', sells: 'Microwave, washing machine and refrigerator parts', source: 'IndiaMART', url: 'https://m.indiamart.com/electrofix-services/products-and-services.html' },
    { name: 'Anand Refrigeration', area: 'Area not listed', address: 'Mumbai', sells: 'Fridge timers, relays and OLPs; AC drain pumps', source: 'IndiaMART', url: 'https://www.indiamart.com/anand-refrigeration-mumbai/refrigerator-spare-parts.html' },
    { name: 'Bhoomi Electricals', area: 'Area not listed', address: 'Mumbai', sells: 'Washing machine drain pumps and drums; fridge thermostats', source: 'IndiaMART', url: 'https://www.indiamart.com/bhoomi-electricals-mumbai/washing-machine-spare-parts.html' },
    { name: 'Rishabh Enterprises', area: 'Area not listed', address: 'Mumbai', sells: 'Fan and AC capacitors', source: 'IndiaMART', url: 'https://dir.indiamart.com/mumbai/fan-capacitor.html' },
    { name: 'Rajendra Home Appliances', area: 'Area not listed', address: 'Mumbai', sells: 'Mixer grinder couplers, jars and bodies', source: 'IndiaMART', url: 'https://www.indiamart.com/rajendra-home-appliances/mixer-grinder-spare-parts.html' },
    { name: 'Times Enterprises', area: 'Area not listed', address: 'Mumbai', sells: 'Washing machine drain motors and timers; fridge thermostats', source: 'IndiaMART', url: 'https://dir.indiamart.com/impcat/washing-machine-drain-motor.html?biz=30' }
  ].map(l => Object.assign(l, { market: l.area, zone: (AREA_BY_NAME[l.area.toLowerCase()] || { zone: NO_AREA }).zone }));

  const FACTS = [
    { stat: '76%', label: 'of Indian consumers use AI tools to search, compare or buy', detail: 'India ranks second of 11 markets surveyed.', source: 'McKinsey via Devdiscourse, Oct 2026', url: 'https://www.devdiscourse.com/article/business/3999410-india-ranks-second-globally-in-ai-powered-shopping-76-consumers-use-ai-tools-mckinsey', group: 'buyers' },
    { stat: '91%', label: 'of online adults in India chat with a business every week', detail: 'Messaging is how Indians talk to businesses.', source: 'Kantar 2025, cited by Meta', url: 'https://about.fb.com/news/2025/09/bringing-new-tools-to-help-businesses-boost-engagement-customer-support-and-discoverability/', group: 'buyers' },
    { stat: '9 in 10', label: 'Indian small and mid-sized businesses can’t be found by ChatGPT or Gemini', detail: 'Study by Zaillor, an AI-visibility firm.', source: 'Punjab Kesari', url: 'https://english.punjabkesari.com/business/study-9-in-10-indian-smes-cannot-be-found-by-chatgpt-or-gemini/', group: 'shops' },
    { stat: '25.47 bn', label: 'UPI payments in October 2026, worth ₹31.53 lakh crore', detail: 'A monthly record; daily value crossed ₹1 lakh crore.', source: 'NPCI via Entrepreneur India', url: 'https://india.entrepreneur.com/business-news/upi-hits-record-25-47-bn-transactions-in-october-daily-value-crosses-inr-1-l-cr', group: 'payments' },
    { stat: '10–15%', label: 'of Indian households own an AC', detail: 'Far below Thailand (38%) or Malaysia (80%): a long runway of new ACs needing parts.', source: 'BCG–CII via Business Today, Sep 2026', url: 'https://www.businesstoday.in/india/story/only-1-in-10-indian-households-has-an-ac-why-indias-appliance-market-has-a-long-runway-557625-2026-09-24', group: 'market' },
    { stat: '12.6–12.9 mn', label: 'room ACs expected to sell in India in FY2027', detail: 'A 12–14% rebound after a rainy FY2026.', source: 'ICRA', url: 'https://www.icra.in/Research/ViewResearchReport/7144', group: 'market' },
    { stat: 'US$ 1.49 bn', label: 'India home-appliance repair services market by 2030', detail: 'From US$ 980.67 mn in 2023, growing about 8% a year.', source: 'BlueWeave Consulting', url: 'https://blueweaveconsulting.com/report/india-home-appliance-repair-service-market', group: 'market' },
    { stat: 'US$ 654.6 mn', label: 'India AC servicing market in 2025', detail: 'Projected to reach US$ 1.70 bn by 2035.', source: 'Credence Research', url: 'https://www.credenceresearch.com/report/india-ac-servicing-market', group: 'market' },
    { stat: '~59,000', label: 'monthly active service professionals on Urban Company (Q3 FY26)', detail: 'The organised slice of India’s repair workforce; most technicians work independently.', source: 'Broker report via Business Standard', url: 'https://bsmedia.business-standard.com/_media/bs/data/market-reports/equity-brokertips/2026-02/17721943850.94815000.pdf', group: 'market' },
    { stat: '₹299', label: 'visit charge for an Urban Company AC repair in Mumbai', detail: 'Adjusted in the final bill; parts are bought by the technician.', source: 'Urban Company, Marine Lines page', url: 'https://www.urbancompany.com/mumbai-ac-service-repair-marine-lines', group: 'market' },
    { stat: 'Largest', label: 'Lohar Chawl is Mumbai’s largest wholesale market for electrical goods', detail: 'Near Crawford Market; narrow, crowded lanes, roughly 11 am to 8 pm.', source: 'Wikipedia; Wheels on Our Feet', url: 'https://en.wikipedia.org/wiki/Lohar_Chawl', group: 'markets' },
    { stat: '3rd', label: 'Lamington Road is India’s third-largest grey market for electronics', detail: 'By Grant Road station, packed with component and AC-parts dealers. Hobbyists warn of fake components: genuine labels matter.', source: 'Wikipedia; HiFiVision forum', url: 'https://en.wikipedia.org/wiki/Lamington_Road', group: 'markets' },
    { stat: 'Portal', label: 'The government’s Right to Repair portal lists manuals, part prices and warranty', detail: 'It does not show which local shop has a part today.', source: 'ThePrint', url: 'https://theprint.in/india/govt-launches-right-to-repair-portal-to-promote-circular-economy-reduce-e-waste/1993903/', group: 'markets' },
    { stat: 'US$ 17.7 bn', label: 'India auto parts aftermarket in 2025 (for the car phase)', detail: 'Forecast US$ 36.1 bn by 2034.', source: 'IMARC Group', url: 'https://www.imarcgroup.com/india-auto-parts-aftermarket', group: 'cars' }
  ];

  // Car parts preview (phase 2), following the uploaded architecture: Year / Make / Model + part keyword.
  // SAMPLE catalogue only: real fitment needs a licensed catalogue (ACES-style data).
  const CAR_VEHICLES = [
    { id: 1, year: 2021, make: 'Maruti Suzuki', model: 'Swift', trim: 'VXi' },
    { id: 2, year: 2022, make: 'Hyundai', model: 'Creta', trim: 'SX' },
    { id: 3, year: 2021, make: 'Honda', model: 'City', trim: 'V' },
    { id: 4, year: 2022, make: 'Tata', model: 'Nexon', trim: 'XZ+' },
    { id: 5, year: 2021, make: 'Mahindra', model: 'Bolero', trim: 'B6' }
  ];
  const CAR_PARTS = [
    { id: 1, part_number: 'BRK-SW-F', name: 'Front brake pads', category: 'Brakes', brand: 'Sample', fits: [1] },
    { id: 2, part_number: 'BRK-CR-F', name: 'Front brake pads', category: 'Brakes', brand: 'Sample', fits: [2] },
    { id: 3, part_number: 'OIL-MS-01', name: 'Engine oil filter', category: 'Engine', brand: 'Sample', fits: [1] },
    { id: 4, part_number: 'OIL-HY-02', name: 'Engine oil filter', category: 'Engine', brand: 'Sample', fits: [2, 3] },
    { id: 5, part_number: 'AIR-TN-01', name: 'Engine air filter', category: 'Engine', brand: 'Sample', fits: [4] },
    { id: 6, part_number: 'CAB-ALL-01', name: 'Cabin AC filter', category: 'AC', brand: 'Sample', fits: [1, 2, 3, 4] },
    { id: 7, part_number: 'SPK-4-01', name: 'Spark plug set (4)', category: 'Ignition', brand: 'Sample', fits: [1, 3] },
    { id: 8, part_number: 'CLT-BL-01', name: 'Clutch plate kit', category: 'Transmission', brand: 'Sample', fits: [5] },
    { id: 9, part_number: 'H4-12V-01', name: 'Headlamp bulb H4 12 V', category: 'Electrical', brand: 'Sample', fits: [1, 5] },
    { id: 10, part_number: 'WPR-SET-01', name: 'Wiper blade set', category: 'Body', brand: 'Sample', fits: [1, 2, 3, 4, 5] }
  ];

  const FEES = { householdSmall: 29, householdLarge: 49, smallBelow: 500, delivery: 60, proPlan: 299, shopCommissionPct: 3 };

  return { COLLECTED_ON, CATEGORIES, PARTS, DEMO_SHOPS, ZONES, AREAS, NO_AREA, PUBLIC_LISTINGS, FACTS, CAR_VEHICLES, CAR_PARTS, FEES };
});
