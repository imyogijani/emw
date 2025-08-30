const logger = (msg) => {
  console.log(`[LOG] ${new Date().toISOString()} - ${msg}`);
};
export default logger;
