export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('ru', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp * 1000)
}

export function formatDay(timestamp: number) {
  const date = new Date(timestamp * 1000)
  if (date.toDateString() === new Date().toDateString()) return 'Сегодня'
  return new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function formatPhone(phone: number | string) {
  const value = String(phone)
  if (/^7\d{10}$/.test(value))
    return `+7 ${value.slice(1, 4)} ${value.slice(4, 7)}-${value.slice(7, 9)}-${value.slice(9)}`
  return `+${value}`
}

export function initials(name: string) {
  if (name.startsWith('+')) return '#'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}
