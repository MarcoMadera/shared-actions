import type { Config } from "@jest/types";
const jestConfig: Config.InitialOptions = {
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  clearMocks: true,
  resetMocks: true,
  testTimeout: 50000,
};
export default jestConfig;
