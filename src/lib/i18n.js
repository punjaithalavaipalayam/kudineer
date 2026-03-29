/* i18n.js – Tamil / English language support */

const LANG_KEY = 'kudineer_lang';

let _lang = localStorage.getItem(LANG_KEY) || 'en';

export function getLang() { return _lang; }

export function setLang(lang) {
  _lang = lang;
  localStorage.setItem(LANG_KEY, lang);
}

export function t(key) {
  return (translations[_lang] && translations[_lang][key]) || translations.en[key] || key;
}

const translations = {
  en: {
    // --- Nav ---
    nav_summary: 'Summary',
    nav_monthly: 'Monthly',
    nav_add: 'Add',
    nav_insights: 'Insights',
    nav_settings: 'Settings',

    // --- Header subtitles ---
    subtitle_summary: 'CWSS 138 / 238 — Yearly Summary',
    subtitle_monthly: 'CWSS 138 / 238 — Monthly Readings',
    subtitle_entry: 'CWSS 138 / 238 — Data Entry',
    subtitle_insights: 'CWSS 138 / 238 — Insights & Analytics',
    subtitle_settings: 'CWSS 138 / 238 — Settings',

    // --- Yearly Summary ---
    yearly_summary: 'Yearly Summary',
    litres_per_day_allotted: 'Litres Per Day Allotted',
    yearly_pct_received: 'Yearly Summary of % Received',
    till: 'Till',
    ltrs_per_day: 'Ltrs / Day',
    total: 'Total',
    combined: 'Combined',
    avg: 'Avg',
    avg_ltrs: 'Avg Ltrs',
    rec_pct: 'Rec%',
    sno: 'S.No',
    month: 'Month',
    download_pdf: 'Download PDF',
    all_readings: 'All Readings',
    all_readings_desc: 'Every meter column included',
    main_readings_only: 'Main Readings Only',
    main_readings_desc: 'CWSS-138 & 238 Main Entrance',

    // --- Monthly Sheet ---
    monthly_readings: 'Monthly Readings',
    date: 'Date',
    base: 'Base',
    tot: 'Tot',
    mld: 'MLD',
    litres: 'Litres',

    // --- Insights ---
    insights_title: 'Insights & Analytics',
    no_data_yet: 'No data yet',
    add_readings_hint: 'Add readings via the + button to see insights.',
    pct_received: '% Received',
    pct_of_target: 'of target',
    main_pct_received_vs_target: 'Main — % Received vs Target of',
    target: 'Target',
    avg_received: 'Avg Received',

    // --- Admin Entry ---
    add_readings: 'Add Readings',
    entry_subtitle: 'Enter MLD readings for all meters at once (last 7 days only)',
    select_date: 'Select Date',
    enter_mld: 'Enter MLD',
    previous: 'Previous',
    no_data: 'No data',
    first_entry: 'First entry',
    below_previous: 'Below previous!',
    preview: 'Preview',
    save_all: 'Save All Readings',
    admin_required: 'Admin Access Required',
    admin_hint: 'Tap the 👤 button in the top bar to unlock.',
    readings_saved: 'Readings saved!',
    future_not_allowed: 'Future dates are not allowed',
    only_7_days: 'Only last 7 days allowed for manual entry',

    // --- Settings ---
    settings_title: 'Settings',
    settings_subtitle: 'Preferences & data management',
    theme: 'Theme',
    theme_desc: 'Auto switches at 6 AM / 6 PM',
    language: 'Language',
    language_desc: 'Switch between English and Tamil',
    admin_pin: 'Admin PIN',
    admin_pin_desc: 'Update access code',
    export_csv: 'Export as CSV',
    export_csv_desc: 'Download all readings backup',
    import_csv: 'Import from CSV',
    import_csv_desc: 'Restore or add prefilled data',
    clear_all: 'Clear All Data',
    clear_all_desc: 'Password protected • Irreversible action',
    change: 'Change →',
    export_action: 'Export →',
    import_action: 'Import →',
    clear_action: 'Clear →',
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
    english: 'English',
    tamil: 'தமிழ்',

    // --- PIN Modal ---
    admin_access: 'Admin Access',
    enter_pin: 'Enter your 4-digit PIN',
    cancel: 'Cancel',
    unlock: 'Unlock',

    // --- Toasts ---
    admin_enabled: 'Admin mode enabled',
    locked: 'Locked',
    wrong_pin: 'Wrong PIN',
    pin_updated: 'PIN updated',
    must_4_digits: 'Must be 4 digits',
    exported: 'Exported to Downloads folder',
    not_authorized: 'Not authorized',
    incorrect_master: 'Incorrect master password',
    all_data_cleared: 'All data cleared',
    backup_restored: 'Backup restored from cloud',

    // --- Import modal ---
    choose_import_source: 'Choose Import Source',
    cloud_backups: 'Cloud backups (last 3 days)',
    no_cloud_backups: 'No cloud backups available',
    restore_backup: 'Restore Backup',
    upload_external_csv: 'Upload External CSV',
    import_options: 'Import Options',
    csv_contains: 'CSV contains',
    entries: 'entries',
    from: 'from',
    to: 'to',
    date_range: 'Date Range',
    import_mode: 'Import Mode',
    update: 'Update',
    update_desc: 'Merge with existing data — adds new, updates matching dates',
    overwrite: 'Overwrite',
    overwrite_desc: 'Erase ALL existing data and replace with CSV',
    import_data: 'Import Data',
    entries_imported: 'entries imported',
    future_skipped: 'future date entries were skipped',

    // --- Confirmation ---
    confirm_clear: 'This will permanently delete ALL readings from the cloud database. Are you sure?',
    confirm_overwrite: 'This will ERASE all existing data and replace with the imported CSV. Are you sure?',
    action_restricted: 'Action restricted.\nContact System Admin to import data.',
    action_restricted_clear: 'Action restricted.\nContact System Admin to clear data.',
    enter_current_pin: 'Enter Current PIN\n(If forgotten, contact System Admin):',
    enter_master_pw: 'Enter Master Password:',
    enter_new_pin: 'Enter New 4-digit PIN:',

    // --- Loader ---
    connecting: 'Connecting to database...',
    connection_error: 'Connection Error',

    // --- Footer ---
    version_info: 'Water Meter Tracker v3.0 • CWSS 138/238 • Cloud Sync',

    // --- Legend ---
    legend_title: 'Legend — Meter Abbreviations',
    legend_main: 'Water received into the Panchayat',
    legend_cek: 'Amount of water going to Mettukadai Colony and Elanthakadu',
    legend_mgp: 'Amount of water entering the Molakavundan Palaiyam tank',
    legend_sump: 'Water coming to the sump near the Panchayat office',

    // --- Months ---
    january: 'January', february: 'February', march: 'March',
    april: 'April', may: 'May', june: 'June',
    july: 'July', august: 'August', september: 'September',
    october: 'October', november: 'November', december: 'December',

    // --- Month short ---
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr',
    may_s: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug',
    sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',

    // --- Print header ---
    print_title: 'புன்செய் தாளவாய்பாளையம் ஆற்று நீர்',
  },

  ta: {
    // --- Nav ---
    nav_summary: 'சுருக்கம்',
    nav_monthly: 'மாதாந்திர',
    nav_add: 'சேர்',
    nav_insights: 'பகுப்பாய்வு',
    nav_settings: 'அமைப்புகள்',

    // --- Header subtitles ---
    subtitle_summary: 'CWSS 138 / 238 — ஆண்டு சுருக்கம்',
    subtitle_monthly: 'CWSS 138 / 238 — மாதாந்திர அளவீடுகள்',
    subtitle_entry: 'CWSS 138 / 238 — தரவு பதிவு',
    subtitle_insights: 'CWSS 138 / 238 — பகுப்பாய்வு & புள்ளிவிவரம்',
    subtitle_settings: 'CWSS 138 / 238 — அமைப்புகள்',

    // --- Yearly Summary ---
    yearly_summary: 'ஆண்டு சுருக்கம்',
    litres_per_day_allotted: 'தினசரி ஒதுக்கப்பட்ட அளவு (லிட்டரில்)',
    yearly_pct_received: 'ஆண்டு சுருக்கம்: பெறப்பட்ட அளவு சதவீதத்தில்',
    till: 'வரை',
    ltrs_per_day: 'லிட்டர் / நாள்',
    total: 'மொத்தம்',
    combined: 'ஒட்டுமொத்தம்',
    avg: 'சராசரி',
    avg_ltrs: 'சராசரி லிட்டர்',
    rec_pct: 'பெறு%',
    sno: 'எண்',
    month: 'மாதம்',
    download_pdf: 'PDF பதிவிறக்கம்',
    all_readings: 'அனைத்து அளவீடுகள்',
    all_readings_desc: 'அனைத்து மீட்டர் நெடுவரிசைகளும் சேர்க்கப்படும்',
    main_readings_only: 'முதன்மை அளவீடுகள் மட்டும்',
    main_readings_desc: 'CWSS-138 & 238 முதன்மை நுழைவு',

    // --- Monthly Sheet ---
    monthly_readings: 'மாதாந்திர அளவீடுகள்',
    date: 'தேதி',
    base: 'அடிப்படை',
    tot: 'மொத்',
    mld: 'MLD',
    litres: 'லிட்டர்',

    // --- Insights ---
    insights_title: 'பகுப்பாய்வு & புள்ளிவிவரம்',
    no_data_yet: 'தரவு இல்லை',
    add_readings_hint: '+ பொத்தான் மூலம் அளவீடுகளை சேர்க்கவும்.',
    pct_received: '% பெறப்பட்டது',
    pct_of_target: 'இலக்கின்',
    main_pct_received_vs_target: 'முதன்மை — பெறப்பட்ட சதவீதம் எதிர் தினசரி இலக்கான',
    target: 'இலக்கு',
    avg_received: 'சராசரி பெறப்பட்டது',

    // --- Admin Entry ---
    add_readings: 'அளவீடுகள் சேர்',
    entry_subtitle: 'அனைத்து மீட்டர்களுக்கும் MLD அளவீடுகளை ஒரே நேரத்தில் உள்ளிடவும் (கடந்த 7 நாட்கள் மட்டும்)',
    select_date: 'தேதி தேர்வு',
    enter_mld: 'MLD உள்ளிடவும்',
    previous: 'முந்தைய',
    no_data: 'தரவு இல்லை',
    first_entry: 'முதல் பதிவு',
    below_previous: 'முந்தையதை விட குறைவு!',
    preview: 'முன்னோட்டம்',
    save_all: 'அனைத்து அளவீடுகளையும் சேமி',
    admin_required: 'நிர்வாகி அணுகல் தேவை',
    admin_hint: 'திறக்க மேல் பட்டியில் 👤 பொத்தானை தட்டவும்.',
    readings_saved: 'அளவீடுகள் சேமிக்கப்பட்டன!',
    future_not_allowed: 'எதிர்கால தேதிகள் அனுமதிக்கப்படவில்லை',
    only_7_days: 'கடந்த 7 நாட்கள் மட்டுமே கைமுறை பதிவுக்கு அனுமதிக்கப்படும்',

    // --- Settings ---
    settings_title: 'அமைப்புகள்',
    settings_subtitle: 'முன்னுரிமைகள் & தரவு மேலாண்மை',
    theme: 'தீம்',
    theme_desc: 'காலை 6 / மாலை 6 மணிக்கு தானாக மாறும்',
    language: 'மொழி',
    language_desc: 'ஆங்கிலம் மற்றும் தமிழ் இடையே மாற்றவும்',
    admin_pin: 'நிர்வாகி PIN',
    admin_pin_desc: 'அணுகல் குறியீட்டை புதுப்பிக்கவும்',
    export_csv: 'CSV ஆக ஏற்றுமதி',
    export_csv_desc: 'அனைத்து அளவீடுகள் காப்புப்பிரதி பதிவிறக்கம்',
    import_csv: 'CSV இலிருந்து இறக்குமதி',
    import_csv_desc: 'மீட்டமை அல்லது முன்பூர்த்தி தரவு சேர்',
    clear_all: 'அனைத்து தரவையும் அழி',
    clear_all_desc: 'கடவுச்சொல் பாதுகாப்பு • மீள முடியாத செயல்',
    change: 'மாற்று →',
    export_action: 'ஏற்றுமதி →',
    import_action: 'இறக்குமதி →',
    clear_action: 'அழி →',
    auto: 'தானியங்கி',
    light: 'ஒளி',
    dark: 'இருள்',
    english: 'English',
    tamil: 'தமிழ்',

    // --- PIN Modal ---
    admin_access: 'நிர்வாகி அணுகல்',
    enter_pin: 'உங்கள் 4-இலக்க PIN ஐ உள்ளிடவும்',
    cancel: 'ரத்து',
    unlock: 'திற',

    // --- Toasts ---
    admin_enabled: 'நிர்வாகி முறை இயக்கப்பட்டது',
    locked: 'பூட்டப்பட்டது',
    wrong_pin: 'தவறான PIN',
    pin_updated: 'PIN புதுப்பிக்கப்பட்டது',
    must_4_digits: '4 இலக்கங்கள் இருக்க வேண்டும்',
    exported: 'பதிவிறக்கங்கள் கோப்புறைக்கு ஏற்றுமதி செய்யப்பட்டது',
    not_authorized: 'அங்கீகரிக்கப்படவில்லை',
    incorrect_master: 'தவறான முதன்மை கடவுச்சொல்',
    all_data_cleared: 'அனைத்து தரவும் அழிக்கப்பட்டது',
    backup_restored: 'கிளவுட் காப்புப்பிரதியிலிருந்து மீட்டமைக்கப்பட்டது',

    // --- Import modal ---
    choose_import_source: 'இறக்குமதி மூலத்தைத் தேர்வு செய்யவும்',
    cloud_backups: 'கிளவுட் காப்புப்பிரதிகள் (கடந்த 3 நாட்கள்)',
    no_cloud_backups: 'கிளவுட் காப்புப்பிரதிகள் இல்லை',
    restore_backup: 'காப்புப்பிரதி மீட்டமை',
    upload_external_csv: 'வெளிப்புற CSV பதிவேற்றம்',
    import_options: 'இறக்குமதி விருப்பங்கள்',
    csv_contains: 'CSV கொண்டுள்ளது',
    entries: 'பதிவுகள்',
    from: 'இலிருந்து',
    to: 'வரை',
    date_range: 'தேதி வரம்பு',
    import_mode: 'இறக்குமதி முறை',
    update: 'புதுப்பி',
    update_desc: 'இருக்கும் தரவுடன் இணை — புதிய சேர், பொருந்தும் தேதிகளை புதுப்பி',
    overwrite: 'மேலெழுது',
    overwrite_desc: 'இருக்கும் அனைத்து தரவையும் அழித்து CSV உடன் மாற்று',
    import_data: 'தரவை இறக்குமதி செய்',
    entries_imported: 'பதிவுகள் இறக்குமதி செய்யப்பட்டன',
    future_skipped: 'எதிர்கால தேதி பதிவுகள் தவிர்க்கப்பட்டன',

    // --- Confirmation ---
    confirm_clear: 'இது கிளவுட் தரவுத்தளத்திலிருந்து அனைத்து அளவீடுகளையும் நிரந்தரமாக நீக்கும். உறுதியா?',
    confirm_overwrite: 'இது இருக்கும் அனைத்து தரவையும் அழித்து CSV உடன் மாற்றும். உறுதியா?',
    action_restricted: 'செயல் கட்டுப்படுத்தப்பட்டுள்ளது.\nதரவை இறக்குமதி செய்ய கணினி நிர்வாகியை தொடர்பு கொள்ளவும்.',
    action_restricted_clear: 'செயல் கட்டுப்படுத்தப்பட்டுள்ளது.\nதரவை அழிக்க கணினி நிர்வாகியை தொடர்பு கொள்ளவும்.',
    enter_current_pin: 'தற்போதைய PIN ஐ உள்ளிடவும்\n(மறந்துவிட்டால், கணினி நிர்வாகியை தொடர்பு கொள்ளவும்):',
    enter_master_pw: 'முதன்மை கடவுச்சொல் உள்ளிடவும்:',
    enter_new_pin: 'புதிய 4-இலக்க PIN உள்ளிடவும்:',

    // --- Loader ---
    connecting: 'தரவுத்தளத்துடன் இணைக்கிறது...',
    connection_error: 'இணைப்பு பிழை',

    // --- Footer ---
    version_info: 'நீர் மீட்டர் கண்காணிப்பு v3.0 • CWSS 138/238 • கிளவுட் ஒத்திசைவு',

    // --- Legend ---
    legend_title: 'குறிப்பு — மீட்டர் சுருக்கங்கள்',
    legend_main: 'பஞ்சாயத்திற்குள் வந்த நீர்',
    legend_cek: 'மேட்டுக்கடை காலனி மற்றும் இலந்தகாடு செல்லும் நீரின் அளவு',
    legend_mgp: 'மோலகவுண்டன்பாளையம் தொட்டியில் ஏறும் நீரின் அளவு',
    legend_sump: 'பஞ்சாயத்து அலுவலகம் அருகில் உள்ள சம்பிற்கு வரும் நீரின் அளவு',

    // --- Months ---
    january: 'ஜனவரி', february: 'பிப்ரவரி', march: 'மார்ச்',
    april: 'ஏப்ரல்', may: 'மே', june: 'ஜூன்',
    july: 'ஜூலை', august: 'ஆகஸ்ட்', september: 'செப்டம்பர்',
    october: 'அக்டோபர்', november: 'நவம்பர்', december: 'டிசம்பர்',

    // --- Month short ---
    jan: 'ஜன', feb: 'பிப்', mar: 'மார்', apr: 'ஏப்',
    may_s: 'மே', jun: 'ஜூன்', jul: 'ஜூலை', aug: 'ஆக',
    sep: 'செப்', oct: 'அக்', nov: 'நவ', dec: 'டிச',

    // --- Print header ---
    print_title: 'புன்செய் தாளவாய்பாளையம் ஆற்று நீர்',
  }
};

// Helper: get translated month name
const MONTH_KEYS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const MONTH_SHORT_KEYS = ['jan','feb','mar','apr','may_s','jun','jul','aug','sep','oct','nov','dec'];

export function getMonthName(index) { return t(MONTH_KEYS[index]); }
export function getMonthShort(index) { return t(MONTH_SHORT_KEYS[index]); }
export function getMonthNames() { return MONTH_KEYS.map(k => t(k)); }
export function getMonthShorts() { return MONTH_SHORT_KEYS.map(k => t(k)); }
