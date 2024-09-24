import { Chart as ChartJS } from "chart.js";
import { AnnotationOptions } from "chartjs-plugin-annotation";
import { memo, RefObject } from "react";
import { Line } from "react-chartjs-2";
import { ControlLimits } from "../stream/data/functions";

function chartLine({
  value,
  color,
  lineColor,
  label,
  yAdjust = 0,
  xAdjust = 0,
  borderWidth = 1,
}: {
  value: number;
  color: string;
  lineColor?: string;
  label?: string;
  yAdjust?: number;
  xAdjust?: number;
  borderWidth?: number;
}): AnnotationOptions {
  return {
    type: "line",
    borderColor: lineColor || color,
    borderWidth,
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

export default function ControlChart({
  controlLimits,
  datasetName,
  durationTime = 30e3,
  chartRef,
  paddingPercentageTop = 0.03,
  paddingPercentageBottom = 0.03,
}: {
  controlLimits: ControlLimits | null;
  datasetName: string;
  durationTime?: number;
  chartRef: RefObject<ChartJS<"line", any[], number>>;
  paddingPercentageTop?: number;
  paddingPercentageBottom?: number;
}) {
  if (controlLimits === null) {
    return null;
  }

  const { UCL, LCL, UWL, LWL, CenterLine, U1sCL, L1sCL } = controlLimits;

  // Lines to add a padding to the chart
  const chartMinMax: AnnotationOptions[] = [
    {
      type: "line",
      borderWidth: 0,
      scaleID: "y",
      value: UCL + UCL * paddingPercentageTop,
    },
    {
      type: "line",
      borderWidth: 0,
      scaleID: "y",
      value: LCL - LCL * paddingPercentageBottom,
    },
  ];

  const color = "rgba(140,100,200,0.6)";
  const colorSecondary = "rgba(140,100,200,0.6)";

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
              display: false,
            },
            annotation: {
              annotations: [
                ...chartMinMax,
                chartLine({
                  value: UCL,
                  color,
                  label: UCL.toFixed(4).toString(),
                  yAdjust: -10,
                  borderWidth: 2,
                }),
                chartLine({
                  value: LCL,
                  color,
                  label: LCL.toFixed(4).toString(),
                  yAdjust: 10,
                  borderWidth: 2,
                }),
                chartLine({
                  value: UWL,
                  color,
                  label: UWL.toFixed(4).toString(),
                  yAdjust: -10,
                }),
                chartLine({
                  value: LWL,
                  color,
                  label: LWL.toFixed(4).toString(),
                  yAdjust: 10,
                }),
                chartLine({
                  value: U1sCL,
                  color: colorSecondary,
                }),
                chartLine({
                  value: L1sCL,
                  color: colorSecondary,
                }),
                chartLine({
                  value: CenterLine,
                  color: colorSecondary,
                  yAdjust: -10,
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
              label: datasetName,
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

export const ControlChartMemo = memo(ControlChart);
