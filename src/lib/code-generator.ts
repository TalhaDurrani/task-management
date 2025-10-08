/**
 * Generates a unique, human-readable code (e.g., A1B2-C3D4)
 */
export function generateJoinCode(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  
  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length)
    code += alphabet[randomIndex]
  }
  
  // Add a hyphen for readability, e.g., ABCD-EFGH
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
