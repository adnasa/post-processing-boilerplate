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

const toCollectionName = (definition: Definition) => {
  const maybePrefix = definition.prefix ? [definition.prefix] : [];

  return [...maybePrefix, definition.name].join(' - ');
};

const toFileName = (definition: Definition) => toCollectionName(definition);

type CriteriaParams = {
  criteria?: string;
  operation?: string;
  value: any;
};

const createAnyKeywordCriteria = (params: CriteriaParams) => ({
  criteria: params.criteria ?? 'keywords',
  operation: params.operation ?? 'any',
  value: params.value,
  value2: '',
});

const createStrictFreeTextCriteria = <T>(value: T, key = 'keywords') =>
  createAnyKeywordCriteria({
    criteria: key,
    operation: '==',
    value,
  });

export {
  lrsToCollectionString,
  toCollectionName,
  toFileName,
  createStrictFreeTextCriteria,
  createAnyKeywordCriteria,
};
