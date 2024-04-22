import { Definition } from './types/boot-config';

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

  return [...maybePrefix, definition.name].join(' - ');
};

const toCollectionName = (definition: Definition) => {
  const maybePrefix = definition.prefix ? [definition.prefix] : [];

  return [...maybePrefix, definition.name as string].join(' - ');
};

const createFreeTextCriteria = <T>(value: T, key = 'keywords') => ({
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

export {
  lrsToCollectionString,
  toCollectionName,
  toFileName,
  createFreeTextCriteria,
  createKeywordCriteria,
};
