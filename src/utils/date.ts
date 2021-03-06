/**
 * Adds days to the given date
 * @param currentDate the current date
 * @param days the number of days to add, defaults to 1
 * @returns the new date
 */
function addDays(currentDate: Date, days = 1): Date {
  const newDate: Date = new Date(currentDate);
  newDate.setDate(currentDate.getDate() + days);
  return newDate;
}

/**
 * Removes days from the given date
 * @param currentDate the current date
 * @param days the number of days to remove, defaults to 1
 * @returns the new date
 */
function removeDays(currentDate: Date, days = 1): Date {
  const newDate: Date = new Date(currentDate);
  newDate.setDate(currentDate.getDate() - days);
  return newDate;
}

export { addDays, removeDays };
