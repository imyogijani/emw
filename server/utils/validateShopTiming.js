// Validate if times are valid and intervals don't overlap
export const validateTimeIntervals = (intervals) => {
  // Sort by openTime
  intervals.sort((a, b) => a.openTime.localeCompare(b.openTime));

  for (let i = 0; i < intervals.length; i++) {
    const { openTime, closeTime } = intervals[i];

    if (!openTime || !closeTime)
      return `Both openTime and closeTime are required`;
    if (openTime >= closeTime)
      return `openTime (${openTime}) must be before closeTime (${closeTime})`;

    if (i > 0 && intervals[i - 1].closeTime > openTime) {
      return `Intervals overlap or are not sorted properly`;
    }
  }
  return null;
};

export const validateShopTimings = (shopTimings) => {
  const days = Object.keys(shopTimings);
  for (const day of days) {
    const intervals = shopTimings[day];
    if (!Array.isArray(intervals))
      return `${day} should be an array of time intervals`;

    const err = validateTimeIntervals(intervals);
    if (err) return `Error on ${day}: ${err}`;
  }
  return null;
};
