const MAX_CHECKBOXES = 2;
const BASE_COLORS = [
  "rgba(0, 0, 139, 0.8)",
  "rgba(139, 0, 0, 0.8)",
  "rgba(0, 100, 0, 0.8)",
  "rgba(75, 0, 130, 0.8)",
  "rgba(139, 69, 19, 0.8)",
  "rgba(85, 107, 47, 0.8)",
  "rgba(0, 139, 139, 0.8)",
  "rgba(255, 140, 0, 0.8)",
  "rgba(128, 0, 128, 0.8)",
  "rgba(0, 128, 128, 0.8)",
  "rgba(0, 0, 0, 0.8)",
  "rgba(47, 79, 79, 0.8)",
  "rgba(70, 130, 180, 0.8)",
];

// Chart instances
let barChartInstance = null;
let pieChartInstance = null;

// Data storage
let originalData = [];

// DOM Elements
const tableSelect = $("#table-select");
const checkboxContainer = $("#checkbox-container");
const runBtn = $("#run-btn");
const saveTemplateBtn = $("#save-template");
const loadTemplateSelect = $("#load-template");

// Event Listeners
$(document).ready(() => {
  fetchTables();
  loadTemplateOptions();
  setupDownloadButtons();

  tableSelect.on("change", handleTableChange);
  runBtn.on("click", handleRunButtonClick);
  saveTemplateBtn.on("click", handleSaveTemplate);
  loadTemplateSelect.on("change", handleLoadTemplate);
});

// API Calls
function fetchTables() {
  $.ajax({
    url: "fetch_tables.php",
    type: "GET",
    dataType: "json",
    success: populateTableSelect,
    error: (error) => console.error("Error fetching tables:", error),
  });
}

function fetchFields(table) {
  $.ajax({
    url: "fetch_fields.php",
    type: "GET",
    data: { table },
    dataType: "json",
    success: generateCheckboxes,
    error: (jqXHR, textStatus, errorThrown) =>
      console.error("Error fetching fields:", textStatus, errorThrown),
  });
}

function fetchData(table, fields) {
  $.ajax({
    url: "fetch_data.php",
    type: "GET",
    data: { table, fields: fields.join(",") },
    dataType: "json",
    success: (data) => {
      originalData = data;
      const aggregatedData = aggregateData(data, fields);
      renderCharts(aggregatedData, fields);
    },
    error: (error) => console.error("Error fetching data:", error),
  });
}

// Event Handlers
function handleTableChange() {
  const table = $(this).val();
  resetCharts();
  fetchFields(table);
}

function handleRunButtonClick() {
  const table = tableSelect.val();
  const selectedFields = getSelectedFields();
  if (selectedFields.length === 0) {
    alert("Please select at least one checkbox.");
  } else {
    fetchData(table, selectedFields);
  }
}

function handleSaveTemplate() {
  const templateName = prompt("Enter a name for this template:");
  if (templateName) {
    const table = tableSelect.val();
    const selectedFields = getSelectedFields();

    $.ajax({
      url: "save_template.php",
      type: "POST",
      data: {
        name: templateName,
        table: table,
        fields: JSON.stringify(selectedFields),
      },
      success: () => {
        alert("Template saved successfully!");
        loadTemplateOptions();
      },
      error: (error) => {
        console.error("Error saving template:", error);
        alert("Error saving template. Please try again.");
      },
    });
  }
}

function handleLoadTemplate() {
  const templateId = $(this).val();
  if (templateId) {
    $.ajax({
      url: "load_template.php",
      type: "GET",
      data: { id: templateId },
      dataType: "json",
      success: loadTemplate,
      error: (error) => {
        console.error("Error loading template:", error);
        alert("Error loading template. Please try again.");
      },
    });
  }
}

// Helper Functions
function populateTableSelect(tables) {
  tableSelect.empty();
  tables.forEach((table) => {
    tableSelect.append(`<option value="${table}">${table}</option>`);
  });

  if (tables.length > 0) {
    fetchFields(tables[0]);
  }
}

function generateCheckboxes(fields) {
  checkboxContainer.empty();

  fields.forEach((field) => {
    checkboxContainer.append(`
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${field}" id="checkbox-${field}">
                <label class="form-check-label" for="checkbox-${field}">${field}</label>
            </div>
        `);
  });

  $(".form-check-input").on("change", enforceMaxCheckboxes);
}

