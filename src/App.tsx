import { Box } from "@mui/material";
import { RealTimeScale, StreamingPlugin } from "@robloche/chartjs-plugin-streaming";
import "chartjs-adapter-luxon";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import Annotation, { AnnotationOptions } from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  StreamingPlugin,
  RealTimeScale,
  Annotation,
);

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, std = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * std + mean;
}

function nSample(n: number, mean = 0, std = 1) {
  return Array.from({ length: n }, () => gaussianRandom(mean, std));
}

const UCL = 1.7013;
const LCL = 1.2987;

const chartMinMax: AnnotationOptions[] = [
  {
    type: "line",
    borderWidth: 0,
    scaleID: "y",
    value: UCL * 1.05,
  },
  {
    type: "line",
    borderWidth: 0,
    scaleID: "y",
    value: LCL - LCL * 0.05,
  },
];

export default function App() {
  return (
    <div>
      <Box sx={{}}>
        <Line
          width="800"
          height="500"
          style={{
            width: "auto",
            height: "auto",
          }}
          options={{
            plugins: {
              tooltip: {
                enabled: true,
              },
              title: {
                display: true,
                text: "Control",
              },
              annotation: {
                annotations: [
                  ...chartMinMax,
                  {
                    type: "line",
                    borderColor: "gray",
                    borderWidth: 1,
                    label: {
                      display: true,
                      backgroundColor: "transparent",
                      color: "gray",
                      content: UCL.toString(),
                      position: "start",
                      yAdjust: -10,
                    },
                    scaleID: "y",
                    value: UCL,
                  },
                  {
                    type: "line",
                    borderColor: "gray",
                    borderWidth: 1,
                    label: {
                      display: true,
                      backgroundColor: "transparent",
                      color: "gray",
                      content: LCL.toString(),
                      position: "start",
                      yAdjust: 10,
                    },
                    scaleID: "y",
                    value: LCL,
                  },
                ],
              },
              streaming: {
                duration: 30e3,
                refresh: 1000,
                frameRate: 25,
                delay: 5,
                onRefresh: (chart: ChartJS) => {
                  const dataset = chart.data.datasets[0];
                  dataset.data.push({
                    x: Date.now(),
                    y: nSample(20, 1.5, 0.15).reduce((a, b) => a + b, 0) / 20,
                  });
                },
              },
            },
            scales: {
              x: {
                type: "realtime",
              },
            },
          }}
          data={{
            datasets: [
              {
                label: "Dataset 1",
                backgroundColor: "rgba(54, 162, 235, 0.5)",
                borderColor: "rgb(54, 162, 235)",
                cubicInterpolationMode: "default",
                tension: 0,
                data: [],
                pointRadius: 2,
                segment: {
                  borderWidth: 2,
                },
              },
            ],
          }}
        />
      </Box>
    </div>
  );
}
