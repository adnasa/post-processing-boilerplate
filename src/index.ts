import fs from 'fs';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { group, mapValues, zipToObject, cluster, listify, title } from 'radash';
import * as yaml from 'yaml';
import { BootConfig, Definition, Theme } from './types/boot-config';
import {
  lrsToCollectionString,
  toCollectionName,
  toFileName,
  createFreeTextCriteria,
  createKeywordCriteria,
} from './utils';

const rawFileContent = fs.readFileSync(
  path.join(__dirname, '../boot.config.yml'),
  'utf-8'
);

const parsedFileContent: BootConfig = yaml.parse(rawFileContent);

const renderDefinitions = (definitions: Definition[]) => {
  definitions.forEach((definition) => {
    fs.writeFileSync(
      path.join(
        __dirname,
        `../output/Lightroom/${toFileName(definition)}.lrsmcol`
      ),
      authorCollection(definition),
      'utf-8'
    );
  });
};

const authorCollection = (definition: Definition) => {
  const mappedConfig =
    definition.type === 'LibrarySmartCollection'
      ? mapValues(definition.config, (config) => lrsToCollectionString(config))
      : {};

  const withCombine = definition.combineType
    ? `combine = "${definition.combineType}",`
    : '';

  return `
  s = {
    id = "${uuid()}",
    internalName = "${toCollectionName(definition)}",
    title = "${toCollectionName(definition)}",
    type = "${definition.type ?? 'LibrarySmartCollection'}",
    value = {
      ${withCombine}
      ${Object.values(mappedConfig)}
    },
    version = 0,
  }
  `;
};

const createThemes = (themes: BootConfig['collections']['themes']) => {
  const themeDefinitions = zipToObject(
    themes?.map((theme) => theme.name) ?? [],
    (themeName: string) => ({
      name: themeName,
      prefix: 'theme',
      combineType: 'intersect',
      config: {
        [themeName]: createKeywordCriteria(themeName),
        nonRejected: {
          criteria: 'pick',
          operation: '!=',
          value: -1,
        },
      },
    })
  );

  return Object.values(themeDefinitions);
};

const createDefinitions = (definitions?: Definition[]) => {
  const mappedDefinition = (definitions ?? []).map((definition) => {
    switch (definition.prefix) {
      case 'lens':
        return {
          name: definition.name,
          prefix: definition.prefix,
          combineType: definition.combineType,
          config: {
            [definition.name]: createFreeTextCriteria(
              definition.config.lens?.value as string,
              'lens'
            ),
            nonRejected: {
              criteria: 'pick',
              operation: '!=',
              value: -1,
            },
          },
        };
      default:
        return {
          name: definition.name,
          prefix: definition.prefix,
          combineType: definition.combineType,
          config: definition.config,
        };
    }
  });

  return mappedDefinition;
};

const testKeywordSets = (themes: Theme[]) => {
  const groupedByCategory = mapValues(
    group(themes, (theme) => theme.category),
    (value) => cluster(value?.map((value) => value.name) ?? [], 9)
  );

  const flattened = listify(groupedByCategory, (key, chunks) => ({
    chunks,
    category: key,
  }));

  console.log(require('util').inspect(flattened, { depth: null }));
};

const createOutputDefinitions = (definitions: Definition[]): Definition[] =>
  definitions.map((definition) => ({
    ...definition,
    name: definition.name,
    prefix: 'output',
    config: {
      ...definition.config,
      nonRejected: {
        criteria: 'pick',
        operation: '!=',
        value: -1,
      },
      isEdited: {
        criteria: 'edit',
        operation: 'isTrue',
        value: true,
      },
    },
  }));

const [themesDefinitions, remainingDefinitions] = [
  createThemes(parsedFileContent.collections.themes),
  createDefinitions(parsedFileContent.collections.definitions),
];

const outputDefinitions = createOutputDefinitions([
  ...themesDefinitions,
  ...remainingDefinitions,
]);

renderDefinitions([
  ...themesDefinitions,
  ...remainingDefinitions,
  ...outputDefinitions,
]);

testKeywordSets(parsedFileContent.collections.themes ?? []);
