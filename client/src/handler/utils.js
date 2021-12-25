export const getYMinMax = arr => {
  if (Array.isArray(arr)) {
    arr = arr.sort((a, b) => a - b);
    
    const min = Math.round(arr[0] / 10) * 10;
    const max = Math.round(arr[arr.length - 1] / 10) * 10;
   
    return [-min - 10, max ? max : 10];
  }
  return [-10, 10];
};
