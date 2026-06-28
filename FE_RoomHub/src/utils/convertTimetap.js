function convertTimetap(isoString, time = false) {
  const date = new Date(isoString);
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const year = date.getFullYear();

  if (time) {
    const hours = `0${date.getHours()}`.slice(-2);
    const minutes = `0${date.getMinutes()}`.slice(-2);
    return `${hours}:${minutes} ${day}-${month}-${year}`;
  }

  return `${day}-${month}-${year}`;
}

export default convertTimetap;
