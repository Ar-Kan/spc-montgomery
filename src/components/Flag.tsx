export function Flag({ color }: { color: string }) {
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
