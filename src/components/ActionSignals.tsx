import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { signalDescriptions, SignalStateMap, SignalStateType } from "../stream/state/models";
import { Flag } from "./Flag";

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

export default function ActionSignals({ signalState }: { signalState: SignalStateMap }) {
  return (
    <div>
      <h3>Action Signals</h3>

      {signalDescriptions.map((description) => (
        <Signal
          key={description.action}
          {...signalState[description.action]}
          label={description.action}
          description={description.description}
        />
      ))}

      <Legend />
    </div>
  );
}
