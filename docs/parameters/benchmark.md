<div id="db-app">
  <h1 class="db-title">对标数据库</h1>

  <!-- 参数筛选区：5 组参数 -->
  <div class="db-panel">
    <div class="db-slot">
      <div class="db-sel-wrap"><select></select></div>
      <input class="db-range db-min" placeholder="最小值">
      <input class="db-range db-max" placeholder="最大值">
    </div>
    <div class="db-slot">
      <div class="db-sel-wrap"><select></select></div>
      <input class="db-range db-min" placeholder="最小值">
      <input class="db-range db-max" placeholder="最大值">
    </div>
    <div class="db-slot">
      <div class="db-sel-wrap"><select></select></div>
      <input class="db-range db-min" placeholder="最小值">
      <input class="db-range db-max" placeholder="最大值">
    </div>
    <div class="db-slot">
      <div class="db-sel-wrap"><select></select></div>
      <input class="db-range db-min" placeholder="最小值">
      <input class="db-range db-max" placeholder="最大值">
    </div>
    <div class="db-slot">
      <div class="db-sel-wrap"><select></select></div>
      <input class="db-range db-min" placeholder="最小值">
      <input class="db-range db-max" placeholder="最大值">
    </div>
  </div>

  <div class="db-filter-row">
    <button class="db-filter-btn" id="db-filter">筛 选</button>
    <span class="db-count" id="db-count"></span>
    <span class="db-status" id="db-status"></span>
  </div>

  <!-- 主内容区：左表格 + 右图表 -->
  <div class="db-content">
    <div class="db-table-wrap">
      <table class="db-table" id="db-table"></table>
    </div>
    <div class="db-chart-side">
      <div class="db-chart-tabs">
        <button class="db-chart-tab active" data-type="bar">柱状图</button>
        <button class="db-chart-tab" data-type="line">折线图</button>
        <button class="db-chart-tab" data-type="scatter">散点图</button>
        <button class="db-chart-tab" data-type="pie">饼图</button>
        <select class="db-pie-sel" id="db-pie-param" hidden></select>
      </div>
      <div class="db-chart-canvas" id="db-chart">
        <div class="db-chart-placeholder">图 表 区</div>
      </div>
    </div>
  </div>

  <!-- 弹出对话框：参数勾选 -->
  <div class="db-modal-mask" id="db-modal-mask">
    <div class="db-modal">
      <div class="db-modal-header">选择要显示的参数（表格与图表联动）</div>
      <div class="db-modal-tools">
        <input class="db-modal-search" id="db-modal-search" placeholder="搜索参数名 / 代码">
        <button class="db-tool-btn" id="db-check-all">全选</button>
        <button class="db-tool-btn" id="db-check-none">清空</button>
      </div>
      <div class="db-modal-body" id="db-modal-list"></div>
      <div class="db-modal-footer">
        <button class="db-btn-cancel" id="db-modal-cancel">取 消</button>
        <button class="db-btn-ok" id="db-modal-ok">确 定</button>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
