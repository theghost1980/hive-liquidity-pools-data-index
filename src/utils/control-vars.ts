const SERVERCOUNT = {
  daysCount: 0,
};

const addDay = () => (SERVERCOUNT.daysCount = SERVERCOUNT.daysCount + 1);

export const ControlVarsUtils = {
  SERVERCOUNT,
  addDay,
};
