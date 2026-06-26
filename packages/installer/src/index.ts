export {
  PACKAGE_CATALOG,
  PRESET_FULL,
  PRESET_RECOMMENDED,
  peersForPackages,
  resolvePackageNames,
  type InstallPreset,
  type RankPackage,
} from "./catalog.js";
export { detectPackageManager, installCommand, type PackageManager } from "./detect-pm.js";
export {
  promptCustomSelection,
  promptPreset,
  runInstall,
  runInstallWizard,
  type InstallOptions,
  type InstallResult,
} from "./install.js";
