import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { computePcr } from "../stream/data/utils";

function formatedPcr(std: number | null, d2: number): string {
  if (std === null) {
    return "N/A";
  }
  const pcr = computePcr({ LSL: 0, USL: 1, std, d2 });
  return `${(100 / pcr).toFixed(2)}%`;
}

export default function PCR({ std, d2 }: { std: number | null; d2: number }) {
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
        marginTop: "1rem",
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
        <InfoOutlinedIcon
          style={{
            cursor: "help",
            color: "gray",
            fontSize: "1rem",
          }}
          data-tooltip-id="my-tooltip"
          data-tooltip-content="Process Capability Ratio"
        />
        <span>PCR</span>
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          display: "flex",
          gap: 3,
          alignItems: "baseline",
          color: "gray",
        }}
      >
        <pre
          style={{
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {formatedPcr(std, d2)}
        </pre>
      </div>
    </div>
  );
}
