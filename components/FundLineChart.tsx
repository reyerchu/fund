import { Line } from 'react-chartjs-2';

interface FundLineChartProps {
  title: string;
  labels: (string | number | null)[];
  data: number[];
  color?: string;
  height?: number;
  yLabel?: string;
}

export default function FundLineChart({
  title,
  labels,
  data,
  color = 'rgba(54, 162, 235, 1)',
  height = 220,
  yLabel = '數值'
}: FundLineChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: color,
        backgroundColor: color.replace('1)', '0.2)'),
        tension: 0.2,
        pointRadius: 0,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index" as const, intersect: false }
    },
    scales: {
      x: { title: { display: true, text: '區塊高度' } },
      y: { title: { display: true, text: yLabel } }
    }
  };

  return (
    <div className="card mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      {data.length > 0 ? (
        <Line data={chartData} options={chartOptions} height={height} />
      ) : (
        <div className="text-gray-500 text-center py-8">暫無資料</div>
      )}
    </div>
  );
}