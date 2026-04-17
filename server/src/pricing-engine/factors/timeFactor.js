function getTimeFactor() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  let factor = 1.00;
  if ((hour >= 10 && hour <= 13) || (hour >= 19 && hour <= 22)) factor = 1.05;
  else if (hour >= 0 && hour <= 6) factor = 0.92;
  if (isWeekend) factor *= 1.03;
  return Math.round(factor * 100) / 100;
}
module.exports = { getTimeFactor };
