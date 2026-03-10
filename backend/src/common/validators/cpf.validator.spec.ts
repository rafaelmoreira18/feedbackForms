import { IsCpfConstraint } from './cpf.validator';

describe('IsCpfConstraint', () => {
  let constraint: IsCpfConstraint;

  beforeEach(() => {
    constraint = new IsCpfConstraint();
  });

  describe('valid CPFs', () => {
    it('accepts a known-valid CPF (529.982.247-25)', () => {
      expect(constraint.validate('52998224725')).toBe(true);
    });

    it('accepts another valid CPF (111.444.777-35)', () => {
      expect(constraint.validate('11144477735')).toBe(true);
    });
  });

  describe('format rejections', () => {
    it('rejects fewer than 11 digits', () => {
      expect(constraint.validate('1234567890')).toBe(false);
    });

    it('rejects more than 11 digits', () => {
      expect(constraint.validate('123456789012')).toBe(false);
    });

    it('rejects non-numeric input', () => {
      expect(constraint.validate('abc.def.ghi-jk')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(constraint.validate('')).toBe(false);
    });
  });

  describe('repeated-digit rejections', () => {
    it('rejects 00000000000', () => expect(constraint.validate('00000000000')).toBe(false));
    it('rejects 11111111111', () => expect(constraint.validate('11111111111')).toBe(false));
    it('rejects 22222222222', () => expect(constraint.validate('22222222222')).toBe(false));
    it('rejects 99999999999', () => expect(constraint.validate('99999999999')).toBe(false));
  });

  describe('checksum rejections', () => {
    it('rejects CPF with wrong first check digit', () => {
      // 52998224725 is valid — flip digit 9 to make first check wrong
      expect(constraint.validate('52998224715')).toBe(false);
    });

    it('rejects CPF with wrong second check digit', () => {
      // flip last digit
      expect(constraint.validate('52998224726')).toBe(false);
    });

    it('rejects a CPF that passes format but has an invalid second check digit', () => {
      // 52998224725 is valid — changing last digit to 4 breaks the second checksum
      expect(constraint.validate('52998224724')).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('returns a Portuguese error message', () => {
      expect(constraint.defaultMessage()).toBe('CPF inválido');
    });
  });
});
