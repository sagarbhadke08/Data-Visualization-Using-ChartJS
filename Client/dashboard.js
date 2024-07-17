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

document.addEventListener("DOMContentLoaded", async () => {
  await loadDashboardReports();
});

async function loadDashboardReports() {
    try {
        const response = await fetch('get_dashboard_templates.php');
        const templates = await response.json();
        
        const reportsContainer = document.getElementById('reports-container');
        
        for (const template of templates) {
            if (template.view_on_dashboard == 1) {  // Only render if view_on_dashboard is true
                const reportDiv = createReportDiv(template);
                reportsContainer.appendChild(reportDiv);
                await fetchDataAndRenderCharts(template, reportDiv);
            }
        }
    } catch (error) {
        console.error('Error loading dashboard reports:', error);
    }
}

function createReportDiv(template) {
  const reportDiv = document.createElement("div");
  reportDiv.className = "col-md-6 mb-4";
  reportDiv.innerHTML = `
          <div class="card">
              <div class="card-header">
                  <h3 class="card-title h5 mb-0">${template.name}</h3>
              </div>
              <div class="card-body">
                  <canvas id="chart-${template.id}"></canvas>
              </div>
          </div>
      `;
  return reportDiv;
}

async function fetchDataAndRenderCharts(template, reportDiv) {
    try {
        let fields = JSON.parse(template.fields);
        // Remove 'on' from fields
        fields = fields.filter(field => field !== 'on');

        if (fields.length === 0) {
            throw new Error('No valid fields selected');
        }

        const response = await fetch(`fetch_data.php?table=${encodeURIComponent(template.table_name.trim())}&fields=${encodeURIComponent(fields.join(','))}`);
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            console.log('Received data:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (!Array.isArray(data)) {
                console.error('Received data is not an array:', data);
                throw new Error('Invalid data format');
            }

            const aggregatedData = aggregateData(data, fields);
            renderChart(aggregatedData, fields, `chart-${template.id}`);
        } else {
            const text = await response.text();
            console.error('Received non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }
    } catch (error) {
        console.error('Error fetching or rendering data for template:', template, error);
        reportDiv.querySelector('.card-body').innerHTML = `
            <p class="text-danger">Error loading chart: ${error.message}</p>
            <pre class="text-muted" style="font-size: 0.8em;">${error.stack}</pre>
        `;
    }
}

function aggregateData(data, fields) {
    if (!Array.isArray(data)) {
        console.error('Data is not an array in aggregateData:', data);
        return [];
    }

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

function renderChart(data, fields, chartId) {
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
    options: getChartOptions(fields),
  });
}

function generateColors(count) {
  return Array.from({ length: count }, (_, i) => ({
    backgroundColor: BASE_COLORS[i % BASE_COLORS.length],
    borderColor: BASE_COLORS[i % BASE_COLORS.length].replace("0.8", "1"),
  }));
}

function getChartOptions(fields) {
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
        text: `${fields.join(" & ")} Distribution`,
        font: {
          size: 16,
        },
      },
    },
  };
}
