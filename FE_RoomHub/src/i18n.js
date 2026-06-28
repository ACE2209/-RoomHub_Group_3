import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import boardingHouseAdmin from './locales/vi/boardingHouseAdmin.json';
import boardingHouseDetailsAdmin from './locales/vi/boardingHouseDetailsAdmin.json';
import addBoardingHouseAdmin from './locales/vi/addBoardingHouseAdmin.json';
import filterBH from './locales/vi/filterBH.json';
import common from './locales/vi/common.json';
import profile from './locales/vi/profile.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        boardingHouseAdmin,
        boardingHouseDetailsAdmin,
        addBoardingHouseAdmin,
        filterBH,
        common,
        profile,
      },
    },
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
