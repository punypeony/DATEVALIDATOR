/**
 * DFA for strict MM/DD/YYYY dates.
 *
 * The machine reads one character at a time. Month digits fan out into
 * three tracks (31-day, 30-day, February). February 29 is the only day
 * that enters the leap-year track. Every other valid day enters the
 * normal-year track, which accepts 0001–9999 and rejects 0000.
 *
 * Leap years follow the Gregorian rule: divisible by 4, except century
 * years, which must be divisible by 400. Year 0000 is rejected on both
 * tracks even though it is divisible by 400.
 */

export const SINK = 'sink';
export const ACCEPT = 'accept';

const isDigit = (ch) => ch >= '0' && ch <= '9';

function readNormalYear(state, ch) {
  if (!isDigit(ch)) return SINK;

  switch (state) {
    case 'qN':
      return ch === '0' ? 'qN0' : 'qNz1';
    case 'qN0':
      return ch === '0' ? 'qN00' : 'qNz2';
    case 'qN00':
      return ch === '0' ? 'qN000' : 'qNz3';
    case 'qN000':
      return ch === '0' ? SINK : ACCEPT;
    case 'qNz1':
      return 'qNz2';
    case 'qNz2':
      return 'qNz3';
    case 'qNz3':
      return ACCEPT;
    default:
      return SINK;
  }
}

/**
 * Leap-year track state: L<pos>:<hiMod>:<zeroSoFar>:<thirdDigit>
 * hiMod is the first two year digits modulo 4, needed for century years.
 * zeroSoFar stays 1 only while every year digit so far is 0.
 */
function readLeapYear(state, ch) {
  if (!isDigit(ch)) return SINK;

  if (state === 'qL') return `L1:${ch}`;

  if (state.startsWith('L1:')) {
    const hi = 10 * Number(state[3]) + Number(ch);
    return `L2:${hi % 4}:${hi === 0 ? 1 : 0}`;
  }

  if (state.startsWith('L2:')) {
    const [, mod, zero] = state.split(':');
    const stillZero = zero === '1' && ch === '0' ? 1 : 0;
    return `L3:${mod}:${stillZero}:${ch}`;
  }

  if (state.startsWith('L3:')) {
    const [, mod, zero, third] = state.split(':');
    const lastTwo = 10 * Number(third) + Number(ch);
    const century = third === '0' && ch === '0';
    const leap = century ? mod === '0' : lastTwo % 4 === 0;
    const yearZero = zero === '1' && ch === '0';
    if (leap && !yearZero) return ACCEPT;
    return SINK;
  }

  return SINK;
}

export function transition(state, ch) {
  switch (state) {
    case 'q0':
      if (ch === '0') return 'qM0';
      if (ch === '1') return 'qM1';
      return SINK;

    case 'qM0':
      if ('13578'.includes(ch)) return 'q31';
      if ('469'.includes(ch)) return 'q30';
      if (ch === '2') return 'qFeb';
      return SINK;

    case 'qM1':
      if (ch === '0' || ch === '2') return 'q31';
      if (ch === '1') return 'q30';
      return SINK;

    case 'q31':
      return ch === '/' ? 'q31/' : SINK;
    case 'q30':
      return ch === '/' ? 'q30/' : SINK;
    case 'qFeb':
      return ch === '/' ? 'qFeb/' : SINK;

    case 'q31/':
      if (ch === '0') return 'q31_0';
      if (ch === '1' || ch === '2') return 'q31_12';
      if (ch === '3') return 'q31_3';
      return SINK;
    case 'q31_0':
      return ch >= '1' && ch <= '9' ? 'qDay' : SINK;
    case 'q31_12':
      return isDigit(ch) ? 'qDay' : SINK;
    case 'q31_3':
      return ch === '0' || ch === '1' ? 'qDay' : SINK;

    case 'q30/':
      if (ch === '0') return 'q30_0';
      if (ch === '1' || ch === '2') return 'q30_12';
      if (ch === '3') return 'q30_3';
      return SINK;
    case 'q30_0':
      return ch >= '1' && ch <= '9' ? 'qDay' : SINK;
    case 'q30_12':
      return isDigit(ch) ? 'qDay' : SINK;
    case 'q30_3':
      return ch === '0' ? 'qDay' : SINK;

    case 'qFeb/':
      if (ch === '0') return 'qFeb_0';
      if (ch === '1') return 'qFeb_1';
      if (ch === '2') return 'qFeb_2';
      return SINK;
    case 'qFeb_0':
      return ch >= '1' && ch <= '9' ? 'qDay' : SINK;
    case 'qFeb_1':
      return isDigit(ch) ? 'qDay' : SINK;
    case 'qFeb_2':
      if (ch >= '0' && ch <= '8') return 'qDay';
      if (ch === '9') return 'qFeb29';
      return SINK;

    case 'qDay':
      return ch === '/' ? 'qN' : SINK;
    case 'qFeb29':
      return ch === '/' ? 'qL' : SINK;

    case 'qN':
    case 'qN0':
    case 'qN00':
    case 'qN000':
    case 'qNz1':
    case 'qNz2':
    case 'qNz3':
      return readNormalYear(state, ch);

    case ACCEPT:
    case SINK:
      return SINK;

    default:
      if (state === 'qL' || state.startsWith('L')) return readLeapYear(state, ch);
      return SINK;
  }
}

function rejectMessage(input, state, ch) {
  if (state === 'qN000' && ch === '0') return 'Year cannot be 0000.';

  if (state.startsWith('L3:')) {
    const zero = state.split(':')[2];
    if (zero === '1' && ch === '0') return 'Year cannot be 0000.';
    return 'February 29 is only valid in a leap year.';
  }

  if (state === 'q0' || state === 'qM0' || state === 'qM1') {
    if (!isDigit(ch)) return 'Month, day, and year must contain only numbers.';
    return 'Month must be between 01 and 12.';
  }

  if (
    state === 'q31' ||
    state === 'q30' ||
    state === 'qFeb' ||
    state === 'qDay' ||
    state === 'qFeb29'
  ) {
    return 'Missing or misplaced slashes. Format must be MM/DD/YYYY.';
  }

  if (state === ACCEPT) {
    return 'Date must be exactly MM/DD/YYYY (10 characters).';
  }

  if (state.startsWith('q31')) {
    if (!isDigit(ch)) return 'Month, day, and year must contain only numbers.';
    return 'Invalid day. This month has at most 31 days.';
  }

  if (state.startsWith('q30')) {
    if (!isDigit(ch)) return 'Month, day, and year must contain only numbers.';
    return 'Invalid day. This month has at most 30 days.';
  }

  if (state.startsWith('qFeb')) {
    if (!isDigit(ch)) return 'Month, day, and year must contain only numbers.';
    return 'Invalid day. February has 28 days, or 29 in a leap year.';
  }

  if (!isDigit(ch)) return 'Month, day, and year must contain only numbers.';
  return 'Date must be exactly MM/DD/YYYY (10 characters).';
}

export function validateDate(dateStr) {
  let state = 'q0';

  for (let i = 0; i < dateStr.length; i++) {
    const ch = dateStr[i];
    const next = transition(state, ch);
    if (next === SINK) {
      return { valid: false, message: rejectMessage(dateStr, state, ch) };
    }
    state = next;
  }

  if (state === ACCEPT) {
    return { valid: true, message: 'Date format is perfectly valid!' };
  }

  return {
    valid: false,
    message: 'Date must be exactly MM/DD/YYYY (10 characters).',
  };
}
