import { faker } from '@faker-js/faker/locale/zh_CN';
import type {
  FieldRule,
  DataRow,
  StringConstraints,
  NumberConstraints,
  DateConstraints,
  AddressConstraints,
} from '../types';

faker.seed(Date.now());

const generateStringValue = (constraints: StringConstraints): string => {
  let value = faker.lorem.word();
  if (constraints.maxLength && value.length > constraints.maxLength) {
    value = value.slice(0, constraints.maxLength);
  }
  if (constraints.pattern) {
    try {
      const regex = new RegExp(constraints.pattern);
      if (!regex.test(value)) {
        value = faker.lorem.word();
      }
    } catch {
      // invalid pattern, ignore
    }
  }
  return value;
};

const generateNumberValue = (constraints: NumberConstraints): number => {
  const min = constraints.min ?? 0;
  const max = constraints.max ?? 100;
  return faker.number.int({ min, max });
};

const generateEmailValue = (): string => {
  return faker.internet.email();
};

const generateDateValue = (constraints: DateConstraints): string => {
  const options: { from?: Date; to?: Date } = {};
  if (constraints.startDate) {
    options.from = new Date(constraints.startDate);
  }
  if (constraints.endDate) {
    options.to = new Date(constraints.endDate);
  }
  const date = faker.date.between({
    from: options.from ?? new Date('2020-01-01'),
    to: options.to ?? new Date('2030-12-31'),
  });
  return date.toISOString().split('T')[0];
};

const generateAddressValue = (constraints: AddressConstraints): string => {
  if (constraints.city) {
    return `${constraints.city}${faker.location.streetAddress()}`;
  }
  return faker.location.streetAddress();
};

const generateValueByType = (rule: FieldRule): string | number => {
  switch (rule.type) {
    case 'string':
      return generateStringValue(rule.constraints as StringConstraints);
    case 'number':
      return generateNumberValue(rule.constraints as NumberConstraints);
    case 'email':
      return generateEmailValue();
    case 'date':
      return generateDateValue(rule.constraints as DateConstraints);
    case 'address':
      return generateAddressValue(rule.constraints as AddressConstraints);
    default:
      return '';
  }
};

export const generateData = (rules: FieldRule[], count: number): DataRow[] => {
  if (rules.length === 0) return [];
  
  const sortedRules = [...rules].sort((a, b) => a.sortIndex - b.sortIndex);
  const data: DataRow[] = [];
  
  for (let i = 0; i < count; i++) {
    const row: DataRow = {};
    for (const rule of sortedRules) {
      row[rule.fieldName] = generateValueByType(rule);
    }
    data.push(row);
  }
  
  return data;
};
