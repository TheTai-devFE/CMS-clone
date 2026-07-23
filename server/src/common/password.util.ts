import { randomBytes } from 'crypto';

/**
 * Sinh mật khẩu ngẫu nhiên an toàn cho user mới.
 *
 * Sử dụng crypto.randomBytes (CSPRNG) — bảo mật cao hơn Math.random.
 * Trả về password có chứa cả chữ thường, chữ hoa, số, ký tự đặc biệt.
 *
 * @param length độ dài mong muốn (mặc định 12, tối thiểu 8)
 * @returns password string
 *
 * Lưu ý: KHÔNG log password ra console. Chỉ trả về qua API response 1 lần duy nhất.
 */
export function randomPassword(length = 12): string {
  const MIN_LENGTH = 8;
  const finalLength = Math.max(length, MIN_LENGTH);

  // Tập ký tự: a-z, A-Z, 0-9, ký tự đặc biệt (bỏ các ký tự dễ nhầm: 0/O, 1/l/I)
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%^&*-_=+';
  const allChars = lowercase + uppercase + digits + symbols;

  // Lấy bytes ngẫu nhiên, chuyển thành chỉ số trong tập ký tự
  const bytes = randomBytes(finalLength * 2); // x2 để đủ entropy sau khi modulo
  const chars: string[] = [];

  for (let i = 0; i < bytes.length && chars.length < finalLength; i++) {
    const index = bytes[i] % allChars.length;
    chars.push(allChars[index]);
  }

  // Đảm bảo password có ít nhất 1 ký tự từ mỗi tập (tăng entropy thực tế)
  const result = chars.slice(0, finalLength);
  result[0] = lowercase[bytes[0] % lowercase.length];
  result[1] = uppercase[bytes[1] % uppercase.length];
  result[2] = digits[bytes[2] % digits.length];
  result[3] = symbols[bytes[3] % symbols.length];

  // Shuffle để tránh vị trí cố định của ký tự đặc biệt
  return shuffleString(result.join(''));
}

function shuffleString(str: string): string {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
