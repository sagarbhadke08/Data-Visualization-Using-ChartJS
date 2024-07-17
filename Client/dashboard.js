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

async function loadDashboardReports() {
  try {
    const response = await fetch("get_dashboard_templates.php");
    const templates = await response.json();

    const reportsContainer = document.getElementById("reports-container");
    reportsContainer.innerHTML = ""; // Clear existing reports

    for (const template of templates) {
      const reportDiv = createReportDiv(template);
      reportsContainer.appendChild(reportDiv);
      await fetchDataAndRenderCharts(template, reportDiv);
    }
  } catch (error) {
    console.error("Error loading dashboard reports:", error);
  }
}

function createReportDiv(template) {
  const reportDiv = document.createElement("div");
  reportDiv.className = "col-12 mb-4";
  reportDiv.innerHTML = `
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="card-title h5 mb-0">${template.name} - Bar Chart</h3>
            <button class="btn btn-sm btn-outline-light" onclick="downloadChart('bar-chart-${template.id}', '${template.name}_bar_chart.png')">
              <i class="fas fa-download"></i> Download
            </button>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="bar-chart-${template.id}"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="card-title h5 mb-0">${template.name} - Pie Chart</h3>
            <button class="btn btn-sm btn-outline-light" onclick="downloadChart('pie-chart-${template.id}', '${template.name}_pie_chart.png')">
              <i class="fas fa-download"></i> Download
            </button>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="pie-chart-${template.id}"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  return reportDiv;
}
async function fetchDataAndRenderCharts(template, reportDiv) {
  try {
    let fields = JSON.parse(template.fields);
    fields = fields.filter((field) => field !== "on");

    if (fields.length === 0) {
      throw new Error("No valid fields selected");
    }

    const response = await fetch(
      `fetch_data.php?table=${encodeURIComponent(
        template.table_name.trim()
      )}&fields=${encodeURIComponent(fields.join(","))}`
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!Array.isArray(data)) {
      throw new Error("Invalid data format");
    }

    const aggregatedData = aggregateData(data, fields);
    renderBarChart(aggregatedData, fields, `bar-chart-${template.id}`);
    renderPieChart(aggregatedData, fields, `pie-chart-${template.id}`);
  } catch (error) {
    console.error(
      "Error fetching or rendering data for template:",
      template,
      error
    );
    reportDiv.querySelector(".card-body").innerHTML = `
            <p class="text-danger">Error loading charts: ${error.message}</p>
        `;
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

function renderBarChart(data, fields, chartId) {
  const ctx = document.getElementById(chartId).getContext("2d");

  const labels = data.map((item) => item.key);
  const counts = data.map((item) => item.count);
  const colors = generateColors(labels.length);

  new Chart(ctx, {
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
    options: getBarChartOptions(fields),
  });
}

function renderPieChart(data, fields, chartId) {
  const ctx = document.getElementById(chartId).getContext("2d");

  const labels = data.map((item) => item.key);
  const counts = data.map((item) => item.count);
  const colors = generateColors(labels.length);

  new Chart(ctx, {
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

function getBarChartOptions(fields) {
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
      title: {
        display: true,
        text: `${fields.join(" & ")} Distribution - Bar Chart`,
        font: {
          size: 16,
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
        text: `${fields.join(" & ")} Distribution - Pie Chart`,
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

function generateColors(count) {
  return Array.from({ length: count }, (_, i) => ({
    backgroundColor: BASE_COLORS[i % BASE_COLORS.length],
    borderColor: BASE_COLORS[i % BASE_COLORS.length].replace("0.8", "1"),
  }));
}

function getChartOptions(fields, chartType) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5, // You can adjust this value to change the aspect ratio
    plugins: {
      legend: {
        display: chartType === "Pie Chart",
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: (context) => `Count: ${context.raw}`,
        },
      },
      title: {
        display: true,
        text: `${fields.join(" & ")} Distribution - ${chartType}`,
        font: {
          size: 16,
        },
      },
    },
  };
}

function downloadChart(chartId, fileName) {
  const canvas = document.getElementById(chartId);
  const image = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = fileName;
  link.href = image;
  link.click();
}

document.addEventListener("DOMContentLoaded", loadDashboardReports);
