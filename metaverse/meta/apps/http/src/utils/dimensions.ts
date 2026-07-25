export function parseDimensions(dim: string): { width: number; height: number } {
    const parts = dim ? dim.split("x") : [];
    const width = parseInt(parts[0] || "0", 10);
    const height = parseInt(parts[1] || "0", 10);
    return {
        width: isNaN(width) ? 0 : width,
        height: isNaN(height) ? 0 : height,
    };
}
