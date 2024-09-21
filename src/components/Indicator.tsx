import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { renderToStaticMarkup } from "react-dom/server";

export default function Indicator({
  symbol,
  name,
  value,
  description,
}: {
  symbol: string;
  name: string;
  description?: string;
  value: string | number;
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
        <InfoOutlinedIcon
          style={{
            cursor: "help",
            color: "gray",
            fontSize: "1rem",
          }}
          data-tooltip-id="my-tooltip"
          data-tooltip-html={renderToStaticMarkup(
            <div>
              <div>{name}</div>
              {description ? (
                <small
                  style={{
                    fontStyle: "italic",
                  }}
                >
                  {description}
                </small>
              ) : null}
            </div>,
          )}
        />
        <span>{symbol}</span>
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
          {value}
        </pre>
      </div>
    </div>
  );
}
