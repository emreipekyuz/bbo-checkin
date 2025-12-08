/**
 * Bir Bulut Olsam Derneği - Etkinlik Check-in API
 * Google Apps Script (Web Uygulaması) için örnek sunucu kodu
 *
 * Özellikler
 * - Aktif etkinlik listesini döndürür (GET action=events)
 * - Seçili etkinlik için mood istatistiklerini döndürür (GET action=moodStats&eventCode=...)
 * - Check-in kayıtlarını alır (POST)
 * - JSONP desteği (callback parametresi)
 */

// === Genel Yardımcılar ===
function findEventsSheet_() {
  var ss = SpreadsheetApp.getActive();
  return ss.getSheets().find(function (sh) {
    var headers = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
      .map(function (v) { return String(v).trim(); });
    var need = ['EventCode', 'EventName', 'Status'];
    return need.every(function (h) { return headers.indexOf(h) !== -1; });
  }) || null;
}

function findCheckinsSheet_() {
  var ss = SpreadsheetApp.getActive();
  var nameCandidates = ['Name', 'Name-Surname', 'Name Surname', 'İsim Soyisim', 'Isim Soyisim', 'Ad Soyad', 'Ad-Soyad', 'AdSoyad'];
  return ss.getSheets().find(function (sh) {
    var headers = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
      .map(function (v) { return String(v).trim(); });
    var core = headers.indexOf('Timestamp') !== -1 && headers.indexOf('EventCode') !== -1 && headers.indexOf('EventName') !== -1 && headers.indexOf('Phone') !== -1;
    var hasName = nameCandidates.some(function (h) { return headers.indexOf(h) !== -1; });
    return core && hasName;
  }) || null;
}

function detectNameHeader_(sheet) {
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
    .map(function (v) { return String(v).trim(); });
  var candidates = ['Name', 'Name-Surname', 'Name Surname', 'İsim Soyisim', 'Isim Soyisim', 'Ad Soyad', 'Ad-Soyad', 'AdSoyad'];
  for (var i = 0; i < candidates.length; i++) {
    if (headers.indexOf(candidates[i]) !== -1) return candidates[i];
  }
  return 'Name';
}

function normalizePhone_(raw) {
  var digits = String(raw || '').replace(/\D+/g, '');
  if (digits.length === 10) return '0' + digits;
  return digits;
}

