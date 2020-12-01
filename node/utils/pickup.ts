const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]
const MONDAY_INDEX = 0
const FRIDAY_INDEX = 4

const normalizeBusinessHours = (businessHours: BusinessHour[]) => {
  return DAYS_ORDER.map(dayNumber => {
    const day = businessHours.find(bh => dayNumber === bh.DayOfWeek)

    const dayObject = day && {
      closed: false,
      openingTime: day.OpeningTime,
      closingTime: day.ClosingTime,
    }

    return {
      dayNumber,
      closed: true,
      openingTime: '',
      closingTime: '',
      ...(dayObject ?? {}),
    }
  })
}

const doesWeekDaysHaveTheSameHours = (
  businessHours: NormalizedBusinessHour[]
) => {
  const weekDays = businessHours.slice(MONDAY_INDEX, FRIDAY_INDEX)

  const firstOpeningTime = weekDays[0].openingTime
  const firstClosingTime = weekDays[0].closingTime

  for (let i = 1; i < weekDays.length; i++) {
    const currentDay = weekDays[i]

    if (
      currentDay.openingTime !== firstOpeningTime ||
      currentDay.closingTime !== firstClosingTime
    ) {
      return false
    }
  }

  return true
}

const condenseWeekDaysHours = (businessHours: NormalizedBusinessHour[]) => {
  return businessHours.reduce(
    (
      acc: NormalizedBusinessHour[],
      businessHour: NormalizedBusinessHour,
      index: number
    ) => {
      if (index >= MONDAY_INDEX && index <= FRIDAY_INDEX) {
        if (index === MONDAY_INDEX) {
          return acc.concat({
            dayNumber: '1to5',
            closed: businessHour.closed,
            openingTime: businessHour.openingTime,
            closingTime: businessHour.closingTime,
          })
        }
        return acc
      }

      return acc.concat(businessHour)
    },
    []
  )
}

export function formatBusinessHoursList(businessHours: BusinessHour[]) {
  const normalizedBusinessHours = normalizeBusinessHours(businessHours)

  const weekDaysHaveTheSameHours = doesWeekDaysHaveTheSameHours(
    normalizedBusinessHours
  )

  if (weekDaysHaveTheSameHours) {
    return condenseWeekDaysHours(normalizedBusinessHours)
  }

  return normalizedBusinessHours
}
