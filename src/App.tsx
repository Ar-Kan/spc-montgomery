import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
import { useRef, useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { MeanChartMemo } from "./control-charts/mean";
import {
  controlLimits,
  DataSample,
  LCL,
  LWL,
  MEAN,
  sampleSize,
  STD,
  UCL,
  UWL,
} from "./stream/data";
import { ActionSignal, actionSignalsState, signalCheck, SignalStateType } from "./stream/state";
import { usePollingEffect } from "./utils";
import { nSample } from "./stream/stats";

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

function Flag({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        backgroundColor: color,
        borderRadius: "50%",
        border: "1px solid black",
      }}
    />
  );
}

function Signal({
  state,
  label,
  description,
  timestamp = 0,
}: {
  state: SignalStateType;
  label: string;
  description: string;
  timestamp?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "3rem",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 4,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        borderRadius: 4,
        marginBottom: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <Flag
          color={
            state === SignalStateType.ALERT
              ? "red"
              : state === SignalStateType.WARNING
                ? "orange"
                : "green"
          }
        />
        <InfoOutlinedIcon
          style={{
            cursor: "help",
            color: "gray",
            fontSize: "1rem",
          }}
          data-tooltip-id="my-tooltip"
          data-tooltip-content={description}
        />
        <span>{label}</span>
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          display: "flex",
          gap: 3,
          alignItems: "baseline",
        }}
      >
        <span style={{ color: "gray", paddingRight: "2px" }}>Begun at:</span>
        <pre
          style={{
            color: timestamp === 0 ? "gray" : "black",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {timestamp ? new Date(timestamp).toLocaleTimeString() : "N/A"}
        </pre>
      </div>
    </div>
  );
}

enum ProcessState {
  IN_CONTROL,
  UNCONTROLLED,
  DRIFTING,
  TRENDING,
}

let dataStream: DataSample[] = [];

export default function App() {
  const chartRef = useRef<ChartJS<"line", any[], number>>(null);
  const [signalState, setSignalState] = useState(actionSignalsState);
  const [processState, setProcessState] = useState<ProcessState>(ProcessState.IN_CONTROL);
  const [pollingInterval, setPollingInterval] = useState<number>(0.5e3);

  usePollingEffect(
    async () => {
      let sample;
      if (processState === ProcessState.TRENDING) {
        sample = nSample(
          sampleSize,
          dataStream.at(-1)?.mean ||
            MEAN + (Date.now() - (dataStream.at(-1)?.timestamp || 0)) * 1e-7,
          STD,
        );
      } else if (processState === ProcessState.UNCONTROLLED) {
        sample = nSample(sampleSize / 2, MEAN, STD * 3);
      } else if (processState === ProcessState.DRIFTING) {
        sample = nSample(sampleSize, MEAN * 1.03, STD);
      } else {
        sample = nSample(sampleSize, MEAN, STD);
      }
      const data = new DataSample(Date.now(), sample);
      dataStream = [...dataStream.slice(-100), data];
      setSignalState((prevState) =>
        signalCheck({
          stream: dataStream,
          lastState: prevState,
          controlLimits,
          pollingInterval,
        }),
      );
      updateChart(dataStream);
    },
    [processState],
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
          justifyContent: "start",
          padding: "16px",
        }}
      >
        <MeanChartMemo
          UCL={UCL}
          UWL={UWL}
          MEAN={MEAN}
          LWL={LWL}
          LCL={LCL}
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
