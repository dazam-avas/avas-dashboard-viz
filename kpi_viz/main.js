// AvasFlowers KPI Comparison — Community Visualization
// Receives one row per date with a single metric value.
// Two in-widget date pickers let the viewer pick ANY current range
// and ANY comparison range; totals are summed live in the browser.

var dscc = window.dscc;

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function defaultRanges() {
  var today = new Date();
  var weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);

  var cmpEnd = new Date(weekAgo);
  cmpEnd.setDate(cmpEnd.getDate() - 1);
  var cmpStart = new Date(cmpEnd);
  cmpStart.setDate(cmpEnd.getDate() - 6);

  return {
    curStart: toISODate(weekAgo),
    curEnd: toISODate(today),
    cmpStart: toISODate(cmpStart),
    cmpEnd: toISODate(cmpEnd)
  };
}

function sumInRange(rows, start, end) {
  var total = 0;
  rows.forEach(function (r) {
    var d = r.dateDim; // 'YYYYMMDD' from Looker Studio DATE field
    var iso = d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8);
    if (iso >= start && iso <= end) {
      total += r.valueMetric;
    }
  });
  return total;
}

function render(data) {
  var root = document.getElementById('root');
  var style = data.style || {};
  var label = (style.labelText && style.labelText.value) || 'Metric';
  var accent = (style.accentColor && style.accentColor.value) || '#C9A84C';

  var rows = data.tables.DEFAULT.map(function (row) {
    return {
      dateDim: row.dateDim[0],
      valueMetric: row.valueMetric[0]
    };
  });

  var ranges = window._kpiRanges || defaultRanges();
  window._kpiRanges = ranges;

  var curTotal = sumInRange(rows, ranges.curStart, ranges.curEnd);
  var cmpTotal = sumInRange(rows, ranges.cmpStart, ranges.cmpEnd);
  var delta = cmpTotal === 0 ? 0 : ((curTotal - cmpTotal) / cmpTotal) * 100;
  var deltaUp = delta >= 0;

  root.innerHTML =
    '<div class="kpi-wrap">' +
      '<div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-row">' +
        '<div class="kpi-block">' +
          '<div class="kpi-tag">Current</div>' +
          '<div class="kpi-value" style="color:' + accent + '">' + curTotal.toLocaleString() + '</div>' +
          '<input type="date" id="curStart" value="' + ranges.curStart + '">' +
          '<input type="date" id="curEnd" value="' + ranges.curEnd + '">' +
        '</div>' +
        '<div class="kpi-block">' +
          '<div class="kpi-tag">Comparison</div>' +
          '<div class="kpi-value muted">' + cmpTotal.toLocaleString() + '</div>' +
          '<input type="date" id="cmpStart" value="' + ranges.cmpStart + '">' +
          '<input type="date" id="cmpEnd" value="' + ranges.cmpEnd + '">' +
        '</div>' +
      '</div>' +
      '<div class="kpi-delta ' + (deltaUp ? 'up' : 'down') + '">' +
        (deltaUp ? '▲' : '▼') + ' ' + Math.abs(delta).toFixed(1) + '%' +
      '</div>' +
    '</div>';

  ['curStart', 'curEnd', 'cmpStart', 'cmpEnd'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', function (e) {
      window._kpiRanges[id] = e.target.value;
      render(data);
    });
  });
}

function draw(data) {
  render(data);
}

dscc.subscribeToData(draw, { transform: dscc.objectTransform });
