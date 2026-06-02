export default function getLocalizedAddress(address, lang = 'vi') {
  if (!address) return '';

  const province =
    address.province?.[`name_${lang}`] || address.province?.name || '';
  const district =
    address.district?.[`name_${lang}`] || address.district?.name || '';
  const ward = address.ward?.[`name_${lang}`] || address.ward?.name || '';
  const detail = address.detail || '';

  return [detail, ward, district, province].filter(Boolean).join(', ');
}
