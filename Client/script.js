$(document).ready(function () {
  let barChartInstance = null;
  let pieChartInstance = null;

  const maxCheckboxes = 2;

  $("#table-select").on("change", function () {
    const table = $(this).val();
    $("#chart").empty();
    fetchFields(table);
    if (barChartInstance) {
      barChartInstance.destroy();
      barChartInstance = null;
    }
    if (pieChartInstance) {
      pieChartInstance.destroy();
      pieChartInstance = null;
    }
  });

  $("#checkbox-container").on("change", ".form-check-input", function () {
    const selectedCheckboxes = $(".form-check-input:checked").length;
    if (selectedCheckboxes >= maxCheckboxes) {
      $(".form-check-input:not(:checked)").prop("disabled", true);
    } else {
      $(".form-check-input").prop("disabled", false);
    }
  });

  $("#checkbox-container").on("click", "#run-btn", function () {
    const table = $("#table-select").val();
    const selectedFields = [];
    $("input[type=checkbox]:checked").each(function () {
      selectedFields.push($(this).val());
    });
    if (selectedFields.length === 0) {
      alert("Please select at least one checkbox.");
    } else {
      fetchData(table, selectedFields);
    }
  });

  function fetchFields(table) {
    $.ajax({
      url: "fetch_fields.php",
      type: "GET",
      data: { table: table },
      dataType: "json",
      success: function (fields) {
        generateCheckboxes(fields);
      },
      error: function (error) {
        console.error("Error fetching fields:", error);
      },
    });
  }

  function generateCheckboxes(fields) {
    const container = $("#checkbox-container");
    container.empty();
    fields.forEach((field) => {
      container.append(`
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${field}" id="checkbox-${field}">
          <label class="form-check-label" for="checkbox-${field}">
            ${field}
          </label>
        </div>
      `);
    });
    const runButton = $('<button id="run-btn" class="btn btn-primary mt-3">Run</button>');
    container.append(runButton);
  }

  function fetchData(table, fields) {
    $.ajax({
      url: "fetch_data.php",
      type: "GET",
      data: { table: table, fields: fields.join(",") },
      dataType: "json",
      success: function (data) {
        const aggregatedData = aggregateData(data, fields);
        renderCharts(aggregatedData, fields);
        console.log(aggregatedData);
      },
      error: function (error) {
        console.error("Error fetching data:", error);
      },
    });
  }

  function aggregateData(data, fields) {
    const result = {};
    data.forEach((item) => {
      const key = fields.map(field => item[field]).join(' - ');
      if (!result[key]) {
        result[key] = 1;
      } else {
        result[key]++;
      }
    });
    return Object.keys(result).map(key => ({ 
      key: key,
      count: result[key],
      ...Object.fromEntries(fields.map((field, index) => [field, key.split(' - ')[index]]))
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
        datasets: [{
          label: 'Count',
          data: counts,
          backgroundColor: colors.map(color => color.backgroundColor),
          borderColor: colors.map(color => color.borderColor),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          },
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 90,
              minRotation: 90
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Count: ${context.parsed.y}`;
              }
            }
          }
        }
      },
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
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: `${fields.join(" & ")} Distribution`,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed}`;
              }
            }
          }
        },
      },
    });
  }

  function generateColors(count) {
    const baseColors = [
      'rgba(0, 0, 139, 0.8)',   // Dark Blue
      'rgba(139, 0, 0, 0.8)',   // Dark Red
      'rgba(0, 100, 0, 0.8)',   // Dark Green
      'rgba(75, 0, 130, 0.8)',  // Indigo
      'rgba(139, 69, 19, 0.8)', // Saddle Brown
      'rgba(85, 107, 47, 0.8)', // Dark Olive Green
      'rgba(0, 139, 139, 0.8)', // Dark Cyan
      'rgba(255, 140, 0, 0.8)', // Dark Orange
      'rgba(128, 0, 128, 0.8)', // Purple
      'rgba(0, 128, 128, 0.8)', // Teal
      'rgba(0, 0, 0, 0.8)',     // Black
      'rgba(47, 79, 79, 0.8)',  // Dark Slate Gray
      'rgba(70, 130, 180, 0.8)' // Steel Blue
    ];
    const baseBorderColors = baseColors.map(color => color.replace('0.8', '1'));

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push({
        backgroundColor: baseColors[i % baseColors.length],
        borderColor: baseBorderColors[i % baseBorderColors.length]
      });
    }
    return colors;
  }

  const initialTable = $("#table-select").val();
  fetchFields(initialTable);
});
