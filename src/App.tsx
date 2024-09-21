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
import Annotation from "chartjs-plugin-annotation";
import { RefObject, useMemo, useRef, useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import ActionSignals from "./components/ActionSignals";
import Indicator from "./components/Indicator";
import ProcessStateActions, { ProcessState } from "./components/ProcessStateActions";
import { ControlChartMemo } from "./control-charts/control-chart";
import {
  DataSample,
  factors_n5,
  sampleParameters,
  streamParameters,
  StreamParameters,
} from "./stream/data";
import {
  ChartControlLimits,
  computeArl,
  computeChartControlLimits,
  estimateParameters,
} from "./stream/data/functions";
import { actionSignalsState, signalCheck } from "./stream/state";
import { nSample } from "./stream/stats";
import { formatedPcr } from "./stream/utils";
import { usePollingEffect } from "./utils";

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

let dataStream: DataSample[] = [];

export default function App() {
  const chartXBarRef = useRef<ChartJS<"line", any[], number>>(null);
  const chartRRef = useRef<ChartJS<"line", any[], number>>(null);

  const [controlLimits, setControlLimits] = useState<ChartControlLimits | null>(null);
  const [signalState, setSignalState] = useState(actionSignalsState);
  const [processState, setProcessState] = useState<ProcessState>(ProcessState.IN_CONTROL);
  const [pollingInterval, setPollingInterval] = useState<number>(0.5e3);

  const estimatedParameters: StreamParameters = useMemo(() => {
    if (dataStream.length === 0) {
      // Generate preliminary samples
      for (let i = sampleParameters.preliminarySampleSize; i > 0; i--) {
        const sample = nSample(
          sampleParameters.sampleSize,
          streamParameters.mean,
          streamParameters.std,
        );
        const timestamp = Date.now() - i * pollingInterval;
        dataStream.push(new DataSample(timestamp, sample));
      }
    }

    return estimateParameters(dataStream);
  }, []);

  usePollingEffect(
    async () => {
      if (controlLimits === null) {
        // Compute trial control limits
        setControlLimits(
          computeChartControlLimits({
            ...estimatedParameters,
            factors: factors_n5,
          }),
        );
        return;
      }

      let sample;
      if (processState === ProcessState.TRENDING) {
        sample = nSample(
          sampleParameters.sampleSize,
          dataStream.at(-1)?.mean ||
            streamParameters.mean + (Date.now() - (dataStream.at(-1)?.timestamp || 0)) * 1e-7,
          streamParameters.std,
        );
      } else if (processState === ProcessState.UNCONTROLLED) {
        sample = nSample(
          sampleParameters.sampleSize / 2,
          streamParameters.mean,
          streamParameters.std * 3,
        );
      } else if (processState === ProcessState.DRIFTING) {
        sample = nSample(
          sampleParameters.sampleSize,
          streamParameters.mean * 1.03,
          streamParameters.std,
        );
      } else {
        sample = nSample(sampleParameters.sampleSize, streamParameters.mean, streamParameters.std);
      }

      const data = new DataSample(Date.now(), sample);
      dataStream = [...dataStream.slice(-100), data];

      setSignalState((prevState) =>
        signalCheck({
          stream: dataStream,
          lastState: prevState,
          controlLimits: controlLimits.xBar,
          pollingInterval,
        }),
      );

      updateChart(
        chartXBarRef,
        dataStream.map((d) => ({
          x: d.timestamp,
          y: d.mean,
        })),
      );
      updateChart(
        chartRRef,
        dataStream.map((d) => ({
          x: d.timestamp,
          y: d.range,
        })),
      );
    },
    [estimatedParameters, controlLimits, processState],
    { interval: pollingInterval },
  );

  function updateChart(
    ref: RefObject<ChartJS<"line", any[], number>>,
    sample: { x: number; y: number }[],
  ) {
    const chart = ref.current;
    if (!chart) return;
    chart.data.datasets[0].data = sample;
    chart.update("quiet");
  }

  return (
    <div>
      <ReactTooltip
        id="my-tooltip"
        opacity={1}
        style={{
          padding: "8px",
          maxWidth: "300px",
          backgroundColor: "rgba(0, 0, 0, 0.9)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          alignItems: "top",
          justifyContent: "space-around",
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <ControlChartMemo
            datasetName="X-Bar"
            controlLimits={controlLimits?.xBar || null}
            durationTime={pollingInterval * 50}
            chartRef={chartXBarRef}
          />

          <ControlChartMemo
            datasetName="R"
            controlLimits={controlLimits?.R || null}
            durationTime={pollingInterval * 50}
            chartRef={chartRRef}
          />
        </div>

        <div>
          <button
            onClick={() =>
              console.log({ dataStream, signalState, controlLimits, estimatedParameters })
            }
          >
            log
          </button>

          <ProcessStateActions processState={processState} setProcessState={setProcessState} />

          <div
            style={{
              paddingTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Indicator
              label="PCR"
              name="Process Capability Ratio"
              description="Fraction of items produced that will meet the specifications."
              value={
                controlLimits !== null ? formatedPcr(estimatedParameters.std, factors_n5.d2) : "N/A"
              }
            />
            <Indicator
              label="ARL"
              name="Average Run Length"
              description="Expected number of samples taken to detect a shift of one-sigma with n=5."
              value={computeArl(0.75)}
            />
            <Indicator
              label="ATS"
              name="Average Time to Signal"
              description="Expected time to detect a shift of one-sigma with n=5."
              value={`${(computeArl(0.75) * pollingInterval) / 1e3}s`}
            />
          </div>

          <ActionSignals signalState={signalState} />
        </div>
      </div>
    </div>
  );
}
