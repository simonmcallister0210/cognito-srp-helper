import { faker } from "@faker-js/faker";

export const positiveTimestamps: Record<string, string> = {
  random: faker.date.between("0000-01-01T00:00:00.000Z", "9999-12-31T23:59:59.999Z").toString(),
  wideHours: "2000-01-02T03:04:05.000Z",
  zeroMidnight: "2000-01-02T00:00:00.000Z",
  twentyFourMidnight: "2000-01-02T24:00:00.000Z",
  minYear: "0000-01-01T00:00:00.000Z",
  maxYear: "9999-01-01T00:00:00.000Z",
};
