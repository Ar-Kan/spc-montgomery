import { AnnotationOptions } from "chartjs-plugin-annotation";
import { memo, RefObject } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";

function chartLine({
  value,
  color,
  lineColor,
  label,
  yAdjust = 0,
  xAdjust = 0,
}: {
  value: number;
  color: string;
  lineColor?: string;
  label?: string;
  yAdjust?: number;
  xAdjust?: number;
}): AnnotationOptions {
  return {
    type: "line",
    borderColor: lineColor || color,
    borderWidth: 1,
    label: {
      display: !!label,
      backgroundColor: "transparent",
      color: color,
      content: label || "",
      position: "start",
      yAdjust: yAdjust,
      xAdjust: xAdjust,
    },
    scaleID: "y",
    value,
  };
}

export default function MeanChart({
  UCL,
  UWL,
  MEAN,
  LWL,
  LCL,
  durationTime = 30e3,
  chartRef,
}: {
  UCL: number;
  UWL: number;
  MEAN: number;
  LWL: number;
  LCL: number;
  durationTime?: number;
  chartRef: RefObject<ChartJS<"line", number[], number>>;
}) {
  const chartMinMax: AnnotationOptions[] = [
    {
      type: "line",
      borderWidth: 0,
      scaleID: "y",
      value: UCL * 1.03,
    },
    {
      type: "line",
      borderWidth: 0,
      scaleID: "y",
      value: LCL - LCL * 0.03,
    },
  ];

  return (
    <div>
      <Line
        ref={chartRef}
        width="500"
        height="350"
        style={{
          width: "auto",
          height: "auto",
        }}
        options={{
          animation: false,
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
                chartLine({
                  value: UCL,
                  color: "gray",
                  label: UCL.toString(),
                  yAdjust: -10,
                }),
                chartLine({
                  value: UWL,
                  color: "#a3a5ac",
                  label: UWL.toString(),
                  yAdjust: -10,
                }),
                chartLine({
                  value: MEAN,
                  color: "rgba(163,165,172,0.64)",
                  yAdjust: -10,
                }),
                chartLine({
                  value: LWL,
                  color: "#a3a5ac",
                  label: LWL.toString(),
                  yAdjust: 10,
                }),
                chartLine({
                  value: LCL,
                  color: "gray",
                  label: LCL.toString(),
                  yAdjust: 10,
                }),
              ],
            },
            streaming: {
              // Duration of the chart in milliseconds (how much time of data it will show).
              duration: durationTime,
              refresh: 1000, // Refresh interval in milliseconds to `onRefresh` to be called
              frameRate: 25, // Frequency at which the chart is drawn on a display
              delay: 5, // number of drawn frames in one second
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
              label: "Mean",
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
    </div>
  );
}

export const MeanChartMemo = memo(MeanChart);
