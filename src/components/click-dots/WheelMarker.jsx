import { Html } from "@react-three/drei";


export default function WheelMarker({ pos, onClick }) {
  return (
    <Html distanceFactor={8} position={pos}>
      <svg
        onClick={() => onClick(pos)}
        style={{ cursor: "pointer", width: 30, height: 30 }}
      >
        <circle
          cx="5"
          cy="5"
          r="1"
          stroke="white"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </Html>
  );
}
