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

type Categorized = {
  name: string;
  category: string;
};

type BootConfig = {
  namespace: string;
  collections: {
    themes?: Categorized[];
    agnostic?: Categorized[];
    definitions?: Definition[];
  };
};

export { BootConfig, Definition, Categorized, KeywordSetConfig, FilterConfig };
