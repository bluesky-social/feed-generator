const politicalKeywords = [
  'chinh tri',
  'bau cu',
  'quoc hoi',
  'chinh phu',
  'chinh sach',
  'nghi quyet',
  'bo truong',
  'thu tuong',
  'tong thong',
  'dang cong san',
  'bien dong',
  'nhan quyen',
  'tham nhung',
  'ngoai giao',
  'chu quyen',
  'bieu tinh',
]

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')

export const isPoliticalPost = (text: string) => {
  const normalizedText = normalizeText(text)
  return politicalKeywords.some((keyword) => normalizedText.includes(keyword))
}