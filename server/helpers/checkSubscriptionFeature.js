export const getFeatureLimit = (featuresArray, key) => {
  if (!Array.isArray(featuresArray)) return null;

  const match = featuresArray.find((f) => f.startsWith(`${key}:`));
  if (match) {
    const value = parseInt(match.split(":")[1], 10);
    return isNaN(value) ? null : value;
  }

  return null;
};
