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

type Theme = {
  name: string;
  category: string;
};

type BootConfig = {
  namespace: string;
  collections: {
    themes?: Theme[];
    definitions?: Definition[];
  };
};

export { BootConfig, Definition, Theme };
