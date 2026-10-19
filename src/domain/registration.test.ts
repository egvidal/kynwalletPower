import { MESSAGES } from './messages';
import { validateRegistration, type RegistrationData } from './registration';

const valid: RegistrationData = {
  fullName: 'Diego Martínez',
  email: 'diego@example.test',
  password: 'secreto-123',
  confirmPassword: 'secreto-123',
  acceptedTerms: true,
};

describe('validateRegistration (data-model.md)', () => {
  it('datos válidos → {}', () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  describe('fullName: "Obligatorio; recortado, de 2 a 100 caracteres"', () => {
    it.each(['', '   '])('vacío o solo espacios (%j) → FULL_NAME_REQUIRED', (fullName) => {
      expect(validateRegistration({ ...valid, fullName }).fullName).toBe(
        MESSAGES.FULL_NAME_REQUIRED,
      );
    });

    it('1 carácter → FULL_NAME_TOO_SHORT', () => {
      expect(validateRegistration({ ...valid, fullName: 'A' }).fullName).toBe(
        MESSAGES.FULL_NAME_TOO_SHORT,
      );
    });

    it('101 caracteres → FULL_NAME_TOO_LONG', () => {
      expect(validateRegistration({ ...valid, fullName: 'a'.repeat(101) }).fullName).toBe(
        MESSAGES.FULL_NAME_TOO_LONG,
      );
    });

    it('100 caracteres es válido', () => {
      expect(validateRegistration({ ...valid, fullName: 'a'.repeat(100) })).toEqual({});
    });

    it('US1-4: los espacios periféricos no cuentan ("  Ana  " es válido)', () => {
      expect(validateRegistration({ ...valid, fullName: '  Ana  ' })).toEqual({});
    });
  });

  describe('email: "Obligatorio; formato de correo; ≤ 254 caracteres; se recorta"', () => {
    it('vacío → EMAIL_REQUIRED', () => {
      expect(validateRegistration({ ...valid, email: '' }).email).toBe(MESSAGES.EMAIL_REQUIRED);
    });

    it.each(['usuario@', 'usuario.com'])('US2-2: %s → EMAIL_INVALID', (email) => {
      expect(validateRegistration({ ...valid, email }).email).toBe(MESSAGES.EMAIL_INVALID);
    });

    it('US1-4: espacios periféricos en el correo son válidos', () => {
      expect(validateRegistration({ ...valid, email: '  diego@example.test ' })).toEqual({});
    });
  });

  describe('password: "Obligatorio; de 8 a 128 caracteres; no se recorta"', () => {
    const withPassword = (password: string) =>
      validateRegistration({ ...valid, password, confirmPassword: password });

    it('vacía → PASSWORD_REQUIRED', () => {
      expect(withPassword('').password).toBe(MESSAGES.PASSWORD_REQUIRED);
    });

    it('US2-3: 7 caracteres → PASSWORD_TOO_SHORT', () => {
      expect(withPassword('1234567').password).toBe(MESSAGES.PASSWORD_TOO_SHORT);
    });

    it('129 caracteres → PASSWORD_TOO_LONG', () => {
      expect(withPassword('a'.repeat(129)).password).toBe(MESSAGES.PASSWORD_TOO_LONG);
    });

    it('un espacio cuenta como carácter (" 1234567" es válido)', () => {
      expect(withPassword(' 1234567')).toEqual({});
    });
  });

  describe('confirmPassword: "Obligatorio; igual a password, carácter por carácter"', () => {
    it('vacía → CONFIRM_PASSWORD_REQUIRED', () => {
      expect(validateRegistration({ ...valid, confirmPassword: '' }).confirmPassword).toBe(
        MESSAGES.CONFIRM_PASSWORD_REQUIRED,
      );
    });

    it('US2-4: distinta → PASSWORDS_DO_NOT_MATCH', () => {
      expect(
        validateRegistration({ ...valid, confirmPassword: 'otra-clave-1' }).confirmPassword,
      ).toBe(MESSAGES.PASSWORDS_DO_NOT_MATCH);
    });

    it('un espacio final la hace distinta ("Clave123 " ≠ "Clave123")', () => {
      expect(
        validateRegistration({ ...valid, password: 'Clave123', confirmPassword: 'Clave123 ' })
          .confirmPassword,
      ).toBe(MESSAGES.PASSWORDS_DO_NOT_MATCH);
    });
  });

  it('acceptedTerms: "Debe ser true" (false → TERMS_REQUIRED)', () => {
    expect(validateRegistration({ ...valid, acceptedTerms: false }).acceptedTerms).toBe(
      MESSAGES.TERMS_REQUIRED,
    );
  });

  it('US2-1: con todo vacío devuelve los cinco errores a la vez', () => {
    expect(
      validateRegistration({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptedTerms: false,
      }),
    ).toEqual({
      fullName: MESSAGES.FULL_NAME_REQUIRED,
      email: MESSAGES.EMAIL_REQUIRED,
      password: MESSAGES.PASSWORD_REQUIRED,
      confirmPassword: MESSAGES.CONFIRM_PASSWORD_REQUIRED,
      acceptedTerms: MESSAGES.TERMS_REQUIRED,
    });
  });
});
