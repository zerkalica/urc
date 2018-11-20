export function uuid(): string {
    return `${Math.random()}${Date.now()}`.substring(2)
}
