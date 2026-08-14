const noop = () => {};

export const HMRClient = {
  enable: noop,
  disable: noop,
  registerBundle: noop,
  log: noop,
  setup: noop,
};

export default HMRClient;
