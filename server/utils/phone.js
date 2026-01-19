export const normalizePhone = (phone) => {
    if (!phone) return '';

    let cleaned = phone.replace(/\D/g, '');
    cleaned = cleaned.replace(/^0+/, '');

    return cleaned;
};

export const phonesMatch = (phone1, phone2) => {
    return normalizePhone(phone1) === normalizePhone(phone2);
};
