(function () {
  // Detect device type from viewport + user agent
  function deviceType() {
    var ua = navigator.userAgent;
    if (/Tablet|iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'Tablet';
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'Mobile';
    return 'Desktop';
  }

  // Detect browser name + version (order matters: check specific before generic)
  function browserName() {
    var ua = navigator.userAgent, m;
    if ((m = ua.match(/Edg\/([\d.]+)/)))            return 'Edge ' + m[1];
    if ((m = ua.match(/OPR\/([\d.]+)/)))            return 'Opera ' + m[1];
    if (/CriOS/.test(ua) && (m = ua.match(/CriOS\/([\d.]+)/))) return 'Chrome (iOS) ' + m[1];
    if (/FxiOS/.test(ua) && (m = ua.match(/FxiOS\/([\d.]+)/))) return 'Firefox (iOS) ' + m[1];
    if ((m = ua.match(/Firefox\/([\d.]+)/)))        return 'Firefox ' + m[1];
    if (/Chrome/.test(ua) && (m = ua.match(/Chrome\/([\d.]+)/))) return 'Chrome ' + m[1];
    if (/Safari/.test(ua) && (m = ua.match(/Version\/([\d.]+)/))) return 'Safari ' + m[1];
    return ua; // fall back to the raw string so nothing is lost
  }

  var byId = function (id) { return document.getElementById(id); };
  byId('ff-device').value = deviceType();
  byId('ff-browser').value = browserName();
  byId('ff-screen').value = window.innerWidth + '×' + window.innerHeight +
    ' (window), ' + screen.width + '×' + screen.height + ' (screen)';

  // The page the reviewer came from is the most likely subject of the report.
  var ref = document.referrer;
  byId('ff-current-url').value = ref || window.location.href;
  var pageField = byId('ff-page');
  if (ref && !pageField.value) pageField.value = ref;
})();
