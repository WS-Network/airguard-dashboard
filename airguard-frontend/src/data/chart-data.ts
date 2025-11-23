// Chart data for dashboard analytics components

export const barChartData = [
  { name: "Optimized", value: 3247, color: "#d8ff43" },
  { name: "Congested", value: 489, color: "#ff9633" },
  { name: "Interference", value: 134, color: "#ff4444" },
  { name: "Idle", value: 278, color: "#43ffd6" },
];

export const pieChartData = [
  { name: "Healthy", value: 142, color: "#d8ff43" },
  { name: "Warning", value: 28, color: "#ff9633" },
  { name: "Critical", value: 7, color: "#ff4444" },
  { name: "Offline", value: 13, color: "#666666" },
];

// Predicted throughput performance data for different time periods
export const throughputData = {
  today: [
    { time: "00:00", actual: 78, predicted: 82 },
    { time: "02:00", actual: 72, predicted: 75 },
    { time: "04:00", actual: 68, predicted: 70 },
    { time: "06:00", actual: 75, predicted: 78 },
    { time: "08:00", actual: 88, predicted: 92 },
    { time: "10:00", actual: 95, predicted: 98 },
    { time: "12:00", actual: 92, predicted: 95 },
    { time: "14:00", actual: 89, predicted: 93 },
    { time: "16:00", actual: 94, predicted: 97 },
    { time: "18:00", actual: 91, predicted: 94 },
    { time: "20:00", actual: 85, predicted: 88 },
    { time: "22:00", actual: 80, predicted: 83 },
  ],
  lastHour: [
    { time: "59m", actual: 91, predicted: 94 },
    { time: "54m", actual: 89, predicted: 92 },
    { time: "49m", actual: 92, predicted: 95 },
    { time: "44m", actual: 88, predicted: 91 },
    { time: "39m", actual: 94, predicted: 97 },
    { time: "34m", actual: 96, predicted: 99 },
    { time: "29m", actual: 93, predicted: 96 },
    { time: "24m", actual: 90, predicted: 93 },
    { time: "19m", actual: 95, predicted: 98 },
    { time: "14m", actual: 92, predicted: 95 },
    { time: "9m", actual: 89, predicted: 92 },
    { time: "4m", actual: 91, predicted: 94 },
  ],
  last15Minutes: [
    { time: "15m", actual: 89, predicted: 92 },
    { time: "14m", actual: 91, predicted: 94 },
    { time: "13m", actual: 88, predicted: 91 },
    { time: "12m", actual: 93, predicted: 96 },
    { time: "11m", actual: 90, predicted: 93 },
    { time: "10m", actual: 95, predicted: 98 },
    { time: "9m", actual: 92, predicted: 95 },
    { time: "8m", actual: 89, predicted: 92 },
    { time: "7m", actual: 94, predicted: 97 },
    { time: "6m", actual: 91, predicted: 94 },
    { time: "5m", actual: 93, predicted: 96 },
    { time: "4m", actual: 88, predicted: 91 },
    { time: "3m", actual: 96, predicted: 99 },
    { time: "2m", actual: 90, predicted: 93 },
    { time: "1m", actual: 92, predicted: 95 },
  ],
};

export const lineChartData = [
  { name: "Jan", metricA: 85, metricB: 92 },
  { name: "Feb", metricA: 88, metricB: 89 },
  { name: "Mar", metricA: 92, metricB: 94 },
  { name: "Apr", metricA: 89, metricB: 91 },
  { name: "May", metricA: 94, metricB: 96 },
  { name: "Jun", metricA: 96, metricB: 98 },
];
