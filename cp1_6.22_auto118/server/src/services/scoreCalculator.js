function calculateProgress(submissions) {
  let progress = 0;
  for (const sub of submissions) {
    progress += sub.rating * 10;
  }
  return Math.min(progress, 100);
}

module.exports = { calculateProgress };
