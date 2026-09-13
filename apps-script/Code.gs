function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.initialView = e && e.parameter && e.parameter.view === 'teacher' ? 'teacher' : 'student';
  return template.evaluate()
    .setTitle('แบบทดสอบการวิเคราะห์รายการค้า')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