function isValidEmail_(email) {
  var s = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getActiveEvents_() {
  var sh = findEventsSheet_();
  if (!sh) return [];
  var vals = sh.getDataRange().getValues();
  var hdr = vals[0].map(function (v) { return String(v).trim(); });
  var iCode = hdr.indexOf('EventCode');
  var iName = hdr.indexOf('EventName');
  var iStat = hdr.indexOf('Status');
  var out = [];
  for (var r = 1; r < vals.length; r++) {
    var status = String(vals[r][iStat] || '').toUpperCase().trim();
    if (status !== 'ACTIVE') continue;
    out.push({
      eventCode: String(vals[r][iCode] || '').trim(),
      eventName: String(vals[r][iName] || '').trim()
    });
  }
  return out;
}

function getEventNameByCode_(eventCode) {
  var sh = findEventsSheet_();
  if (!sh) return null;
  var vals = sh.getDataRange().getValues();
  var hdr = vals[0].map(function (v) { return String(v).trim(); });
  var iCode = hdr.indexOf('EventCode');
  var iName = hdr.indexOf('EventName');
  var iStat = hdr.indexOf('Status');
  for (var r = 1; r < vals.length; r++) {
    var code = String(vals[r][iCode] || '').trim();
    var status = String(vals[r][iStat] || '').toUpperCase().trim();
    if (code === eventCode && status === 'ACTIVE') {
      return String(vals[r][iName] || '').trim();
    }
  }
  return null;
}

function jsonOutput_(data, callback) {
  var payload = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + payload + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

// === API Uçları ===
function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var action = (params.action || '').toLowerCase();
  var callback = params.callback;

  try {
    if (action === 'events') {
      return jsonOutput_({ ok: true, events: getActiveEvents_() }, callback);
    }

    if (action === 'moodstats') {
      var eventCode = String(params.eventCode || '').trim();
      if (!eventCode) return jsonOutput_({ ok: false, error: 'eventCode gerekli' }, callback);
      var stats = buildMoodStats_(eventCode);
      return jsonOutput_({ ok: true, moodStats: stats }, callback);
    }

    return jsonOutput_({ ok: false, error: 'Geçersiz action' }, callback);
  } catch (err) {
    return jsonOutput_({ ok: false, error: err.message || 'Beklenmeyen hata' }, callback);
  }
}

function doPost(e) {
  var params = e && e.parameter ? e.parameter : {};
  var eventCode = String(params.eventCode || '').trim();
  var name = String(params.name || '').trim();
  var phone = normalizePhone_(params.phone);
  var email = String(params.email || '').trim();
  var mood = String(params.mood || '').trim() || 'unspecified';

  if (!eventCode) return jsonOutput_({ ok: false, error: 'eventCode gerekli' });
  if (!name) return jsonOutput_({ ok: false, error: 'İsim gerekli' });
  if (!phone) return jsonOutput_({ ok: false, error: 'Telefon gerekli' });
  if (!isValidEmail_(email)) return jsonOutput_({ ok: false, error: 'Geçerli e-posta gerekli' });

  var eventName = getEventNameByCode_(eventCode);
  if (!eventName) return jsonOutput_({ ok: false, error: 'Etkinlik bulunamadı veya aktif değil' });

  var sh = findCheckinsSheet_();
  if (!sh) return jsonOutput_({ ok: false, error: 'Check-in sayfası bulunamadı' });

  var headers = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
    .map(function (v) { return String(v).trim(); });
  var nameHeader = detectNameHeader_(sh);

  var iTs = headers.indexOf('Timestamp');
  var iEventCode = headers.indexOf('EventCode');
  var iEventName = headers.indexOf('EventName');
  var iName = headers.indexOf(nameHeader);
  var iPhone = headers.indexOf('Phone');
  var iEmail = headers.indexOf('Email');
  var iMood = headers.indexOf('Mood');

  // Mood kolonu yoksa otomatik ekle
  if (iMood === -1) {
    headers.push('Mood');
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    iMood = headers.length - 1;
  }

  var row = new Array(headers.length).fill('');
  row[iTs] = new Date();
  row[iEventCode] = eventCode;
  row[iEventName] = eventName;
  row[iName] = name;
  row[iPhone] = phone;
  row[iEmail] = email;
  row[iMood] = mood;

  sh.appendRow(row);

  return jsonOutput_({ ok: true, message: 'Check-in kaydedildi' });
}

// Mood istatistiklerini oluşturur
function buildMoodStats_(eventCode) {
  var sh = findCheckinsSheet_();
  if (!sh) return { happy: 0, excited: 0, cool: 0, tired: 0, total: 0 };

  var vals = sh.getDataRange().getValues();
  if (vals.length <= 1) return { happy: 0, excited: 0, cool: 0, tired: 0, total: 0 };

  var hdr = vals[0].map(function (v) { return String(v).trim(); });
  var iEventCode = hdr.indexOf('EventCode');
  var iMood = hdr.indexOf('Mood');

  var stats = { happy: 0, excited: 0, cool: 0, tired: 0, total: 0 };
  for (var r = 1; r < vals.length; r++) {
    if (String(vals[r][iEventCode] || '').trim() !== eventCode) continue;
    var mood = String(vals[r][iMood] || '').trim().toLowerCase();
    if (stats.hasOwnProperty(mood)) {
      stats[mood] += 1;
    }
    stats.total += 1;
  }
  return stats;
}
