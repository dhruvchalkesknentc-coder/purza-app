/* Purza shared data: collected 20 Nov 2026 from public web pages (sources on every row).
   Prices are listed prices seen online (retail, marketplace or trade), not quotes from Purza shops.
   Demo shops are invented and clearly labelled; public listings are real businesses that are NOT Purza partners. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.PurzaData = data;
})(typeof self !== 'undefined' ? self : this, function () {
  const COLLECTED_ON = '2026-11-20';

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
        { what: 'Tibcon / Mickko 35 + 5 µF, low end of range', price: 350, kind: 'genuine', where: 'Desi Utility AC spares guide 2026', url: 'https://desiutility.com/ac/spares/best-ac-capacitor-india' },
        { what: 'Tibcon / Mickko 35 + 5 µF, high end of range', price: 550, kind: 'genuine', where: 'Desi Utility AC spares guide 2026', url: 'https://desiutility.com/ac/spares/best-ac-capacitor-india' },
        { what: 'Cylinder AC capacitor (generic)', price: 150, kind: 'compatible', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/ac-capacitor.html' },
        { what: 'CONCAP plastic AC capacitor', price: 200, kind: 'compatible', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/ac-capacitor.html' }
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
        { what: 'Tibcon 2.50 MFD 440 V (trade)', price: 21, kind: 'trade', where: 'IndiaMART, S.R. Traders', url: 'https://m.indiamart.com/s-rtraders/fan-capacitor.html' },
        { what: 'Keltron 2.5 MFD', price: 27, kind: 'trade', where: 'IndiaMART listing', url: 'https://dir.indiamart.com/kanchipuram/capacitor.html' }
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
        { what: 'Bajaj original 400 ml chutney jar (MRP ₹699)', price: 483, kind: 'genuine', where: 'Flipkart', url: 'https://www.flipkart.com/bajaj-original-chutney-jar-assembly-genuine-mixer-grinder-spare-juicer/p/itma6520d84c88da' }
      ]
    },
    {
      id: 'wm-drain-pump', name: 'Front-load washing machine drain pump', short: 'Drain pump (front load)', cat: 'washer',
      local: 'drain pump · ड्रेन पंप', appliance: 'Front-load washing machine',
      check: 'Match the outlet angle, mounting and the connector.',
      keywords: ['drain pump', 'not draining', 'water not draining', 'front load', 'pump', 'pani nahi nikal', 'error oe', 'drain error'],
      obs: [
        { what: 'Drain pump for IFB front load (aftermarket)', price: 1015, kind: 'compatible', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/drain-pump.html' },
        { what: 'Front-load washing machine pump, all brands', price: 1900, kind: 'compatible', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/washing-machine-components.html' }
      ]
    },
    {
      id: 'wm-drain-motor', name: 'Top-load washing machine drain motor', short: 'Drain motor (top load)', cat: 'washer',
      local: 'drain motor', appliance: 'Top-load washing machine',
      check: 'Match the brand and the 2-pin connector.',
      keywords: ['drain motor', 'torque motor', 'top load', 'not draining'],
      obs: [
        { what: 'LG top-load drain motor', price: 400, kind: 'compatible', where: 'IndiaMART, Goyal Spare House', url: 'https://m.indiamart.com/goyalsparehouse' },
        { what: 'Drain / torque motor for IFB, Haier, Onida top load', price: 450, kind: 'compatible', where: 'IndiaMART, E And A Components', url: 'https://m.indiamart.com/eandacomponents/top-loading-washing-machines.html' }
      ]
    },
    {
      id: 'wm-inlet-valve', name: 'Washing machine water inlet valve', short: 'Inlet valve', cat: 'washer',
      local: 'inlet valve', appliance: 'Washing machine (top or front load)',
      check: 'Match the number of ways (1-in/2-out etc.), voltage and connector.',
      keywords: ['inlet valve', 'not filling', 'water not coming', 'no water', 'water inlet', 'filling'],
      obs: [
        { what: 'LG 5221EN1001P inlet valve', price: 845, kind: 'genuine', where: 'IndiaMART, India Tech Info', url: 'https://m.indiamart.com/indiatechinfo-pune' },
        { what: 'LG top-load DC inlet valve', price: 545, kind: 'compatible', where: 'IndiaMART, Bharat Electronics', url: 'https://m.indiamart.com/bharatelectronics-gujrat/water-inlet-valve.html' },
        { what: 'Whirlpool top-load inlet valve', price: 390, kind: 'compatible', where: 'IndiaMART, Bharat Electronics', url: 'https://m.indiamart.com/bharatelectronics-gujrat/water-inlet-valve.html' },
        { what: 'Top-load inlet valve (generic)', price: 330, kind: 'compatible', where: 'IndiaMART, Bharat Electronics', url: 'https://m.indiamart.com/bharatelectronics-gujrat/pipe-accessories.html' }
      ]
    },
    {
      id: 'wm-timer', name: 'Semi-automatic washing machine wash timer', short: 'Wash timer', cat: 'washer',
      local: 'timer', appliance: 'Semi-automatic washing machine',
      check: 'Match single or double shaft and the brand.',
      keywords: ['timer', 'wash timer', 'semi automatic', 'knob', 'spin timer'],
      obs: [
        { what: 'Double-shaft wash timer, low end', price: 300, kind: 'compatible', where: 'IndiaMART, E And A Components', url: 'https://m.indiamart.com/eandacomponents' },
        { what: 'Double-shaft wash timer, high end', price: 650, kind: 'compatible', where: 'IndiaMART, E And A Components', url: 'https://m.indiamart.com/eandacomponents' }
      ]
    },
    {
      id: 'geyser-element', name: 'Geyser heating element 2000 W', short: 'Geyser element', cat: 'geyser',
      local: 'element · हीटिंग एलिमेंट', appliance: 'Storage geyser',
      check: 'Match wattage, flange shape (round / triangle) and length.',
      keywords: ['element', 'heating element', 'geyser not heating', 'no hot water', 'garam pani nahi', 'heater'],
      obs: [
        { what: 'Pioneer midget heating element', price: 225, kind: 'genuine', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/geyser-heating-element.html' },
        { what: 'Triangle 2000 W copper element, 11 inch', price: 250, kind: 'compatible', where: 'IndiaMART, Impulsa', url: 'https://m.indiamart.com/hichoice-delhi/heating-elements.html' },
        { what: 'Sunhot 2000 W triangle element with thermostat', price: 527, kind: 'genuine', where: 'Moglix', url: 'https://www.moglix.com/sunhot-2000w-triangle-type-water-geyser-heating-element-with-thermostat/mp/msnm9xyz7rgdkj' },
        { what: 'Copper triangle element, 9 inch', price: 690, kind: 'compatible', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/geyser-heating-element.html' }
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
        { what: '11" geyser thermostat (trade)', price: 64, kind: 'trade', where: 'IndiaMART, Techno Care Industries', url: 'https://m.indiamart.com/techno-care-industries/heating-elements.html' }
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
        { what: 'Godrej 8-hour defrost timer', price: 399, kind: 'compatible', where: 'IndiaMART, E And A Components', url: 'https://m.indiamart.com/eandacomponents' },
        { what: 'Godrej defrost timer', price: 650, kind: 'genuine', where: 'IndiaMART, Fama Air Con', url: 'https://m.indiamart.com/famaaircon-bengaluru' }
      ]
    },
    {
      id: 'fridge-thermostat', name: 'Refrigerator thermostat', short: 'Fridge thermostat', cat: 'fridge',
      local: 'thermostat', appliance: 'Direct-cool or frost-free refrigerator',
      check: 'Match single or double door and the capillary length.',
      keywords: ['fridge thermostat', 'refrigerator thermostat', 'fridge too cold', 'fridge not cooling', 'single door'],
      obs: [
        { what: 'Thermostat for Whirlpool R600 single door', price: 299, kind: 'compatible', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/refrigerator-thermostat.html' },
        { what: 'Whirlpool double-door thermostat', price: 240, kind: 'compatible', where: 'IndiaMART, Shree Refrigeration', url: 'https://m.indiamart.com/shreerefrigerationandelectronics' },
        { what: 'Refrigerator thermostat, 2 A (generic)', price: 150, kind: 'compatible', where: 'IndiaMART, Coldstor Enterprises', url: 'https://m.indiamart.com/impcat/refrigerator-thermostat.html' }
      ]
    },
    {
      id: 'fridge-olp', name: 'Refrigerator compressor relay / OLP', short: 'Relay / OLP', cat: 'fridge',
      local: 'relay · OLP', appliance: 'Refrigerator compressor',
      check: 'Match the compressor make and the relay pin type.',
      keywords: ['relay', 'olp', 'overload', 'compressor clicking', 'tik tik', 'fridge not starting'],
      obs: [
        { what: 'OLP for refrigerator compressor', price: 150, kind: 'compatible', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/refrigerator-components.html' },
        { what: 'Refrigerator OLP (trade)', price: 60, kind: 'trade', where: 'IndiaMART, Indore listing', url: 'https://m.indiamart.com/city/indore/refrigerator-components.html' }
      ]
    },
    {
      id: 'ac-outdoor-motor', name: 'Split AC outdoor fan motor', short: 'AC outdoor motor', cat: 'ac',
      local: 'outdoor motor', appliance: 'Split AC outdoor unit',
      check: 'Match wattage, shaft size, rotation and mounting.',
      keywords: ['outdoor motor', 'outdoor fan not running', 'fan motor', 'ac fan motor'],
      obs: [
        { what: 'Split AC outdoor motor 25 W (Z. Cool Technology, Mumbai)', price: 2150, kind: 'compatible', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/air-conditioner-motor.html' },
        { what: 'Samsung outdoor unit motor 30 W', price: 1550, kind: 'genuine', where: 'IndiaMART listing', url: 'https://m.indiamart.com/impcat/air-conditioner-motor.html' },
        { what: '0.09 kW split AC outdoor motor', price: 650, kind: 'compatible', where: 'IndiaMART, SK Refrigeration', url: 'https://m.indiamart.com/impcat/split-phase-motor.html' }
      ]
    },
    {
      id: 'ac-blower', name: 'Split AC indoor blower (1.5 ton)', short: 'AC blower', cat: 'ac',
      local: 'blower', appliance: 'Split AC indoor unit',
      check: 'Match length, diameter and shaft hole.',
      keywords: ['blower', 'indoor fan', 'ac noise', 'cross flow fan'],
      obs: [
        { what: 'Plastic indoor blower, 1.5 ton', price: 800, kind: 'compatible', where: 'IndiaMART, ASF Refrigeration', url: 'https://m.indiamart.com/impcat/ac-blower.html' },
        { what: 'Aluminium split AC blower, 1.5 ton', price: 1650, kind: 'compatible', where: 'IndiaMART, Enviro Tech', url: 'https://m.indiamart.com/impcat/ac-blower.html' }
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
    { id: 'demo-jaiambe', name: 'Jai Ambe Electric', shopNo: 'Shop 18', market: 'Lohar Chawl', cats: ['geyser', 'fan'] },
    { id: 'demo-patel', name: 'Patel Brothers Spares', shopNo: 'Shop 2', market: 'Lohar Chawl', cats: ['washer', 'mixer'] },
    { id: 'demo-alhabib', name: 'Al-Habib Motor Winding', shopNo: 'Shop 27', market: 'Lohar Chawl', cats: ['washer', 'fan', 'ac'] },
    { id: 'demo-saikrupa', name: 'Sai Krupa Electronics', shopNo: 'Shop 11', market: 'Lamington Road', cats: ['ac', 'fridge'] },
    { id: 'demo-vardhman', name: 'Vardhman Appliance Hub', shopNo: 'Shop 40', market: 'Lohar Chawl', cats: ['mixer', 'geyser'] },
    { id: 'demo-omsai', name: 'Om Sai Spares', shopNo: 'Shop 5', market: 'Lohar Chawl', cats: ['mixer', 'ac', 'fan'] },
    { id: 'demo-classic', name: 'Classic Geyser Centre', shopNo: 'Shop 16', market: 'Lohar Chawl', cats: ['geyser'] },
    { id: 'demo-fine', name: 'Fine Washer Spares', shopNo: 'Shop 35', market: 'Lohar Chawl', cats: ['washer', 'fridge'] }
  ];

  // Real businesses from public listings. NOT Purza partners; shown so the team knows who to sign up first.
  const PUBLIC_LISTINGS = [
    { name: 'Shree NM Electricals Ltd', market: 'Lohar Chawl', address: '45/47 Lohar Chawl', sells: 'Electrical supplies for electricians and contractors', source: 'Explurger', url: 'https://www.explurger.com/pd/gp1c88aqc0nnrp0vg' },
    { name: 'Havells Galaxy – B C Appliances', market: 'Lohar Chawl', address: 'No 71, Kerawalla Bldg, KM Sharma Marg, Lohar Chawl, Kalbadevi', sells: 'Havells home appliances and electricals', source: 'Havells store locator', url: 'https://partners.havells.com/near-me/mumbai/kalbadevi/havells-galaxy-b-c-appliances-in-kalbadevi-mumbai--3ih4rI/home' },
    { name: 'Kirtikumar Electric Corporation', market: 'Lohar Chawl', address: 'Shop 12, Tavawala Building, Lohar Chawl, Kalbadevi', sells: 'Havells authorised partner: appliances and electricals', source: 'Havells store locator', url: 'https://partners.havells.com/near-me/mumbai/kalbadevi/havells-authorised-partner-kirtikumar-electric-corporation-in-kalbadevi-mumbai--4vVZDB/articles/havells-rangmanch-collection-brings-together-art-c--938fb0d1-0211-4f87-b7f2-c572a81d8972' },
    { name: 'Legrand Zip – Industrial Engineers', market: 'Lohar Chawl', address: 'No 178, Ground Floor, Gopal Niwas, Lohar Chawl', sells: 'Legrand switches and electrical equipment', source: 'Legrand store locator', url: 'https://zip.legrand.co.in/legrand-zip-industrial-engineers-electrical-equipment-manufacturer-lohar-chawl-mumbai-306870/Home' },
    { name: 'Sony Electrics', market: 'Lohar Chawl', address: 'Shop 9B, Jay Mahal Bldg, 20/48 Lohar Chawl', sells: 'Electrical store', source: 'Yappe', url: 'https://yappe.in/maharashtra/mumbai/sony-electrics/1410762' },
    { name: 'Sambhaji Electric Stores', market: 'Lohar Chawl', address: '133 Shamaldas Gandhi Marg, Lohar Chawl, Kalbadevi', sells: 'Electrical supplies', source: 'WorldOrgs directory', url: 'https://in.worldorgs.com/catalog/mumbai/electrical-supply-store/electrical-components' },
    { name: 'Karan Electrical', market: 'Lohar Chawl', address: '33/5 Pathakwadi, Ismail Building, Lohar Chawl, Kalbadevi', sells: 'Electrical supplies', source: 'WorldOrgs directory', url: 'https://in.worldorgs.com/catalog/mumbai/electrical-supply-store/electrical-components' },
    { name: 'Neha Electricals', market: 'Lohar Chawl', address: 'Shop 9, 1/A Tavawala Building, Pathakwadi, Lohar Chawl', sells: 'Electricals', source: 'IndiaMART', url: 'https://m.indiamart.com/nehaelectricals-mumbai' },
    { name: 'Snatronics', market: 'Lamington Road', address: 'Shop 11, Popular Complex, Abid House, Lamington Road', sells: 'Electronic components incl. capacitors, ICs, diodes', source: 'IndiaMART', url: 'https://m.indiamart.com/snatronics/alcon-capacitor.html' },
    { name: 'DC Electronics', market: 'Lamington Road', address: '8 Ramnivas Building, Tara Temple Lane, Lamington Road', sells: 'Electronic components (resistors and more)', source: 'IndiaMART', url: 'https://m.indiamart.com/dcelectronics/about-us.html' },
    { name: 'Vinita Electronics', market: 'Lamington Road', address: '59 New Hanuman Building, Shamrao Vithal Marg, off Lamington Road', sells: 'Industrial electronic components', source: 'IndiaMART', url: 'https://m.indiamart.com/vinita-electronics' },
    { name: 'Visha Electronics', market: 'Lamington Road', address: 'Lamington Road (opposite the police station, per forum posts)', sells: 'Capacitors and components', source: 'HiFiVision forum', url: 'https://www.hifivision.com/threads/dealers-shops-for-capacitors.50133' },
    { name: 'Central Auto India Pvt Ltd', market: 'Grant Road', address: 'Jyoti Studio Compound, Kennedy Bridge, Nana Chowk, Grant Road', sells: 'Air-conditioner parts (listed under HSN 8415)', source: 'IndiaMART', url: 'https://m.indiamart.com/centralautoindia' },
    { name: 'Janta Automobiles', market: 'Lamington Road', address: 'Saraswati Bhavan, Lamington Rd, near Minerva Talkies', sells: 'Auto parts (for the car phase)', source: 'Carchhe', url: 'https://www.carchhe.com/auto-parts-store/mumbai/janta-automobiles' },
    { name: 'Marudhar Auto Parts', market: 'Lamington Road', address: 'Lamington Rd, Grant Road East', sells: 'Auto parts (for the car phase)', source: 'Carchhe', url: 'https://www.carchhe.com/auto-parts-store/mumbai/marudhar-auto-parts' },
    { name: 'Mamta Mobile & Electronics', market: 'Other Mumbai', address: 'Malad East', sells: 'Washing machine spare parts and PCBs', source: 'IndiaMART', url: 'https://m.indiamart.com/mamta-mobile-electronics/testimonial.html' },
    { name: 'Aadil Trading Co.', market: 'Other Mumbai', address: 'Dahisar East', sells: 'Washing machine parts, PCBs, doors', source: 'IndiaMART', url: 'https://m.indiamart.com/aadiltradingco/washing-machine.html' },
    { name: 'Electrofix Services.Com', market: 'Other Mumbai', address: 'Mumbai', sells: 'Microwave, washing machine and refrigerator parts', source: 'IndiaMART', url: 'https://m.indiamart.com/electrofix-services/products-and-services.html' },
    { name: 'Z. Cool Technology', market: 'Other Mumbai', address: 'Mumbai', sells: 'AC outdoor motors and parts', source: 'IndiaMART', url: 'https://m.indiamart.com/impcat/air-conditioner-motor.html' },
    { name: 'Mega Cool (India)', market: 'Other Mumbai', address: 'Link Road, Andheri West', sells: 'AC spare parts, motors, remotes', source: 'IndiaMART', url: 'https://m.indiamart.com/mega-cool-india/profile.html' },
    { name: 'Shree Punrasar Enterprises', market: 'Other Mumbai', address: 'Andheri', sells: 'AC motors and parts', source: 'IndiaMART', url: 'https://m.indiamart.com/impcat/split-phase-motor.html' },
    { name: 'Spydertech India', market: 'Other Mumbai', address: 'IC Colony, Borivali West', sells: 'Washing machine spare parts (manufacturer)', source: 'IndiaMART', url: 'https://m.indiamart.com/spydertechindia' }
  ];

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
    { stat: '3rd', label: 'Lamington Road is India’s third-largest grey market for electronics', detail: 'After Nehru Place (Delhi) and Ritchie Street (Chennai). Hobbyists warn of fake components: genuine labels matter.', source: 'Wikipedia; HiFiVision forum', url: 'https://en.wikipedia.org/wiki/Lamington_Road', group: 'markets' },
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

  return { COLLECTED_ON, CATEGORIES, PARTS, DEMO_SHOPS, PUBLIC_LISTINGS, FACTS, CAR_VEHICLES, CAR_PARTS, FEES };
});
