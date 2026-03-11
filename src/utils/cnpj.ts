export function stripCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
}

export function formatCNPJ(cnpj: string): string {
    const v = stripCNPJ(cnpj);
    return v
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18);
}

export function validateCNPJ(cnpj: string): boolean {
    if (!cnpj) return false;
    const numbers = stripCNPJ(cnpj);

    if (numbers.length !== 14) return false;

    // Rejeita sequências iguais (ex: 00000000000000)
    if (/^(\d)\1+$/.test(numbers)) return false;

    // Validação do 1º dígito
    let length = numbers.length - 2;
    let numbersPart = numbers.substring(0, length);
    const digitsPart = numbers.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += Number(numbersPart.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number(digitsPart.charAt(0))) return false;

    // Validação do 2º dígito
    length += 1;
    numbersPart = numbers.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
        sum += Number(numbersPart.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number(digitsPart.charAt(1))) return false;

    return true;
}
