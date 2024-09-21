import { ActionSignal, SignalStateMap } from "../stream/state";
import { Flag } from "./Flag";
import { Signal } from "./Signal";

function Legend() {
  return (
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
  );
}

export default function ActionSignals({ signalState }: { signalState: SignalStateMap }) {
  return (
    <div>
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

      <Legend />
    </div>
  );
}
