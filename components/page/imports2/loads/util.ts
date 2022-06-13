export function getStdLowerName(name: string): string {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/\s\s+/g, ' ');
}