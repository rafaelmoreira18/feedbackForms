interface CustomYAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  width?: number;
}

export default function CustomYAxisTick({ x, y, payload, width = 220 }: CustomYAxisTickProps) {
  if (!payload?.value) return null;

  const words = payload.value.split(" ");
  const lines: string[] = [];
  let line = "";
  const charsPerLine = Math.floor(width / 7);

  words.forEach((word) => {
    if ((line + word).length > charsPerLine) {
      if (line) lines.push(line.trim());
      line = word + " ";
    } else {
      line += word + " ";
    }
  });
  if (line.trim()) lines.push(line.trim());

  const lineHeight = 14;
  const totalHeight = lines.length * lineHeight;

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((l, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={i * lineHeight - totalHeight / 2 + lineHeight / 2}
          textAnchor="end"
          fill="#9ca3af"
          fontSize={10}
        >
          {l}
        </text>
      ))}
    </g>
  );
}
