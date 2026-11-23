import { Box, Cyl } from './primitives';
import { Sign } from './Signs';

/** Uang dibedakan dari amplop proposal agar arah pembayaran mudah dikenali. */
export function RevenuePacket() {
  return <group>
    {[-0.12, 0, 0.12].map((y) => <Box key={y} color="#217452" position={[0, y, 0]} scale={[2.8, 1.45, 0.16]} />)}
    <Box color="#d5f1ca" position={[0, 0.12, 0.09]} scale={[2.48, 1.14, 0.02]} />
    <Sign text="Rp" width={1.2} color="#217452" position={[0, 0.12, 0.11]} />
    <Cyl color="#e5b438" position={[1.4, -0.5, 0.25]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.18, 1]} />
    <Cyl color="#f6d678" position={[1.4, -0.5, 0.36]} rotation={[Math.PI / 2, 0, 0]} scale={[0.76, 0.02, 0.76]} />
  </group>;
}
