
// Fix: Replaced invalid imports Reading and Transformer with TransformerReading
import { TransformerReading } from "../types";

export const generateHistory = (trafo: TransformerReading, period: '1D' | '1W' | '1M'): TransformerReading[] => {
  const readings: TransformerReading[] = [];
  const now = new Date();
  let points = 12;
  let intervalHrs = 2;

  if (period === '1W') { points = 14; intervalHrs = 12; }
  if (period === '1M') { points = 15; intervalHrs = 48; }

  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalHrs * 60 * 60 * 1000);
    const trend = (points - i) / points; // Tendência de leve aumento
    
    const h2 = parseFloat((trafo.h2 * (0.9 + Math.random() * 0.2 * trend)).toFixed(1));
    const ch4 = parseFloat((trafo.ch4 * (0.95 + Math.random() * 0.1 * trend)).toFixed(1));
    const c2h2 = parseFloat((trafo.c2h2 * (0.98 + Math.random() * 0.05 * trend)).toFixed(2));
    const c2h4 = parseFloat((trafo.c2h4 * (0.9 + Math.random() * 0.2 * trend)).toFixed(1));
    const c2h6 = parseFloat((trafo.c2h6 * (0.9 + Math.random() * 0.2 * trend)).toFixed(1));
    const co = parseFloat((trafo.co * (0.95 + Math.random() * 0.1)).toFixed(1));
    const co2 = parseFloat((trafo.co2 * (0.98 + Math.random() * 0.04)).toFixed(1));

    // Fix: Mapped properties to match TransformerReading interface, ensuring required fields like id, sn, tag, and local are present
    readings.push({
      id: `${trafo.sn}-${i}`,
      sn: trafo.sn,
      tag: trafo.tag,
      local: trafo.local,
      data: time.toISOString(),
      h2, ch4, c2h2, c2h4, c2h6, co, co2,
      temperaturaOleo: trafo.temperaturaOleo
    });
  }
  return readings;
};
