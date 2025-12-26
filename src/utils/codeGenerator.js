const generateUniqueCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '&@#$!%*';

    const getRandom = (source, count) => {
        let result = '';
        for (let i = 0; i < count; i++) {
            result += source.charAt(Math.floor(Math.random() * source.length));
        }
        return result;
    };

    const part1 = getRandom(numbers, 3);
    const separator = getRandom(symbols, 1);
    const part2 = getRandom(chars, 3);

    return `YAM-${part1}${separator}${part2}`;
};

module.exports = { generateUniqueCode };
