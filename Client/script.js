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

let barChartInstance = null;
let pieChartInstance = null;
let originalData = [];

// DOM Elements
const tableSelect = document.getElementById("table-select");
const checkboxContainer = document.getElementById("checkbox-container");
const runBtn = document.getElementById("run-btn");
const saveTemplateBtn = document.getElementById("save-template");
const loadTemplateSelect = document.getElementById("load-template");
const viewOnDashboardCheckbox = document.getElementById("view-on-dashboard");

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  await fetchTables();
  await loadTemplateOptions();
  setupDownloadButtons();

  tableSelect.addEventListener("change", handleTableChange);
  runBtn.addEventListener("click", handleRunButtonClick);
  saveTemplateBtn.addEventListener("click", handleSaveTemplate);
  loadTemplateSelect.addEventListener("change", handleLoadTemplate);
});

// API Calls
async function fetchTables() {
  try {
    const response = await fetch("fetch_tables.php");
    const tables = await response.json();
    populateTableSelect(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
  }
}

async function fetchFields(table) {
  try {
    const response = await fetch(
      `fetch_fields.php?table=${encodeURIComponent(table)}`
    );
    const fields = await response.json();
    generateCheckboxes(fields);
  } catch (error) {
    console.error("Error fetching fields:", error);
  }
}

async function fetchData(table, fields) {
  try {
    const response = await fetch(
      `fetch_data.php?table=${encodeURIComponent(
        table
      )}&fields=${encodeURIComponent(fields.join(","))}`
    );
    const data = await response.json();
    originalData = data;
    const aggregatedData = aggregateData(data, fields);
    renderCharts(aggregatedData, fields);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Event Handlers
async function handleTableChange() {
  const table = this.value;
  resetCharts();
  await fetchFields(table);
  loadTemplateSelect.value = "";
}

async function handleRunButtonClick() {
  const table = tableSelect.value;
  const selectedFields = getSelectedFields();
  if (selectedFields.length === 0) {
    alert("Please select at least one checkbox.");
  } else {
    await fetchData(table, selectedFields);
  }
}

async function handleSaveTemplate() {
  const templateName = prompt("Enter a name for this template:");
  if (templateName) {
    const table = tableSelect.value;
    const selectedFields = getSelectedFields();
    const viewOnDashboard =
      document.getElementById("view-on-dashboard").checked;

    try {
      const response = await fetch("save_template.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `name=${encodeURIComponent(
          templateName
        )}&table=${encodeURIComponent(table)}&fields=${encodeURIComponent(
          JSON.stringify(selectedFields)
        )}&view_on_dashboard=${viewOnDashboard ? 1 : 0}`,
      });
      const result = await response.json();
      if (result.success) {
        alert("Template saved successfully!");
        await loadTemplateOptions();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template. Please try again.");
    }
  }
}

async function handleLoadTemplate() {
  const templateId = this.value;
  if (templateId) {
    try {
      const response = await fetch(
        `load_template.php?id=${encodeURIComponent(templateId)}`
      );
      const template = await response.json();
      await loadTemplate(template);
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Error loading template. Please try again.");
    }
  } else {
    resetCharts();
  }
}



// Helper Functions
function populateTableSelect(tables) {
  tableSelect.innerHTML = "";
  tables.forEach((table) => {
    const option = document.createElement("option");
    option.value = table;
    option.textContent = table;
    tableSelect.appendChild(option);
  });

  if (tables.length > 0) {
    fetchFields(tables[0]);
  }
}

function generateCheckboxes(fields) {
  checkboxContainer.innerHTML = "";

  fields.forEach((field) => {
    const div = document.createElement("div");
    div.className = "form-check";
    div.innerHTML = `
      <input class="form-check-input" type="checkbox" value="${field}" id="checkbox-${field}">
      <label class="form-check-label" for="checkbox-${field}">${field}</label>
    `;
    checkboxContainer.appendChild(div);
  });

  document
    .querySelectorAll(".form-check-input:not(#view-on-dashboard)")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", enforceMaxCheckboxes);
    });
}

function enforceMaxCheckboxes() {
  const selectedCheckboxes = document.querySelectorAll(
    ".form-check-input:checked"
  ).length;
  document
    .querySelectorAll(".form-check-input:not(:checked)")
    .forEach((checkbox) => {
      checkbox.disabled = selectedCheckboxes >= MAX_CHECKBOXES;
    });

  viewOnDashboardCheckbox.disabled = false;
}

function getSelectedFields() {
  return Array.from(
    document.querySelectorAll(
      ".form-check-input:checked:not(#view-on-dashboard)"
    )
  ).map((checkbox) => checkbox.value);
}

function resetCharts() {
  const barChartElement = document.getElementById("bar-chart");
  const pieChartElement = document.getElementById("pie-chart");

  barChartElement.innerHTML = "";
  pieChartElement.innerHTML = "";

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
  const ctx = document.getElementById("bar-chart").getContext("2d");

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
  const ctx = document.getElementById("pie-chart").getContext("2d");

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

async function loadTemplateOptions() {
  try {
    const response = await fetch("get_templates.php");
    const templates = await response.json();
    loadTemplateSelect.innerHTML =
      '<option value="">Select a template</option>';
    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      loadTemplateSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
  }
}

async function loadTemplate(template) {
  tableSelect.value = template.table_name;
  await fetchFields(template.table_name);

  setTimeout(() => {
    const fields = JSON.parse(template.fields);
    fields.forEach((field) => {
      const checkbox = document.getElementById(`checkbox-${field}`);
      if (checkbox) checkbox.checked = true;
    });
    viewOnDashboardCheckbox.checked = template.view_on_dashboard === "1";
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
  document
    .getElementById("download-bar-chart")
    .addEventListener("click", () => {
      if (barChartInstance) {
        downloadChart(barChartInstance, "bar-chart.png");
      } else {
        alert("Bar chart is not available. Please generate the report first.");
      }
    });

  document
    .getElementById("download-pie-chart")
    .addEventListener("click", () => {
      if (pieChartInstance) {
        downloadChart(pieChartInstance, "pie-chart.png");
      } else {
        alert("Pie chart is not available. Please generate the report first.");
      }
    });
}
