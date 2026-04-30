import { validate } from 'class-validator';
import { TimeRangeQueryDto } from './time-range-query.dto';

describe('TimeRangeQueryDto', () => {
  describe('validation', () => {
    it('should pass validation with valid ISO 8601 date strings', async () => {
      const dto = new TimeRangeQueryDto();
      dto.startTime = '2024-01-01T00:00:00.000Z';
      dto.endTime = '2024-01-31T23:59:59.999Z';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when startTime is missing', async () => {
      const dto = new TimeRangeQueryDto();
      dto.endTime = '2024-01-31T23:59:59.999Z';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('startTime');
    });

    it('should fail validation when endTime is missing', async () => {
      const dto = new TimeRangeQueryDto();
      dto.startTime = '2024-01-01T00:00:00.000Z';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('endTime');
    });

    it('should fail validation when startTime is not a valid date string', async () => {
      const dto = new TimeRangeQueryDto();
      dto.startTime = 'invalid-date';
      dto.endTime = '2024-01-31T23:59:59.999Z';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('startTime');
    });

    it('should fail validation when endTime is not a valid date string', async () => {
      const dto = new TimeRangeQueryDto();
      dto.startTime = '2024-01-01T00:00:00.000Z';
      dto.endTime = 'invalid-date';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('endTime');
    });

    it('should pass validation with different valid ISO 8601 formats', async () => {
      const dto = new TimeRangeQueryDto();
      dto.startTime = '2024-01-01';
      dto.endTime = '2024-01-31T23:59:59Z';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
