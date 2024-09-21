import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { SignalStateType } from "../stream/state";
import { Flag } from "./Flag";

export function Signal({
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
