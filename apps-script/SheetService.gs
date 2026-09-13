function getSheetOrThrow_(sheetName) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error('ไม่พบชีต ' + sheetName);
  return sheet;
}

function readTable_(sheetName) {
  var sheet = getSheetOrThrow_(sheetName);
  var values = sheet.getDataRange().getValues();
  if (!values.length || !values[0].length) return [];
  var headers = values[0].map(function (v) { return String(v).trim(); });
  return values.slice(1).filter(function (row) {
    return row.some(function (v) { return v !== '' && v != null; });
  }).map(function (row, idx) {
    var obj = { _rowNumber: idx + 2 };
    headers.forEach(function (h, col) { if (h) obj[h] = row[col]; });
    return obj;
  });
}

function headersFor_(sheetName) {
  var sheet = getSheetOrThrow_(sheetName);
  var lastColumn = sheet.getLastColumn();
  if (!lastColumn) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (v) { return String(v).trim(); });
}

function appendObjectRows_(sheetName, objects) {
  if (!objects || !objects.length) return;
  var sheet = getSheetOrThrow_(sheetName);
  var headers = headersFor_(sheetName);
  var rows = objects.map(function (obj) {
    return headers.map(function (h) { return obj[h] == null ? '' : obj[h]; });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function updateObjectRow_(sheetName, rowNumber, patch) {
  var sheet = getSheetOrThrow_(sheetName);
  var headers = headersFor_(sheetName);
  var values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  headers.forEach(function (h, i) {
    if (Object.prototype.hasOwnProperty.call(patch, h)) values[i] = patch[h];
  });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([values]);
}

function findRowBy_(sheetName, field, value) {
  var rows = readTable_(sheetName);
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i][field]) === String(value)) return rows[i];
  }
  return null;
}

function getAccounts() {
  return readTable_(APP.SHEETS.ACCOUNTS)
    .filter(function (r) { return String(r.Active).toUpperCase() !== 'FALSE'; })
    .map(function (r) { return { id: r.AccountID, name: r.AccountName, category: r.Category }; });
}
