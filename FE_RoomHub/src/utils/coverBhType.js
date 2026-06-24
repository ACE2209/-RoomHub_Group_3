import i18n from 'i18next';

const coverBhType = (codeName, language) => {
    try {
        if (language) {
            return i18n.t(`common:accommodation_types.${codeName}`, { lng: language }) || codeName;
        } else {
            return i18n.t(`common:accommodation_types.${codeName}`) || codeName;
        }
    } catch (error) {
        console.warn(`Translation error for ${codeName}:`, error);
        return codeName;
    }
};

export default coverBhType;
