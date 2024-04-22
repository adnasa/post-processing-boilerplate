type FilterConfig = {
  [k: string]: {
    criteria: string;
    operation: string;
    value: string | number | boolean;
  };
};

type KeywordSetConfig = string[];

type Definition = {
  name: string;
  combineType?: string;
  type?: 'LibrarySmartCollection' | 'KeywordSet';
  prefix?: string;
  config: FilterConfig | KeywordSetConfig;
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

export { BootConfig, Definition, Theme, KeywordSetConfig, FilterConfig };
