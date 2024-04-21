import fs from 'fs';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { mapValues, snake, zipToObject } from 'radash';
import * as yaml from 'yaml';
import { BootConfig, Definition } from './types/boot-config';

const createFreeTextCriteria = (value: string, key = 'keywords') => ({
  criteria: key,
  operation: '==',
  value: value,
  value2: '',
});

const createKeywordCriteria = (value: string) => ({
  criteria: 'keywords',
  operation: 'any',
  value: value,
  value2: '',
});

const renderDefinitions = (definitions: Definition[]) => {
  definitions.forEach((definition) => {
    const collection = authorCollection(definition);

    try {
      fs.mkdirSync(path.join(__dirname, `../output/${definition.prefix}`));
    } catch (e: unknown) {}

    fs.writeFileSync(
      path.join(
        __dirname,
        `../output/${definition.prefix}/${toFileName(definition)}.lrsmcol`
      ),
      collection,
      'utf-8'
    );
  });
};

const lrsToCollectionString = (obj: Object) => {
  const v: string[] = Object.entries(obj).map(
    ([key, value]) =>
      `${key} = ${typeof value === 'string' ? `"${value}"` : value}`
  );

  return `{
        ${v.join(',\n        ')}
      }`;
};

const toFileName = (definition: Definition) => {
  const maybePrefix = definition.prefix ? [definition.prefix] : [];

  return [...maybePrefix, snake(definition.name as string)].join(' - ');
};

const toCollectionName = (definition: Definition) => {
  const maybePrefix = definition.prefix ? [definition.prefix] : [];

  return [...maybePrefix, definition.name as string].join(' - ');
};

const authorCollection = (definition: Definition) => {
  const mappedConfig = mapValues(definition.config, (config) =>
    lrsToCollectionString(config)
  );

  return `
  s = {
    id = "${uuid()}",
    internalName = "${toCollectionName(definition)}",
    title = "${toCollectionName(definition)}",
    type = "LibrarySmartCollection",
    value = {
      combine = "${definition.combineType}",
      ${Object.values(mappedConfig)}
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

const renderThemes = (themes: BootConfig['collections']['themes']) => {
  const themeDefinitions = zipToObject(themes ?? [], (theme: string) => ({
    name: theme,
    prefix: 'theme',
    combineType: 'intersect',
    config: {
      [theme]: createKeywordCriteria(theme),
      nonRejected: {
        criteria: 'pick',
        operation: '!=',
        value: -1,
      },
    },
  }));

  const unmarkedThemes = zipToObject(themes ?? [], (theme: string) => ({
    name: `${theme} unmarked`,
    prefix: 'theme',
    combineType: 'intersect',
    config: {
      [theme]: createKeywordCriteria(theme),
      unPicked: {
        criteria: 'pick',
        operation: '==',
        value: 0,
      },
    },
  }));

  renderDefinitions([
    ...Object.values(themeDefinitions),
    ...Object.values(unmarkedThemes),
  ]);
};

renderThemes(parsedFileContent.collections.themes);
