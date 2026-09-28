const jwtPassword = process.env.JWT_PASSWORD;
if (!jwtPassword) throw new Error("JWT_PASSWORD must be set before starting the HTTP API");
export const JWT_PASSWORD: string = jwtPassword;