function enforceMaxCheckboxes() {
  const selectedCheckboxes = $(".form-check-input:checked").length;
  $(".form-check-input:not(:checked)").prop(
    "disabled",
    selectedCheckboxes >= MAX_CHECKBOXES
  );
}

function getSelectedFields() {
  return $("input[type=checkbox]:checked")
    .map(function () {
      return $(this).val();
    })
    .get();
}

function resetCharts() {
  $("#chart").empty();
  if (barChartInstance) {
    barChartInstance.destroy();
    barChartInstance = null;
  }
  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }
}

function aggregateData(data, fields) {
  const result = {};

  data.forEach((item) => {
    const key = fields.map((field) => item[field]).join(" - ");
    result[key] = (result[key] || 0) + 1;
  });

  return Object.entries(result).map(([key, count]) => ({
    key,
    count,
    ...Object.fromEntries(
      fields.map((field, index) => [field, key.split(" - ")[index]])
    ),
  }));
}

function renderCharts(data, fields) {
  renderBarChart(data, fields);
  renderPieChart(data, fields);
}

function renderBarChart(data, fields) {
  const ctx = $("#bar-chart")[0].getContext("2d");

  if (barChartInstance) {
    barChartInstance.destroy();
  }

  const labels = data.map((item) => item.key);
  const counts = data.map((item) => item.count);
  const colors = generateColors(labels.length);

  barChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Count",
          data: counts,
          backgroundColor: colors.map((color) => color.backgroundColor),
          borderColor: colors.map((color) => color.borderColor),
          borderWidth: 1,
        },
      ],
    },
    options: getBarChartOptions(),
  });
}

function renderPieChart(data, fields) {
  const ctx = $("#pie-chart")[0].getContext("2d");

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  const labels = data.map((item) => item.key);
  const counts = data.map((item) => item.count);
  const colors = generateColors(labels.length);

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: counts,
          backgroundColor: colors.map((color) => color.backgroundColor),
          borderColor: colors.map((color) => color.borderColor),
          borderWidth: 1,
        },
      ],
    },
    options: getPieChartOptions(fields),
  });
}

function generateColors(count) {
  return Array.from({ length: count }, (_, i) => ({
    backgroundColor: BASE_COLORS[i % BASE_COLORS.length],
    borderColor: BASE_COLORS[i % BASE_COLORS.length].replace("0.8", "1"),
  }));
}
function getBarChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 90,
          minRotation: 0,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Count: ${context.parsed.y}`,
        },
      },
    },
  };
}

function getPieChartOptions(fields) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 12,
        },
      },
      title: {
        display: true,
        text: `${fields.join(" & ")} Distribution`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}`,
        },
      },
    },
  };
}

function loadTemplateOptions() {
  $.ajax({
    url: "get_templates.php",
    type: "GET",
    dataType: "json",
    success: (templates) => {
      loadTemplateSelect.find("option:not(:first)").remove();
      templates.forEach((template) => {
        loadTemplateSelect.append(
          `<option value="${template.id}">${template.name}</option>`
        );
      });
    },
    error: (error) => console.error("Error fetching templates:", error),
  });
}

function loadTemplate(template) {
  tableSelect.val(template.table_name).trigger("change");
  setTimeout(() => {
    const fields = JSON.parse(template.fields);
    fields.forEach((field) => {
      $(`#checkbox-${field}`).prop("checked", true);
    });
    runBtn.click();
  }, 500);
}

function downloadChart(chartInstance, fileName) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = chartInstance.width;
  tempCanvas.height = chartInstance.height;
  const tempCtx = tempCanvas.getContext("2d");

  tempCtx.fillStyle = "white";
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  tempCtx.drawImage(chartInstance.canvas, 0, 0);

  const link = document.createElement("a");
  link.href = tempCanvas.toDataURL("image/png");
  link.download = fileName;
  link.click();
}

function setupDownloadButtons() {
  $("#download-bar-chart").on("click", () => {
    if (barChartInstance) {
      downloadChart(barChartInstance, "bar-chart.png");
    } else {
      alert("Bar chart is not available. Please generate the report first.");
    }
  });

  $("#download-pie-chart").on("click", () => {
    if (pieChartInstance) {
      downloadChart(pieChartInstance, "pie-chart.png");
    } else {
      alert("Pie chart is not available. Please generate the report first.");
    }
  });
}
