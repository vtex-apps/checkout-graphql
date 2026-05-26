import { formatBusinessHoursList } from '../utils/pickup'

const bh = (
  DayOfWeek: number,
  OpeningTime: string,
  ClosingTime: string
): BusinessHour => ({
  DayOfWeek,
  OpeningTime,
  ClosingTime,
})

const closedDay = (dayNumber: number | string) => ({
  dayNumber,
  closed: true,
  openingTime: '',
  closingTime: '',
})

const openDay = (
  dayNumber: number | string,
  openingTime: string,
  closingTime: string
) => ({
  dayNumber,
  closed: false,
  openingTime,
  closingTime,
})

describe('utils/pickup — formatBusinessHoursList', () => {
  it('returns three condensed closed entries for empty input', () => {
    expect(formatBusinessHoursList([])).toEqual([
      closedDay('1to5'),
      closedDay(6),
      closedDay(0),
    ])
  })

  it('reorders input so that weekdays come before the weekend (1..6,0)', () => {
    // Provide all 7 days with distinct hours so the condensing branch is skipped.
    const hours = [
      bh(0, '00:00', '02:00'),
      bh(3, '12:00', '13:00'),
      bh(5, '15:00', '15:30'),
      bh(1, '09:00', '17:00'),
      bh(6, '10:00', '14:00'),
      bh(2, '10:00', '17:00'),
      bh(4, '13:00', '14:00'),
    ]

    const result = formatBusinessHoursList(hours)

    expect(result.map(d => d.dayNumber)).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it('condenses Mon-Fri into "1to5" when Mon-Thu share the same hours', () => {
    const hours = [
      bh(1, '09:00', '18:00'),
      bh(2, '09:00', '18:00'),
      bh(3, '09:00', '18:00'),
      bh(4, '09:00', '18:00'),
      bh(5, '09:00', '18:00'),
      bh(6, '10:00', '14:00'),
      bh(0, '10:00', '14:00'),
    ]

    expect(formatBusinessHoursList(hours)).toEqual([
      openDay('1to5', '09:00', '18:00'),
      openDay(6, '10:00', '14:00'),
      openDay(0, '10:00', '14:00'),
    ])
  })

  it('does not condense when Mon-Thu hours differ', () => {
    const hours = [
      bh(1, '09:00', '18:00'),
      bh(2, '08:00', '18:00'),
      bh(3, '09:00', '18:00'),
      bh(4, '09:00', '18:00'),
      bh(5, '09:00', '18:00'),
      bh(6, '10:00', '14:00'),
      bh(0, '10:00', '14:00'),
    ]

    expect(formatBusinessHoursList(hours)).toEqual([
      openDay(1, '09:00', '18:00'),
      openDay(2, '08:00', '18:00'),
      openDay(3, '09:00', '18:00'),
      openDay(4, '09:00', '18:00'),
      openDay(5, '09:00', '18:00'),
      openDay(6, '10:00', '14:00'),
      openDay(0, '10:00', '14:00'),
    ])
  })

  it('marks days not present in input as closed', () => {
    const hours = [bh(6, '10:00', '14:00')]

    expect(formatBusinessHoursList(hours)).toEqual([
      closedDay('1to5'),
      openDay(6, '10:00', '14:00'),
      closedDay(0),
    ])
  })

  // Locks current behaviour: the equality check only compares Mon-Thu but the
  // condensing step covers Mon-Fri, so Friday's hours are lost whenever Mon-Thu
  // match — even if Friday differs. Re-evaluate this test if/when the bug is
  // intentionally fixed.
  it('uses Monday hours for the whole 1to5 block when Mon-Thu match (Friday is dropped)', () => {
    const hours = [
      bh(1, '09:00', '18:00'),
      bh(2, '09:00', '18:00'),
      bh(3, '09:00', '18:00'),
      bh(4, '09:00', '18:00'),
      bh(5, '09:00', '13:00'), // distinct Friday
      bh(6, '10:00', '14:00'),
      bh(0, '10:00', '14:00'),
    ]

    expect(formatBusinessHoursList(hours)).toEqual([
      openDay('1to5', '09:00', '18:00'),
      openDay(6, '10:00', '14:00'),
      openDay(0, '10:00', '14:00'),
    ])
  })
})
