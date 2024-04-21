type Definition = {
  name: string;
  combineType: string;
  prefix: string;
  config: {
    [k: string]: {
      criteria: string;
      operation: string;
      value: string | number;
      value2?: string;
    };
  };
};

type BootConfig = {
  namespace: string;
  collections: {
    themes?: string[];
  };
};

export { BootConfig, Definition };
