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
import { useMemo, useRef, useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { MeanChartMemo } from "./control-charts/mean";
import { DataSample, sampleParameters, streamParameters, StreamParameters } from "./stream/data";
import { ActionSignal, actionSignalsState, signalCheck } from "./stream/sate";
import { nSample } from "./stream/stats";
import { usePollingEffect } from "./utils";
import { Flag } from "./components/Flag";
import { Signal } from "./components/Signal";
import { computeControlLimits, ControlLimits, estimateParameters } from "./stream/data/utils";

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

enum ProcessState {
  IN_CONTROL,
  UNCONTROLLED,
  DRIFTING,
  TRENDING,
}

let dataStream: DataSample[] = [];

export default function App() {
  const chartRef = useRef<ChartJS<"line", any[], number>>(null);
  const [controlLimits, setControlLimits] = useState<ControlLimits | null>(null);
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
        setControlLimits(
          computeControlLimits({ ...estimatedParameters, sampleSize: sampleParameters.sampleSize }),
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
          controlLimits: controlLimits,
          pollingInterval,
        }),
      );
      updateChart(dataStream);
    },
    [estimatedParameters, controlLimits, processState],
    { interval: pollingInterval },
  );

  function updateChart(sample: DataSample[]) {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.datasets[0].data = sample.map((d) => ({
      x: d.timestamp,
      y: d.mean,
    }));
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
        <MeanChartMemo
          controlLimits={controlLimits}
          durationTime={pollingInterval * 50}
          chartRef={chartRef}
        />

        <div>
          <button onClick={() => setSignalState(actionSignalsState)}>Reset Signals</button>
          <button onClick={() => console.log({ dataStream, signalState })}>log</button>
          <fieldset>
            <legend>Process State</legend>
            <div>
              <label>
                <input
                  type="radio"
                  checked={processState === ProcessState.IN_CONTROL}
                  onChange={() => setProcessState(ProcessState.IN_CONTROL)}
                />
                In Control
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  checked={processState === ProcessState.UNCONTROLLED}
                  onChange={() => setProcessState(ProcessState.UNCONTROLLED)}
                />
                Uncontrolled
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  checked={processState === ProcessState.DRIFTING}
                  onChange={() => setProcessState(ProcessState.DRIFTING)}
                />
                Drift
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  checked={processState === ProcessState.TRENDING}
                  onChange={() => setProcessState(ProcessState.TRENDING)}
                />
                Trend
              </label>
            </div>
          </fieldset>
          <h3>Action Signals</h3>

          <Signal
            {...signalState[ActionSignal.POC]}
            label="POC"
            description="One or more points outside the control limits."
          />

          <Signal
            {...signalState[ActionSignal.TWO_THREE_2s]}
            label="2/3-2s"
            description="Two of three consecutive points outside the two-sigma warning limits but still inside the control limits."
          />

          <Signal
            {...signalState[ActionSignal.FOUR_FIVE_1s]}
            label="4/5-1s"
            description="Four of five consecutive points beyond the one-sigma limits."
          />

          <Signal
            {...signalState[ActionSignal.EIGHT_OS]}
            label="8OS"
            description="A run of eight consecutive points on one side of the center line."
          />

          <Signal
            {...signalState[ActionSignal.SIX_TREND]}
            label="6Trend"
            description="Six points in a row steadily increasing or decreasing."
          />

          <Signal
            {...signalState[ActionSignal.FIFTEEN_C]}
            label="15C"
            description="Fifteen points in a row in zone C (zero to one-sigma) - both above and below the center line."
          />

          <Signal
            {...signalState[ActionSignal.FOURTEEN_ALT]}
            label="14Alt"
            description="Fourteen points in a row alternating up and down."
          />

          <Signal
            {...signalState[ActionSignal.EIGHT_BS]}
            label="8BS"
            description="Eight points in a row on both sides of the center line with none in zone C (zero to one-sigma)."
          />

          <Signal
            {...signalState[ActionSignal.NR]}
            label="NR"
            description="An unusual or nonrandom pattern in the data."
          />

          <Signal
            {...signalState[ActionSignal.PNL]}
            label="PNL"
            description="One or more points near a warning or control limit."
          />

          <div
            style={{
              transform: "scale(0.8)",
              fontSize: "0.8rem",
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              Legend
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                padding: "1rem",
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                borderRadius: "0.5rem",
              }}
            >
              <Flag color="red" />
              <span>Alert</span>
              <Flag color="orange" />
              <span>Warning</span>
              <Flag color="green" />
              <span>OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
