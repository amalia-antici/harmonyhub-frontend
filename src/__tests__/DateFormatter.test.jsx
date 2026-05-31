import { expect, test } from 'vitest';
import { formatDate, formatTime} from "../utils/dateFormater";


test('formats ISO string to long date format', () => {
  const date = "2026-03-12T18:00";
  expect(formatDate(date)).toBe("March 12, 2026");
});

test('formats ISO string to 24h time', () => {
  const date = "2026-03-12T18:00";
  expect(formatTime(date)).toBe("18:00");
});