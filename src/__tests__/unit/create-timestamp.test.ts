import { faker } from "@faker-js/faker";

import CognitoSrpHelper from "../../cognito-srp-helper.js";

describe("createTimestamp", () => {
  const cognitoSrpHelper = new CognitoSrpHelper();

  describe("positive", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it.each(
      faker.date.betweens(
        "0000-01-01T00:00:00.000Z",
        "9999-12-31T23:59:59.999Z",
        10
      )
    )(
      "should produce timestamp values that match the required format: %p",
      (date) => {
        // random date
        jest.useFakeTimers().setSystemTime(new Date(date));

        const timestamp = cognitoSrpHelper.createTimestamp();
        expect(timestamp).toMatch(
          /(Sun|Mon|Tue|Wed|Thu|Fri|Sat){1} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec){1} [1-3]?[0-9] (2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9]) UTC [0-9]{1,4}/
        );
      }
    );

    it("should produce a correctly formatted timestamp given 'wide hours'", () => {
      // wide hours 03:04:05
      jest.useFakeTimers().setSystemTime(new Date("2000-01-02T03:04:05.000Z"));

      const timestamp = cognitoSrpHelper.createTimestamp();
      expect(timestamp).toEqual("Sun Jan 2 03:04:05 UTC 2000");
    });

    it("should produce a correctly formatted timestamp given 00 hr for midnight", () => {
      // 00 midnight hour 00:00:00
      jest.useFakeTimers().setSystemTime(new Date("2000-01-02T00:00:00.000Z"));

      const timestamp = cognitoSrpHelper.createTimestamp();
      expect(timestamp).toEqual("Sun Jan 2 00:00:00 UTC 2000");
    });

    it("should produce a correctly formatted timestamp given 24 hr for midnight", () => {
      // 24 midnight hour 24:00:00
      jest.useFakeTimers().setSystemTime(new Date("2000-01-02T24:00:00.000Z"));

      const timestamp = cognitoSrpHelper.createTimestamp();
      expect(timestamp).toEqual("Mon Jan 3 00:00:00 UTC 2000");
    });

    it("should produce a correctly formatted timestamp given 0 yr", () => {
      // 0 year 0000
      jest.useFakeTimers().setSystemTime(new Date("0000-01-01T00:00:00.000Z"));

      const timestamp = cognitoSrpHelper.createTimestamp();
      expect(timestamp).toEqual("Sat Jan 1 00:00:00 UTC 0");
    });
  });
});
