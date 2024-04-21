import { stripIndents } from 'common-tags';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { iterate, snake, zipToObject } from 'radash';
import * as yaml from 'yaml';

const objToCollectionString = (obj: Object) => {
  const v = Object.entries(obj).map(([key, value]) => `${key} = "${value}"`);

  return `{
        ${v.join(',\n        ')}
      }`;
};

const toFileName = (definition: Record<string, unknown>) => {
  const withPrefix = definition.prefix ? [definition.prefix] : [];

  return [...withPrefix, snake(definition.name as string)].join(' - ');
};

const authorCollection = (definition: any) => {
  const config = (Object.values(definition.config) ?? []).map(
    (element: any) => {
      const x = objToCollectionString(element);

      return x;
    }
  );

  return `
  s = {
    id = "${uuid()}",
    internalName = "${definition.prefix} - ${definition.name} 2",
    title = "${definition.prefix} - ${definition.name} 2",
    type = "LibrarySmartCollection",
    value = {
      combine = "${definition.combineType}",
      ${config}
    },
    version = 0,
  }
  `;
};

const rawFileContent = fs.readFileSync(
  path.join(__dirname, '../boot.config.yml'),
  'utf-8'
);

const parsedFileContent: BootConfig = yaml.parse(rawFileContent);

const themeDefinitions = zipToObject(
  parsedFileContent.collections.themes ?? [],
  (theme: string) => ({
    name: theme,
    prefix: 'theme',
    combineType: 'intersect',
    config: {
      [theme]: {
        criteria: 'keywords',
        operation: 'any',
        value: theme,
        value2: '',
      },
    },
  })
);

Object.values(themeDefinitions).forEach((definition) => {
  const collection = authorCollection(definition);

  fs.writeFileSync(
    path.join(__dirname, `../output/${toFileName(definition)}.lrsmcol`),
    collection,
    'utf-8'
  );
});
