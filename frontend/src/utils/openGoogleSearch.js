export const openGoogleSearch = (placeName, cityName) => {
  const query = encodeURIComponent(`${placeName} ${cityName}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
};
