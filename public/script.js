document.addEventListener('DOMContentLoaded', () => {
    const addTransactionButton = document.getElementById('addTransactionButton');
    if (addTransactionButton) {
        addTransactionButton.addEventListener('click', () => {
            window.location.href = '/add'; // Redirect to the add transaction page
        });
    }

    // You would add more JavaScript here for filtering, sorting,
    // handling form submissions, and potentially dynamic updates.
});

// public/script.js (or within <script> tags in your EJS file)
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/income-expense-summary')
        .then(response => response.json())
        .then(data => {
            const pieChartCtx = document.getElementById('incomeExpensePieChart').getContext('2d');
            new Chart(pieChartCtx, {
                type: 'doughnut', // Doughnut chart is a modern-looking pie chart
                data: {
                    labels: ['Income', 'Expenses'],
                    datasets: [{
                        data: [data.totalIncome, data.totalExpenses],
                        backgroundColor: [
                            '#2ecc71', // Modern green for income
                            '#e74c3c'  // Modern red for expenses
                        ],
                        hoverBackgroundColor: [
                            '#27ae60',
                            '#c0392b'
                        ],
                        borderWidth: 0, // Remove border for a cleaner look
                        spacing: 5,     // Add some spacing between slices
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%', // Adjust for the thickness of the doughnut
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true, // Use circles for legend items
                                boxWidth: 10
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (context.parsed !== null) {
                                        label += ': ₹' + context.parsed.toFixed(2);
                                    }
                                    return label;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Income vs Expenses',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching income/expense data for pie chart:', error));
});