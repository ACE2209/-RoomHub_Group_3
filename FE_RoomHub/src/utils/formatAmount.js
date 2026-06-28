import i18n from 'i18next';

const USD_TO_VND_RATE = 25000;

const formatAmount = (amount, options = {}) => {
  const {
    showCurrency = true,
    showFullFormat = false,
    customRate = USD_TO_VND_RATE,
    forceLanguage = null
  } = options;

  if (!amount || amount === 0) {
    const currentLang = forceLanguage || i18n.language;
    const isVietnamese = currentLang === 'vi' || currentLang.startsWith('vi');
    return isVietnamese ? '0₫' : '$0';
  }

  const currentLang = forceLanguage || i18n.language;
  const isVietnamese = currentLang === 'vi' || currentLang.startsWith('vi');

  let finalAmount = amount;
  let currencySymbol = '';
  let locale = 'vi-VN';

  if (isVietnamese) {
    finalAmount = amount;
    currencySymbol = '₫';
    locale = 'vi-VN';
  } else {
    finalAmount = amount / customRate;
    currencySymbol = '$';
    locale = 'en-US';
  }

  if (showFullFormat) {
    if (showCurrency) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: isVietnamese ? 'VND' : 'USD',
        minimumFractionDigits: isVietnamese ? 0 : 2,
        maximumFractionDigits: isVietnamese ? 0 : 2
      }).format(finalAmount);
    } else {
      return new Intl.NumberFormat(locale).format(finalAmount);
    }
  }

  let formattedNumber = '';
  let suffix = '';

  if (finalAmount >= 1e9) {
    formattedNumber = (finalAmount / 1e9).toFixed(1);
    suffix = 'B';
  } else if (finalAmount >= 1e6) {
    formattedNumber = (finalAmount / 1e6).toFixed(1);
    suffix = 'M';
  } else if (finalAmount >= 1e3) {
    formattedNumber = (finalAmount / 1e3).toFixed(1);
    suffix = 'K';
  } else {
    if (isVietnamese) {
      formattedNumber = Math.round(finalAmount).toString();
    } else {
      formattedNumber = finalAmount.toFixed(2);
    }
  }

  formattedNumber = formattedNumber.replace(/\.0$/, '');

  if (showCurrency) {
    return isVietnamese
      ? `${formattedNumber}${suffix}${currencySymbol}`
      : `${currencySymbol}${formattedNumber}${suffix}`;
  } else {
    return `${formattedNumber}${suffix}`;
  }
};

export default formatAmount;
