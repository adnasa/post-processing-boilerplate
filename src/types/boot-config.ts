type Definition = {
  name: string;
  combineType: string;
  prefix: string;
  config: {
    [k: string]: {
      criteria: string;
      operation: string;
      value: string | number | boolean;
    };
  };
};

type BootConfig = {
  namespace: string;
  collections: {
    themes?: string[];
    definitions?: Definition[];
  };
};

export { BootConfig, Definition };
