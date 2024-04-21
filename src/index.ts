import fs from 'fs';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { mapValues, zipToObject } from 'radash';
import * as yaml from 'yaml';
import { BootConfig, Definition } from './types/boot-config';
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
      path.join(__dirname, `../output/${toFileName(definition)}.lrsmcol`),
      authorCollection(definition),
      'utf-8'
    );
  });
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

const createThemes = (themes: BootConfig['collections']['themes']) => {
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
