export const openGoogleSearch = (placeName, cityName) => {
  const query = encodeURIComponent(`${placeName} ${cityName}`);
  window.open(`https://www.google.com/search?q=${query}`, '_blank');
};
