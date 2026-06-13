// Logger utility — gives structured console output so you know exactly which section and step failed
//Instead of consoling at each point differently import this and use it at necessary pont accordingly
const log = {
  // General info — use for normal flow updates
  info: (section, msg, data = '') =>
    console.log(`[INFO] [${section}] ${msg}`, data),

  // Success — use when something completes successfully
  success: (section, msg, data = '') =>
    console.log(`[OK] [${section}] ${msg}`, data),

  // Warning — use for non-breaking issues
  warn: (section, msg, data = '') =>
    console.warn(`[WARN] [${section}] ${msg}`, data),

  // Error — use in catch blocks, prints error message clearly
  error: (section, msg, err = '') =>
    console.error(`[ERROR] [${section}] ${msg}`, err?.message || err),

  // Step — use inside AI branches to track which step of the pipeline is running
  step: (section, step, msg) =>
    console.log(`[STEP ${step}] [${section}] ${msg}`),
};

export default log;