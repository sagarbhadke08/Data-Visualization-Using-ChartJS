<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
    body {
        background-color: #f8f9fa;
    }

    .card {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .card-header {
        background-color: #007bff;
        color: white;
    }

    .chart-container {
        height: 300px;
        position: relative;
    }
    </style>
</head>

<body>
    <div class="container-fluid py-4">
        <h1 class="mb-4 text-center">Dashboard</h1>
        <div id="reports-container" class="row">
            <!-- Reports will be dynamically inserted here -->
        </div>
    </div>

    <script src="dashboard.js"></script>
</body>

</html>