import fs from 'fs';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { commaLists } from 'common-tags';
import { group, mapValues, zipToObject, cluster, listify } from 'radash';
import * as yaml from 'yaml';
import {
  BootConfig,
  Definition,
  FilterConfig,
  KeywordSetConfig,
  Theme,
} from './types/boot-config';
import {
  lrsToCollectionString,
  toCollectionName,
  toFileName,
  createFreeTextCriteria,
  createAnyKeywordCriteria,
} from './utils';
import {
  renderMetadataXmp,
  renderBridgeKeywords,
} from './template-helpers/metadata-file';

const rawFileContent = fs.readFileSync(
  path.join(__dirname, '../boot.config.yml'),
  'utf-8'
);

const parsedFileContent: BootConfig = yaml.parse(rawFileContent);

const renderDefinitionsAsCollections = (definitions: Definition[]) => {
  definitions.forEach((definition) => {
    fs.writeFileSync(
      path.join(
        __dirname,
        `../output/Lightroom/Collections/${toFileName(definition)}.lrsmcol`
      ),
      authorCollection(definition),
      'utf-8'
    );
  });
};

const authorCollection = (definition: Definition) => {
  const mappedConfig =
    definition.type === 'KeywordSet'
      ? {
          values: ((definition.config as KeywordSetConfig) ?? []).map(
            (value, iteration) => `shortcut${iteration + 1}title="${value}"\n`
          ),
        }
      : mapValues(definition.config as FilterConfig, (config) =>
          lrsToCollectionString(config)
        );

  const withCombine = definition.combineType
    ? `combine = "${definition.combineType}",`
    : '';

  return commaLists`
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
        [themeName]: createAnyKeywordCriteria(themeName),
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
              (definition.config as FilterConfig).lens?.value as string,
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

const addKeywordSets = (themes: Theme[]) => {
  const groupedByCategory = mapValues(
    group(themes, (theme) => theme.category),
    (value) => cluster(value?.map((value) => value.name) ?? [], 9)
  );

  const flattened = listify(groupedByCategory, (key, chunks) => {
    const items = chunks.reduce(
      (collected, pieceOfChunks, iteration) => ({
        ...collected,
        [key + ' ' + (iteration + 1)]: pieceOfChunks,
      }),
      {}
    );

    return items;
  });

  flattened.forEach((flatItem) => {
    Object.entries(flatItem).forEach(([name, values]) => {
      const keywordDefinition: Definition = {
        name,
        type: 'KeywordSet',
        config: values as KeywordSetConfig,
      };

      fs.writeFileSync(
        path.join(
          __dirname,
          `../output/Lightroom/Keyword Sets/${name}.lrtemplate`
        ),
        authorCollection(keywordDefinition),
        'utf-8'
      );
    });
  });
};

const createOutputDefinitions = (definitions: Definition[]) =>
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

const addMetadataTemplates = (themes: Theme[]) => {
  themes.forEach((theme) => {
    const metadataOutput = renderMetadataXmp(theme.name);
    fs.writeFileSync(
      path.join(
        __dirname,
        `../output/Metadata Templates/Keyword - ${theme.name}.xmp`
      ),
      metadataOutput,
      'utf-8'
    );
  });
};

const addBridgeKeywords = (themes: Theme[]) => {
  const textOnly = themes.map((theme) => theme.name);
  const rendered = renderBridgeKeywords(textOnly);

  fs.writeFileSync(
    path.join(__dirname, `../output/Adobe Bridge Keywords.xml`),
    rendered,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(__dirname, `../output/Adobe Bridge Keywords.txt`),
    textOnly.join('\n'),
    'utf-8'
  );
};

const [themesDefinitions, remainingDefinitions] = [
  createThemes(parsedFileContent.collections.themes),
  createDefinitions(parsedFileContent.collections.definitions),
];

const outputDefinitions = createOutputDefinitions([
  ...themesDefinitions,
  ...remainingDefinitions.filter(
    (definition) =>
      // phase and camera should not include output criteria
      definition.prefix !== 'phase' && definition.prefix !== 'camera'
  ),
]);

renderDefinitionsAsCollections([
  ...themesDefinitions,
  ...remainingDefinitions,
  ...outputDefinitions,
]);

addKeywordSets(parsedFileContent.collections.themes ?? []);
addMetadataTemplates(parsedFileContent.collections.themes ?? []);
addBridgeKeywords(parsedFileContent.collections.themes ?? []);
