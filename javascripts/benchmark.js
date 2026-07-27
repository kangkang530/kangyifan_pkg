/* 对标数据库页面交互逻辑
 * 数据来源: docs/parameters/benchmark.json（构建后位于 /parameters/benchmark.json）
 * JSON 格式: { vehicles: [...], parameters: [{name, code, unit, numeric, values[], raw[]}] }
 */
(function () {
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const root = document.getElementById('db-app');
    if (!root) return; // 非本页不执行

    const $ = (sel) => root.querySelector(sel);
    const $$ = (sel) => Array.from(root.querySelectorAll(sel));

    const statusEl = $('#db-status');

    // ---------- 加载数据 ----------
    let data;
    try {
      const resp = await fetch('../benchmark.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      data = await resp.json();
    } catch (e) {
      statusEl.textContent = '数据加载失败：未找到 benchmark.json，请将处理好的 JSON 文件放入 docs/parameters/ 目录。(' + e.message + ')';
      return;
    }

    const vehicles = data.vehicles || [];
    const params = data.parameters || [];
    const echartsOk = typeof window.echarts !== 'undefined';

    // ---------- 状态 ----------
    const SLOT_COUNT = 5;
    const slots = new Array(SLOT_COUNT).fill(null); // 各槽位选中的参数索引
    let checked = new Set();                         // 对话框勾选（表格/图表显示）的参数索引
    let filteredIdx = vehicles.map((_, i) => i);     // 筛选后的车型索引
    let chartType = 'bar';
    let chart = null;
    let pieParam = null;                             // 饼图使用的参数索引

    // ---------- DOM ----------
    const slotEls = $$('.db-slot');
    const filterBtn = $('#db-filter');
    const countEl = $('#db-count');
    const tableEl = $('#db-table');
    const chartEl = $('#db-chart');
    const mask = $('#db-modal-mask');
    const listEl = $('#db-modal-list');
    const searchEl = $('#db-modal-search');
    const pieSel = $('#db-pie-param');

    // ---------- 参数下拉 ----------
    function paramLabel(p) {
      let label = p.name + (p.code ? ' (' + p.code + ')' : '');
      if (!p.numeric) label += ' [文本]';
      return label;
    }

    function refreshSelects() {
      slotEls.forEach((slotEl, i) => {
        const sel = slotEl.querySelector('select');
        let html = '<option value="">参数' + (i + 1) + '（请选择）</option>';
        params.forEach((p, pi) => {
          const taken = slots.includes(pi) && slots[i] !== pi;
          html += '<option value="' + pi + '"' +
            (taken ? ' disabled' : '') +
            (slots[i] === pi ? ' selected' : '') +
            '>' + paramLabel(p) + '</option>';
        });
        sel.innerHTML = html;
      });
    }

    function onSlotChange(i) {
      const slotEl = slotEls[i];
      const sel = slotEl.querySelector('select');
      const minI = slotEl.querySelector('.db-min');
      const maxI = slotEl.querySelector('.db-max');
      const pi = sel.value === '' ? null : parseInt(sel.value, 10);
      slots[i] = pi;

      minI.placeholder = '最小值';
      maxI.placeholder = '最大值';
      if (pi === null) {
        minI.value = ''; maxI.value = '';
        minI.disabled = false; maxI.disabled = false;
      } else {
        const p = params[pi];
        if (p.numeric) {
          const vals = p.values.filter((v) => v != null);
          minI.value = vals.length ? Math.min.apply(null, vals) : '';
          maxI.value = vals.length ? Math.max.apply(null, vals) : '';
          minI.disabled = false; maxI.disabled = false;
        } else {
          // 文本型参数：不参与数值筛选
          minI.value = ''; maxI.value = '';
          minI.placeholder = '文本型'; maxI.placeholder = '文本型';
          minI.disabled = true; maxI.disabled = true;
        }
      }
      refreshSelects();
    }

    slotEls.forEach((slotEl, i) => {
      slotEl.querySelector('select').addEventListener('change', () => onSlotChange(i));
    });
    refreshSelects();

    // ---------- 筛选 ----------
    filterBtn.addEventListener('click', () => {
      const conds = [];
      slotEls.forEach((slotEl, i) => {
        const pi = slots[i];
        if (pi === null) return;
        const p = params[pi];
        if (!p.numeric) return; // 文本型不参与范围筛选
        let mn = parseFloat(slotEl.querySelector('.db-min').value);
        let mx = parseFloat(slotEl.querySelector('.db-max').value);
        if (isNaN(mn)) mn = -Infinity;
        if (isNaN(mx)) mx = Infinity;
        conds.push({ pi: pi, mn: mn, mx: mx });
      });

      filteredIdx = vehicles.map((_, vi) => vi).filter((vi) =>
        conds.every((c) => {
          const v = params[c.pi].values[vi];
          return v != null && v >= c.mn && v <= c.mx;
        })
      );

      // 已选参数默认勾选（保留用户此前的额外勾选）
      slots.forEach((pi) => { if (pi !== null) checked.add(pi); });

      renderModalList(searchEl.value);
      mask.classList.add('show');
    });

    // ---------- 对话框 ----------
    function renderModalList(filterText) {
      const kw = (filterText || '').trim().toLowerCase();
      let html = '';
      params.forEach((p, pi) => {
        if (kw && (p.name + ' ' + (p.code || '')).toLowerCase().indexOf(kw) === -1) return;
        const isSlot = slots.includes(pi);
        html += '<label class="db-modal-item' + (isSlot ? ' db-is-slot' : '') + '">' +
          '<input type="checkbox" data-pi="' + pi + '"' + (checked.has(pi) ? ' checked' : '') + '>' +
          '<span>' + p.name +
          (p.code ? '<em class="db-code">' + p.code + '</em>' : '') +
          (isSlot ? '<em class="db-slot-tag">[筛选参数]</em>' : '') +
          (!p.numeric ? '<em class="db-text-tag">[文本型]</em>' : '') +
          '</span></label>';
      });
      listEl.innerHTML = html || '<div style="padding:16px;color:#999;text-align:center;">无匹配参数</div>';
    }

    searchEl.addEventListener('input', () => renderModalList(searchEl.value));
    $('#db-check-all').addEventListener('click', () => {
      listEl.querySelectorAll('input[type="checkbox"]').forEach((el) => { el.checked = true; });
    });
    $('#db-check-none').addEventListener('click', () => {
      listEl.querySelectorAll('input[type="checkbox"]').forEach((el) => { el.checked = false; });
    });

    $('#db-modal-ok').addEventListener('click', () => {
      checked = new Set();
      listEl.querySelectorAll('input[type="checkbox"]:checked').forEach((el) => {
        checked.add(parseInt(el.dataset.pi, 10));
      });
      mask.classList.remove('show');
      renderTable();
      renderChart();
    });
    $('#db-modal-cancel').addEventListener('click', () => mask.classList.remove('show'));
    mask.addEventListener('click', (e) => { if (e.target === mask) mask.classList.remove('show'); });

    // ---------- 表格 ----------
    function renderTable() {
      const rows = params.map((p, pi) => ({ p: p, pi: pi })).filter((x) => checked.has(x.pi));
      countEl.textContent = '筛选出 ' + filteredIdx.length + ' 款车型，显示 ' + rows.length + ' 个参数';

      let html = '<thead><tr><th>参数 \\ 车型</th>' +
        filteredIdx.map((vi) => '<th>' + vehicles[vi] + '</th>').join('') +
        '</tr></thead><tbody>';

      if (!filteredIdx.length) {
        html += '<tr><td class="db-empty" colspan="' + (rows.length + 1) + '">当前筛选条件下无符合的车型，请调整参数范围</td></tr>';
      } else if (!rows.length) {
        html += '<tr><td class="db-empty" colspan="' + (filteredIdx.length + 1) + '">请在对话框中勾选要显示的参数</td></tr>';
      } else {
        rows.forEach((x) => {
          const p = x.p;
          const title = p.name + (p.code ? ' (' + p.code + ')' : '') + (p.unit ? ' [' + p.unit + ']' : '');
          html += '<tr><th title="' + title + '">' + p.name + '</th>' +
            filteredIdx.map((vi) => {
              const r = p.raw[vi];
              return '<td>' + ((r === undefined || r === null || r === '') ? '/' : r) + '</td>';
            }).join('') + '</tr>';
        });
      }
      tableEl.innerHTML = html + '</tbody>';
    }

    // ---------- 图表 ----------
    function numericChecked() {
      return params.map((p, pi) => ({ p: p, pi: pi }))
        .filter((x) => checked.has(x.pi) && x.p.numeric);
    }

    function refreshPieSel() {
      const rows = numericChecked();
      if (chartType !== 'pie' || !rows.length) { pieSel.hidden = true; return; }
      pieSel.hidden = false;
      if (pieParam === null || !rows.some((x) => x.pi === pieParam)) pieParam = rows[0].pi;
      pieSel.innerHTML = rows.map((x) =>
        '<option value="' + x.pi + '"' + (x.pi === pieParam ? ' selected' : '') + '>' +
        x.p.name + (x.p.code ? ' (' + x.p.code + ')' : '') + '</option>'
      ).join('');
    }

    function renderChart() {
      if (!echartsOk) {
        chartEl.innerHTML = '<div class="db-chart-placeholder">ECharts 加载失败，无法渲染图表</div>';
        return;
      }
      const rows = numericChecked();
      refreshPieSel();

      if (!filteredIdx.length || !rows.length) {
        if (chart) { chart.dispose(); chart = null; }
        chartEl.innerHTML = '<div class="db-chart-placeholder">图 表 区<br><span style="font-size:12px;letter-spacing:0;">（筛选并勾选数值型参数后生成图表）</span></div>';
        return;
      }

      if (!chart) {
        chartEl.innerHTML = '';
        chart = echarts.init(chartEl);
      }
      const names = filteredIdx.map((vi) => vehicles[vi]);
      let option;

      if (chartType === 'pie') {
        const p = params[pieParam];
        option = {
          title: { text: p.name + (p.unit ? ' (' + p.unit + ')' : ''), left: 'center', textStyle: { fontSize: 14 } },
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
          series: [{
            type: 'pie', radius: ['25%', '58%'], center: ['50%', '52%'],
            label: { fontSize: 11 },
            data: filteredIdx.map((vi) => ({ name: vehicles[vi], value: p.values[vi] == null ? 0 : p.values[vi] }))
          }]
        };
      } else {
        option = {
          tooltip: { trigger: 'axis' },
          legend: { top: 0, type: 'scroll', textStyle: { fontSize: 11 } },
          grid: { top: 42, left: 12, right: 18, bottom: 8, containLabel: true },
          xAxis: { type: 'category', data: names, axisLabel: { rotate: 28, fontSize: 11 } },
          yAxis: { type: 'value' },
          series: rows.map((x) => ({
            name: x.p.code || x.p.name,
            type: chartType,
            symbolSize: chartType === 'scatter' ? 12 : undefined,
            data: filteredIdx.map((vi) => x.p.values[vi]),
            connectNulls: chartType === 'line'
          }))
        };
      }
      chart.setOption(option, true);
    }

    // 图表类型切换
    $$('.db-chart-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.db-chart-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        chartType = tab.dataset.type;
        renderChart();
      });
    });
    pieSel.addEventListener('change', () => {
      pieParam = parseInt(pieSel.value, 10);
      renderChart();
    });

    window.addEventListener('resize', () => { if (chart) chart.resize(); });

    // 初始空表
    renderTable();
  }
})();
