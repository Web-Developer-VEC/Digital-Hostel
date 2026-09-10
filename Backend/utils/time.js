const moment = require("moment-timezone");

const IST_TIME_ZONE = "Asia/Kolkata";

function parseDateTime(dateValue) {
  if (dateValue instanceof Date) {
    return new Date(dateValue.getTime());
  }

  if (
    typeof dateValue === "string" &&
    !/(Z|[+-]\d{2}:?\d{2})$/i.test(dateValue)
  ) {
    return moment.tz(dateValue, IST_TIME_ZONE).toDate();
  }

  return new Date(dateValue);
}

function getIstDayRange(dateValue) {
  const day = dateValue
    ? moment.tz(dateValue, "YYYY-MM-DD", IST_TIME_ZONE)
    : moment.tz(IST_TIME_ZONE);

  return {
    startOfDay: day.clone().startOf("day").toDate(),
    endOfDay: day.clone().endOf("day").toDate(),
  };
}

function getIstHour(dateValue) {
  return moment(dateValue).tz(IST_TIME_ZONE).hour();
}

function getIstMinute(dateValue) {
  return moment(dateValue).tz(IST_TIME_ZONE).minute();
}

function getIstDateKey(dateValue) {
  return moment(dateValue).tz(IST_TIME_ZONE).format("YYYY-MM-DD");
}

module.exports = {
  IST_TIME_ZONE,
  parseDateTime,
  getIstDayRange,
  getIstHour,
  getIstMinute,
  getIstDateKey,
};
