import type { TestForm, TestItem } from '@/engine/types';

/**
 * Pre/post test bank (A2). 12 items, two forms. Items never appear inside the
 * cases. Each form: 3 scam + 3 legit, 3 polished + 3 sloppy (validated by
 * scripts/validate-content.ts). Every item has exactly 4 first actions and
 * exactly one of them is "verify through another channel".
 */

function actions(id: string, otherIndex: 0 | 1 | 2 | 3) {
  return [0, 1, 2, 3].map((i) => ({
    id: `${id}.act${i + 1}`,
    textKey: `test.${id}.act${i + 1}`,
    otherChannel: i === otherIndex,
  }));
}

function item(
  id: string,
  form: TestForm,
  truth: TestItem['truth'],
  polished: boolean,
  savedContact: boolean,
  otherIndex: 0 | 1 | 2 | 3,
): TestItem {
  return {
    id,
    form,
    truth,
    polished,
    savedContact,
    senderKey: `test.${id}.sender`,
    textKey: `test.${id}.text`,
    firstActions: actions(id, otherIndex),
  };
}

export const TEST_BANK: TestItem[] = [
  // Form A
  item('A1', 'A', 'scam', true, false, 2),
  item('A2', 'A', 'scam', true, false, 2),
  item('A3', 'A', 'scam', false, false, 2),
  item('A4', 'A', 'legit', true, false, 1),
  item('A5', 'A', 'legit', false, true, 2),
  item('A6', 'A', 'legit', false, true, 1),
  // Form B
  item('B1', 'B', 'scam', true, false, 2),
  item('B2', 'B', 'scam', false, false, 2),
  item('B3', 'B', 'scam', false, false, 2),
  item('B4', 'B', 'legit', true, false, 0),
  item('B5', 'B', 'legit', true, false, 0),
  item('B6', 'B', 'legit', false, false, 1),
];

export function itemsForForm(form: TestForm): TestItem[] {
  return TEST_BANK.filter((i) => i.form === form);
}
