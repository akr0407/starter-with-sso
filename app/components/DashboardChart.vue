<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { computed } from 'vue'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  data?: any
}>()

// Mock data if none provided
const chartData = computed(() => props.data || {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Activity',
      backgroundColor: (ctx: any) => {
        const canvas = ctx.chart.ctx;
        const gradient = canvas.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        return gradient;
      },
      borderColor: '#6366f1',
      borderWidth: 2,
      data: [12, 19, 15, 25, 22, 30, 45],
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(9, 9, 11, 0.9)',
      titleColor: '#f4f4f5',
      bodyColor: '#a1a1aa',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      callbacks: {
        label: (context: any) => ` ${context.parsed.y} actions`
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false,
      },
      ticks: {
        color: '#71717a',
        font: {
          family: "'Outfit', sans-serif",
          size: 11
        }
      },
      border: { display: false }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#71717a',
        font: {
          family: "'Outfit', sans-serif",
          size: 11
        }
      },
      border: { display: false }
    }
  }
}
</script>

<template>
  <div class="chart-wrapper">
    <Line :data="chartData" :options="chartOptions as any" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  height: 300px;
  width: 100%;
}
</style>
