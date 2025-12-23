const generateUniqueCode = () => {
    const prefix = 'AMOUR';
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
    return `${prefix}-${randomNum}`;
};

module.exports = { generateUniqueCode };
